import { PricingEngine, PricingSignals } from './pricing.engine';
export declare class PricingService {
    private readonly engine;
    constructor(engine: PricingEngine);
    calculatePrice(departureId: string): Promise<{
        signals: PricingSignals;
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
    getStoredDecisions(departureId: string): Promise<({
        rule: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            condition: import("@prisma/client/runtime/library").JsonValue;
            action: import("@prisma/client/runtime/library").JsonValue;
            priority: number;
            isActive: boolean;
            version: number;
        };
    } & {
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
    })[]>;
    applyPrice(decisionId: string): Promise<{
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
