import { BookingService } from './booking.service';
export declare class BookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    createBooking(req: any, body: any): Promise<{
        lockId: string;
        id: string;
        userId: string;
        departureId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        seatsBooked: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    confirmBooking(body: any): Promise<{
        id: string;
        userId: string;
        departureId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        seatsBooked: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMyBookings(req: any): Promise<({
        departure: {
            package: {
                id: string;
                slug: string;
                title: string;
                description: string;
                basePrice: import("@prisma/client/runtime/library").Decimal;
                costPerSeat: import("@prisma/client/runtime/library").Decimal;
                durationDays: number;
                type: string;
                mediaGallery: string[];
                itinerary: import(".prisma/client").Prisma.JsonValue | null;
                createdAt: Date;
                updatedAt: Date;
                version: number;
                requirements: import(".prisma/client").Prisma.JsonValue | null;
                costStructure: import(".prisma/client").Prisma.JsonValue | null;
                healthScore: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            packageId: string;
            startDate: Date;
            endDate: Date;
            totalSeats: number;
            availableSeats: number;
            costOverride: import("@prisma/client/runtime/library").Decimal | null;
            priceOverride: import("@prisma/client/runtime/library").Decimal | null;
            vehicleId: string | null;
            guideId: string | null;
            healthScore: import("@prisma/client/runtime/library").Decimal;
            opsStatus: string;
        };
    } & {
        id: string;
        userId: string;
        departureId: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        source: import(".prisma/client").$Enums.BookingSource;
        seatsBooked: number;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
