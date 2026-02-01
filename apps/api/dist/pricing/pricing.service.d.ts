import { PricingEngine, PricingSignals } from './pricing.engine';
export declare class PricingService {
    private readonly engine;
    constructor(engine: PricingEngine);
    calculatePrice(departureId: string): Promise<{
        signals: PricingSignals;
        id: string;
        departureId: string;
        ruleId: string | null;
        originalPrice: import("@prisma/client/runtime/library").Decimal;
        newPrice: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        confidence: import("@prisma/client/runtime/library").Decimal;
        applied: boolean;
        snapshotId: string;
        createdAt: Date;
    }>;
    getStoredDecisions(departureId: string): Promise<({
        rule: {
            id: string;
            name: string;
            description: string | null;
            condition: import(".prisma/client").Prisma.JsonValue;
            action: import(".prisma/client").Prisma.JsonValue;
            priority: number;
            isActive: boolean;
            version: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        departureId: string;
        ruleId: string | null;
        originalPrice: import("@prisma/client/runtime/library").Decimal;
        newPrice: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        confidence: import("@prisma/client/runtime/library").Decimal;
        applied: boolean;
        snapshotId: string;
        createdAt: Date;
    })[]>;
    applyPrice(decisionId: string): Promise<{
        id: string;
        departureId: string;
        ruleId: string | null;
        originalPrice: import("@prisma/client/runtime/library").Decimal;
        newPrice: import("@prisma/client/runtime/library").Decimal;
        reason: string;
        confidence: import("@prisma/client/runtime/library").Decimal;
        applied: boolean;
        snapshotId: string;
        createdAt: Date;
    }>;
}
