export declare class HotelBookingsService {
    createBooking(userId: string, data: any): Promise<{
        hotel: {
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
        };
        items: {
            id: string;
            bookingId: string;
            roomTypeId: string;
            quantity: number;
            pricePerNight: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        userId: string;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(userId?: string): Promise<({
        hotel: {
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
        };
        items: ({
            roomType: {
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
            };
        } & {
            id: string;
            bookingId: string;
            roomTypeId: string;
            quantity: number;
            pricePerNight: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        userId: string;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        hotel: {
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
        };
        items: ({
            roomType: {
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
            };
        } & {
            id: string;
            bookingId: string;
            roomTypeId: string;
            quantity: number;
            pricePerNight: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        userId: string;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        userId: string;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
