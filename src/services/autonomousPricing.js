import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Autonomous Pricing Engine
 * "Autopilot" for pricing with manual override safety.
 */

// Safety Guardrails
const MIN_MARGIN_PERCENT = 0.15; // 15% guaranteed margin
const MAX_MULTIPLIER = 2.0;      // Never charge more than 2x base price

// Strategy Definitions
const STRATEGIES = {
    CONSERVATIVE: {
        name: "Conservative (Volume First)",
        description: "Keeps prices lower to ensure high occupancy.",
        occupancyThreshold: 80, // Only raise price if > 80% full
        priceIncreaseStep: 0.05, // +5%
        priceDecreaseStep: 0.10  // -10% if empty
    },
    BALANCED: {
        name: "Balanced (Revenue Opt.)",
        description: "Standard dynamic pricing logic.",
        occupancyThreshold: 60,
        priceIncreaseStep: 0.10, // +10%
        priceDecreaseStep: 0.05  // -5%
    },
    AGGRESSIVE: {
        name: "Aggressive (Profit Max)",
        description: "Pushes for highest possible rate.",
        occupancyThreshold: 40, // Raise price early
        priceIncreaseStep: 0.15, // +15%
        priceDecreaseStep: 0.02  // -2% (Resistant to dropping)
    }
};

/**
 * Calculates the next optimal price based on AI logic.
 * 
 * @param {Object} context
 * @param {number} context.currentPrice - Current selling price
 * @param {number} context.basePrice - Standard "Retail" price
 * @param {number} context.costPrice - Absolute floor cost
 * @param {number} context.occupancyPercent - 0 to 100
 * @param {number} context.demandScore - 0 to 100 (Velocity/Search traffic)
 * @param {string} context.strategy - 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'
 * @param {string} context.resourceId - ID of hotel/room
 * @param {string} context.resourceType - 'hotel' | 'tour'
 */
export const suggestOptimalPrice = async ({
    currentPrice,
    basePrice,
    costPrice,
    occupancyPercent,
    demandScore = 50,
    strategy = 'BALANCED',
    resourceId,
    resourceType
}) => {
    const config = STRATEGIES[strategy] || STRATEGIES.BALANCED;
    let newPrice = currentPrice;
    let reason = "Maintained price.";
    let action = "HOLD";

    // 1. Calculate Hard Limits (The Box)
    const minSafePrice = costPrice * (1 + MIN_MARGIN_PERCENT);
    const maxSafePrice = basePrice * MAX_MULTIPLIER;

    // 2. AI Logic Loop
    // High Demand / High Occupancy -> RAISE
    if (occupancyPercent >= config.occupancyThreshold || demandScore > 80) {
        const increase = currentPrice * config.priceIncreaseStep;
        newPrice = currentPrice + increase;
        action = "INCREASE";
        reason = `High Occupancy (${occupancyPercent}%) or Demand (${demandScore}). Strategy: ${strategy}.`;
    }
    // Low Demand / Low Occupancy -> LOWER
    else if (occupancyPercent < (config.occupancyThreshold / 2) && demandScore < 40) {
        const decrease = currentPrice * config.priceDecreaseStep;
        newPrice = currentPrice - decrease;
        action = "DECREASE";
        reason = `Low Occupancy (${occupancyPercent}%) and Demand (${demandScore}). Strategy: ${strategy}.`;
    }

    // 3. Safety Check (Clamp)
    let finalPrice = Math.round(newPrice);
    let constrained = false;

    if (finalPrice < minSafePrice) {
        finalPrice = Math.ceil(minSafePrice);
        reason += " [Floored by Min Margin Safety]";
        constrained = true;
    }
    if (finalPrice > maxSafePrice) {
        finalPrice = Math.floor(maxSafePrice);
        reason += " [Capped by Max Multiplier Safety]";
        constrained = true;
    }

    // 4. Audit Logging (Asynchronous)
    if (finalPrice !== currentPrice) {
        try {
            await addDoc(collection(db, 'pricing_decisions'), {
                resourceId,
                resourceType,
                oldPrice: currentPrice,
                newPrice: finalPrice,
                strategyMode: strategy,
                occupancyPercent,
                demandScore,
                reason,
                action,
                constrained,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to log pricing decision", e);
        }
    }

    return {
        suggestedPrice: finalPrice,
        oldPrice: currentPrice,
        action,
        reason,
        minSafePrice,
        maxSafePrice
    };
};
