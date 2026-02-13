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
            healthScore: import("@prisma/client/runtime/library").Decimal;
            opsStatus: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        version: number;
        healthScore: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        title: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPerSeat: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        type: string;
        mediaGallery: string[];
        itinerary: import("@prisma/client/runtime/library").JsonValue | null;
        requirements: import("@prisma/client/runtime/library").JsonValue | null;
        costStructure: import("@prisma/client/runtime/library").JsonValue | null;
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
            healthScore: import("@prisma/client/runtime/library").Decimal;
            opsStatus: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        version: number;
        healthScore: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        title: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPerSeat: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        type: string;
        mediaGallery: string[];
        itinerary: import("@prisma/client/runtime/library").JsonValue | null;
        requirements: import("@prisma/client/runtime/library").JsonValue | null;
        costStructure: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createPackage(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        version: number;
        healthScore: import("@prisma/client/runtime/library").Decimal;
        slug: string;
        title: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        costPerSeat: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        type: string;
        mediaGallery: string[];
        itinerary: import("@prisma/client/runtime/library").JsonValue | null;
        requirements: import("@prisma/client/runtime/library").JsonValue | null;
        costStructure: import("@prisma/client/runtime/library").JsonValue | null;
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
        healthScore: import("@prisma/client/runtime/library").Decimal;
        opsStatus: string;
    }>;
}
