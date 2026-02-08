"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let HotelsService = class HotelsService {
    async createHotel(data) {
        return prisma.hotel.create({
            data: {
                slug: data.slug,
                name: data.name,
                description: data.description,
                city: data.city,
                address: data.address,
                rating: data.rating || 0,
                amenities: data.amenities || [],
                images: data.images || []
            }
        });
    }
    async findAll(query = {}) {
        const where = {};
        if (query.city) {
            where.city = { contains: query.city, mode: 'insensitive' };
        }
        return prisma.hotel.findMany({
            where,
            include: { rooms: true }
        });
    }
    async findOne(id) {
        const hotel = await prisma.hotel.findUnique({
            where: { id },
            include: {
                rooms: {
                    include: { availabilities: true }
                }
            }
        });
        if (!hotel)
            throw new common_1.NotFoundException(`Hotel with ID ${id} not found`);
        return hotel;
    }
    async update(id, data) {
        return prisma.hotel.update({
            where: { id },
            data
        });
    }
    async addRoomType(hotelId, data) {
        return prisma.roomType.create({
            data: {
                hotelId,
                name: data.name,
                description: data.description,
                basePrice: data.basePrice,
                capacity: data.capacity,
                amenities: data.amenities || [],
                images: data.images || []
            }
        });
    }
};
exports.HotelsService = HotelsService;
exports.HotelsService = HotelsService = __decorate([
    (0, common_1.Injectable)()
], HotelsService);
//# sourceMappingURL=hotels.service.js.map