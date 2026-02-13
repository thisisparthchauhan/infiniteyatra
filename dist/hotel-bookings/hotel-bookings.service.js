"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelBookingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let HotelBookingsService = class HotelBookingsService {
    async createBooking(userId, data) {
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
    async findAll(userId) {
        const where = {};
        if (userId)
            where.userId = userId;
        return prisma.hotelBooking.findMany({
            where,
            include: { hotel: true, items: { include: { roomType: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(id) {
        return prisma.hotelBooking.findUnique({
            where: { id },
            include: { hotel: true, items: { include: { roomType: true } } }
        });
    }
    async updateStatus(id, status) {
        const booking = await prisma.hotelBooking.update({
            where: { id },
            data: { status: status }
        });
        return booking;
    }
};
exports.HotelBookingsService = HotelBookingsService;
exports.HotelBookingsService = HotelBookingsService = __decorate([
    (0, common_1.Injectable)()
], HotelBookingsService);
//# sourceMappingURL=hotel-bookings.service.js.map