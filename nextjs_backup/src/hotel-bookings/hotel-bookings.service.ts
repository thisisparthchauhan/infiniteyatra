import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class HotelBookingsService {

    async createBooking(userId: string, data: any) {
        // data should contain { hotelId, roomTypeId, checkIn, checkOut, quantity, guests, totalPrice }

        // 1. Validate Availability (Simplistic check for now)
        // 2. Create Booking
        return prisma.hotelBooking.create({
            data: {
                userId,
                hotelId: data.hotelId,
                checkIn: new Date(data.checkIn),
                checkOut: new Date(data.checkOut),
                guests: data.guests,
                totalAmount: data.totalPrice,
                status: 'PENDING',
                items: {
                    create: {
                        roomTypeId: data.roomTypeId,
                        quantity: data.quantity || 1,
                        pricePerNight: data.pricePerNight,
                        totalPrice: data.totalPrice
                    }
                }
            },
            include: { items: true, hotel: true }
        });
    }

    async findAll(userId?: string) {
        const where: any = {};
        if (userId) where.userId = userId;

        return prisma.hotelBooking.findMany({
            where,
            include: { hotel: true, items: { include: { roomType: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return prisma.hotelBooking.findUnique({
            where: { id },
            include: { hotel: true, items: { include: { roomType: true } } }
        });
    }

    async updateStatus(id: string, status: any) {
        const booking = await prisma.hotelBooking.update({
            where: { id },
            // status is an enum type in Prisma, so standard string might need casting if strict
            data: { status: status }
        });
        return booking;
    }
}
