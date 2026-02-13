"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
const inventory_service_1 = require("../inventory/inventory.service");
const prisma = new client_1.PrismaClient();
let BookingService = class BookingService {
    constructor(eventEmitter, inventoryService) {
        this.eventEmitter = eventEmitter;
        this.inventoryService = inventoryService;
    }
    async createBooking(userId, data) {
        const { departureId, seats, totalAmount } = data;
        const { lockId } = await this.inventoryService.reserveSeats(departureId, seats, userId);
        try {
            const bookingResult = await prisma.$transaction(async (tx) => {
                const booking = await tx.booking.create({
                    data: {
                        userId,
                        departureId,
                        seatsBooked: seats,
                        totalAmount,
                        status: client_1.BookingStatus.PENDING,
                        paymentStatus: client_1.PaymentStatus.PENDING,
                        source: data.source || 'DIRECT',
                    },
                });
                await tx.transaction.create({
                    data: {
                        bookingId: booking.id,
                        amount: totalAmount,
                        type: 'PAYMENT',
                        status: 'PENDING',
                    },
                });
                return Object.assign(Object.assign({}, booking), { lockId });
            });
            return bookingResult;
        }
        catch (error) {
            await this.inventoryService.releaseSeats(departureId, lockId);
            throw error;
        }
    }
    async confirmBooking(bookingId, paymentReference, lockId) {
        try {
            const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking)
                throw new common_1.NotFoundException('Booking not found');
            await this.inventoryService.confirmSeats(booking.departureId, booking.seatsBooked, lockId, booking.id);
            const result = await prisma.$transaction(async (tx) => {
                const updatedBooking = await tx.booking.update({
                    where: { id: bookingId },
                    data: {
                        status: client_1.BookingStatus.CONFIRMED,
                        paymentStatus: client_1.PaymentStatus.PAID,
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
        }
        catch (error) {
            console.error('Booking Confirmation Failed:', error);
            throw error;
        }
    }
    async getUserBookings(userId) {
        return prisma.booking.findMany({
            where: { userId },
            include: { departure: { include: { package: true } } },
        });
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        inventory_service_1.InventoryService])
], BookingService);
//# sourceMappingURL=booking.service.js.map