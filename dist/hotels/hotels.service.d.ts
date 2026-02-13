export declare class HotelsService {
    createHotel(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        isActive: boolean;
        slug: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
    }>;
    findAll(query?: any): Promise<({
        rooms: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            capacity: number;
            amenities: string[];
            images: string[];
            hotelId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        isActive: boolean;
        slug: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        rooms: ({
            availabilities: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                priceOverride: import("@prisma/client/runtime/library").Decimal | null;
                date: Date;
                roomTypeId: string;
                totalRooms: number;
                bookedRooms: number;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal;
            capacity: number;
            amenities: string[];
            images: string[];
            hotelId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        isActive: boolean;
        slug: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        isActive: boolean;
        slug: string;
        city: string;
        address: string;
        rating: import("@prisma/client/runtime/library").Decimal;
        amenities: string[];
        images: string[];
        partnerId: string | null;
    }>;
    addRoomType(hotelId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        capacity: number;
        amenities: string[];
        images: string[];
        hotelId: string;
    }>;
}
