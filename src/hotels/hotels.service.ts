import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class HotelsService {

    async createHotel(data: any) {
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

    async findAll(query: any = {}) {
        const where: any = {};
        if (query.city) {
            where.city = { contains: query.city, mode: 'insensitive' };
        }
        return prisma.hotel.findMany({
            where,
            include: { rooms: true }
        });
    }

    async findOne(id: string) {
        const hotel = await prisma.hotel.findUnique({
            where: { id },
            include: {
                rooms: {
                    include: { availabilities: true }
                }
            }
        });
        if (!hotel) throw new NotFoundException(`Hotel with ID ${id} not found`);
        return hotel;
    }

    async update(id: string, data: any) {
        return prisma.hotel.update({
            where: { id },
            data
        });
    }

    async addRoomType(hotelId: string, data: any) {
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
}
