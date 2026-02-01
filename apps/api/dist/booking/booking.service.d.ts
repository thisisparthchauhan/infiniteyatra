import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryService } from '../inventory/inventory.service';
export declare class BookingService {
    private eventEmitter;
    private inventoryService;
    constructor(eventEmitter: EventEmitter2, inventoryService: InventoryService);
    createBooking(userId: string, data: any): Promise<{
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
    confirmBooking(bookingId: string, paymentReference: string, lockId: string): Promise<{
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
    getUserBookings(userId: string): Promise<({
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
