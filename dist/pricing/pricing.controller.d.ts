import { PricingService } from './pricing.service';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    analyzeDeparture(id: string): Promise<{
        signals: import("./pricing.engine").PricingSignals;
        id: string;
        createdAt: Date;
        departureId: string;
        originalPrice: import("@prisma/client/runtime/library").Decimal;
        newPrice: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        confidence: import("@prisma/client/runtime/library").Decimal;
        applied: boolean;
        ruleId: string | null;
        snapshotId: string;
    }>;
    applyPrice(id: string): Promise<{
        id: string;
        createdAt: Date;
        departureId: string;
        originalPrice: import("@prisma/client/runtime/library").Decimal;
        newPrice: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        confidence: import("@prisma/client/runtime/library").Decimal;
        applied: boolean;
        ruleId: string | null;
        snapshotId: string;
    }>;
}
