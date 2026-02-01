import { PricingRule } from '@prisma/client';
export type PricingSignals = {
    utilization: number;
    daysToDeparture: number;
    bookingVelocity: number;
    remainingSeats: number;
};
export declare class PricingEngine {
    evaluate(signals: PricingSignals, rules: PricingRule[], basePrice: number): {
        suggestedPrice: number;
        ruleId: string | null;
        reason: string;
    };
    private checkCondition;
}
