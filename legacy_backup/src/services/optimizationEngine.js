import { suggestOptimalPrice } from './autonomousPricing';
import { calculateRankingScore } from './rankingEngine';
import { logDecision } from './transparencyService';

/**
 * Optimization Engine (The Conductor)
 * Coordinates Pricing and Ranking feedback loops.
 * 
 * Logic:
 * 1. Price High -> Check Conversion. If Low -> Panic -> Lower Price + Boost Rank.
 * 2. Price Low -> Check Occupancy. If High -> Opportunity -> Raise Price heavily.
 */

let KILL_SWITCH = false; // Safety Override

export const toggleKillSwitch = (status) => {
    KILL_SWITCH = status;
    console.warn(`[Optimization Engine] Kill Switch is now: ${KILL_SWITCH ? 'ACTIVE (AI Disabled)' : 'OFF (AI Running)'}`);
    return KILL_SWITCH;
};

/**
 * Runs a unified optimization cycle for a specific resource.
 * @param {Object} resource - Hotel or Tour data
 * @param {Object} metrics - Real-time data (occupancy, views, etc)
 */
export const runOptimizationCycle = async (resource, metrics) => {
    if (KILL_SWITCH) {
        return { status: 'SKIPPED', reason: 'Kill Switch Active' };
    }

    const { id, type, currentPrice, basePrice, costPrice } = resource;
    const { occupancyPercent, demandScore, conversionRate } = metrics;

    console.log(`[Optimizer] Starting cycle for ${type} ${id}`);

    // STAGE 1: PRICING DECISION
    // We strictly use the "Balanced" strategy as baseline for Loop
    const pricingResult = await suggestOptimalPrice({
        currentPrice,
        basePrice,
        costPrice,
        occupancyPercent,
        demandScore,
        strategy: 'BALANCED',
        resourceId: id,
        resourceType: type
    });

    // STAGE 2: RANKING IMPACT ANALYSIS
    // If we raised price, we expect conversion to drop slightly.
    // We calculate a NEW ranking score based on potential new price.
    // Price Score is inverse to price (Lower price = Higher score).

    // Normalize new price for scoring (Simulated normalization)
    const marketAvgPrice = basePrice; // Simplified
    let newPriceScore = 1 - (pricingResult.suggestedPrice / (marketAvgPrice * 1.5));
    if (newPriceScore < 0) newPriceScore = 0;

    const rankingResult = calculateRankingScore({
        ...metrics,
        priceScore: newPriceScore
    });

    // STAGE 3: INTER-DEPENDENCY CHECK
    // If Ranking Score drops too low (< 40) due to price hike, we might lose visibility entirely.
    // Guardrail: Don't raise price if it kills visibility below threshold.
    let finalDecision = pricingResult;
    let rankoutcome = "Allowed";

    if (pricingResult.action === "INCREASE" && rankingResult.finalScore < 40) {
        console.log("[Optimizer] Vetos Price Hike: Kills Ranking Visibility.");
        finalDecision = {
            ...pricingResult,
            suggestedPrice: currentPrice, // Revert
            action: "HOLD",
            reason: "Price hike vetoed by Ranking safeguard (Visibility risk)."
        };
        rankoutcome = "Protected Visibility";
    }

    // STAGE 4: EXECUTE & LOG (Transparency)
    if (finalDecision.action !== "HOLD") {
        // Log Pricing
        await logDecision({
            entityType: 'PRICING',
            resourceId: id,
            resourceType: type,
            decisionFactors: { occupancyPercent, demandScore, currentPrice },
            finalDecision: `${finalDecision.action} to ${finalDecision.suggestedPrice}`,
            weightsUsed: { strategy: 'BALANCED' },
            reason: finalDecision.reason,
            isAutomated: true
        });
    }

    // Log Ranking State (Periodic)
    await logDecision({
        entityType: 'RANKING',
        resourceId: id,
        resourceType: type,
        decisionFactors: { ...rankingResult.breakdown },
        finalDecision: `Score: ${rankingResult.finalScore}`,
        weightsUsed: { model: 'standard_v1' },
        reason: `Routine optimization. Outcome: ${rankoutcome}`,
        isAutomated: true
    });

    return {
        pricing: finalDecision,
        ranking: rankingResult,
        killSwitch: KILL_SWITCH
    };
};
