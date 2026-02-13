export declare class HotelBookingsService {
    createBooking(userId: string, data: any): Promise<{
        hotel: {
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
        };
        items: {
            id: string;
            quantity: number;
            bookingId: string;
            roomTypeId: string;
            pricePerNight: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
    }>;
    findAll(userId?: string): Promise<({
        hotel: {
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
        };
        items: ({
            roomType: {
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
            };
        } & {
            id: string;
            quantity: number;
            bookingId: string;
            roomTypeId: string;
            pricePerNight: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
    })[]>;
    findOne(id: string): Promise<{
        hotel: {
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
        };
        items: ({
            roomType: {
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
            };
        } & {
            id: string;
            quantity: number;
            bookingId: string;
            roomTypeId: string;
            pricePerNight: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
    }>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        hotelId: string;
        checkIn: Date;
        checkOut: Date;
        guests: number;
    }>;
}
