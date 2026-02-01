import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    getPackages(): Promise<({
        departures: {
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
        }[];
    } & {
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
    })[]>;
    getPackage(slug: string): Promise<{
        departures: {
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
        }[];
    } & {
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
    }>;
    createPackage(body: any): Promise<{
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
    }>;
    addDeparture(body: any): Promise<{
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
    }>;
}
