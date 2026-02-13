import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, BookingStatus, PaymentStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryService } from '../inventory/inventory.service';

const prisma = new PrismaClient();

@Injectable()
export class BookingService {
    constructor(
        private eventEmitter: EventEmitter2,
        private inventoryService: InventoryService
    ) { }

    // ATOMIC BOOKING CREATION (The Heart)
    async createBooking(userId: string, data: any) {
        const { departureId, seats, totalAmount } = data;

        // 1. ACQUIRE LOCK (Redis - Fast & Atomic)
        // This throws BadRequestException if not enough seats
        const { lockId } = await this.inventoryService.reserveSeats(departureId, seats, userId);

        try {
            const bookingResult = await prisma.$transaction(async (tx) => {
                // 2. Create Booking Record (PENDING)
                const booking = await tx.booking.create({
                    data: {
                        userId,
                        departureId,
                        seatsBooked: seats,
                        totalAmount,
                        status: BookingStatus.PENDING,
                        paymentStatus: PaymentStatus.PENDING,
                        source: data.source || 'DIRECT',
                    },
                });

                // 3. Create Transaction Log
                await tx.transaction.create({
                    data: {
                        bookingId: booking.id,
                        amount: totalAmount,
                        type: 'PAYMENT',
                        status: 'PENDING',
                    },
                });

                // Store lockId temporarily in metadata or rely on userId/departureId combo for confirm
                // For v1, we assume the frontend sends the lockId back during confirmation or we handle it here.

                // In a real flow, we would return the payment link here.
                // The lock prevents overselling while user pays.
                return {
                    ...booking,
                    lockId // Return to frontend to pass back on confirm
                };
            });
            return bookingResult;
        } catch (error) {
            // Rollback Lock if DB fails
            await this.inventoryService.releaseSeats(departureId, lockId);
            throw error;
        }
    }

    // CONFIRM BOOKING (Payment Success)
    // NOTE: Frontend must pass lockId to ensure we commit the correct reservation
    async confirmBooking(bookingId: string, paymentReference: string, lockId: string) {
        try {
            const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking) throw new NotFoundException('Booking not found');

            // 1. Confirm Inventory (Hard Decrement in DB + Release Redis Lock)
            // This transforms the temporary Redis lock into a permanent DB state
            await this.inventoryService.confirmSeats(
                booking.departureId,
                booking.seatsBooked,
                lockId,
                booking.id
            );

            // 2. Update Booking & Transaction Status
            const result = await prisma.$transaction(async (tx) => {
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: BookingStatus.CONFIRMED,
                        paymentStatus: PaymentStatus.PAID,
                        amountPaid: booking.totalAmount,
                    },
                });

                await tx.transaction.updateMany({
                    where: { bookingId: bookingId, type: 'PAYMENT', status: 'PENDING' },
                    data: { status: 'SUCCESS', reference: paymentReference },
                });

                await tx.user.update({
                    where: { id: booking.userId },
                    data: { ltv: { increment: booking.totalAmount } },
                });

                return updatedBooking;
            });

            this.eventEmitter.emit('booking.confirmed', { bookingId });
            return result;

        } catch (error) {
            console.error('Booking Confirmation Failed:', error);
            // In production, trigger manual intervention alert or auto-refund
            throw error;
        }
    }

    async getUserBookings(userId: string) {
        return prisma.booking.findMany({
            where: { userId },
            include: { departure: { include: { package: true } } },
        });
    }
}
