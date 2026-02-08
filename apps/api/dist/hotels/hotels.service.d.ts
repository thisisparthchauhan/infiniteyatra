export declare class HotelsService {
    createHotel(data: any): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(query?: any): Promise<({
        rooms: {
            id: string;
            hotelId: string;
            name: string;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            capacity: number;
            amenities: string[];
            images: string[];
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        rooms: ({
            availabilities: {
                id: string;
                roomTypeId: string;
                date: Date;
                totalRooms: number;
                bookedRooms: number;
                priceOverride: import("@prisma/client/runtime/library").Decimal | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
        } & {
            id: string;
            hotelId: string;
            name: string;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            capacity: number;
            amenities: string[];
            images: string[];
            createdAt: Date;
            updatedAt: Date;
        })[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addRoomType(hotelId: string, data: any): Promise<{
        id: string;
        hotelId: string;
        name: string;
        description: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        capacity: number;
        amenities: string[];
        images: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
