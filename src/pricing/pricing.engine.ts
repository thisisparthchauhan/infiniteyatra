import { Injectable } from '@nestjs/common';
import { PrismaClient, PricingRule, Departure } from '@prisma/client';

export type PricingSignals = {
    utilization: number;      // 0-100
    daysToDeparture: number;  // days
    bookingVelocity: number;  // bookings/day
    remainingSeats: number;
};

@Injectable()
export class PricingEngine {

    evaluate(signals: PricingSignals, rules: PricingRule[], basePrice: number): {
        suggestedPrice: number;
        ruleId: string | null;
        reason: string;
    } {
        let price = basePrice;
        let appliedRule = null;

        // Simple Rule Engine Logic
        // Sort rules by priority
        const sortedRules = rules.sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            if (this.checkCondition(signals, rule.condition)) {
                const action = rule.action as any;

                if (action.type === 'MULTIPLY') {
                    price = price * action.value;
                } else if (action.type === 'ADD') {
                    price = price + action.value;
                }

                appliedRule = rule;
                break; // Apply highest priority rule only (for v1)
            }
        }

        // Default if no rules match
        if (!appliedRule) {
            return { suggestedPrice: basePrice, ruleId: null, reason: 'No pricing rules matched. Base price maintained.' };
        }

        return {
            suggestedPrice: price,
            ruleId: appliedRule.id,
            reason: appliedRule.name + ` (${appliedRule.description})`
        };
    }

    private checkCondition(signals: PricingSignals, condition: any): boolean {
        // Example Condition: { "utilization": { "gt": 80 }, "daysToDeparture": { "lt": 7 } }

        for (const [key, criteria] of Object.entries(condition)) {
            const signalValue = signals[key as keyof PricingSignals];
            const crit = criteria as any;

            if (crit.gt !== undefined && signalValue <= crit.gt) return false;
            if (crit.lt !== undefined && signalValue >= crit.lt) return false;
            if (crit.gte !== undefined && signalValue < crit.gte) return false;
            if (crit.lte !== undefined && signalValue > crit.lte) return false;
        }

        return true;
    }
}
