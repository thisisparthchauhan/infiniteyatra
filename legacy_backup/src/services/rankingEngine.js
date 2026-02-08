/**
 * Marketplace Ranking Algorithm
 * Calculates a weighted score for sorting listings.
 */

const WEIGHTS = {
    CONVERSION: 0.25,
    AVAILABILITY: 0.20,
    PRICE: 0.15,
    RATING: 0.15,
    RELIABILITY: 0.10, // Cancellation rate inverse
    SPONSORED: 0.10,
    FRESHNESS: 0.05
};

/**
 * Calculates the ranking score for a resource.
 * 
 * @param {Object} metrics
 * @param {number} metrics.conversionRate - 0 to 1 (e.g. 0.03 for 3%)
 * @param {number} metrics.availabilityScore - 0 to 1 (1 = fully available, 0 = booked)
 * @param {number} metrics.priceScore - 0 to 1 (normalized competitiveness vs market avg)
 * @param {number} metrics.rating - 0 to 5
 * @param {number} metrics.cancellationRate - 0 to 1 (e.g. 0.05 for 5%)
 * @param {boolean} metrics.isSponsored
 * @param {string} metrics.createdAt - ISO Date string
 * @returns {Object} { score (0-100), breakdown }
 */
export const calculateRankingScore = (metrics) => {
    // 1. Normalize Inputs to 0-100 scale
    const s_conversion = Math.min(metrics.conversionRate * 100 * 2, 100); // 50% conv rate = 100 score (unlikely high cap)
    const s_availability = metrics.availabilityScore * 100;
    const s_price = metrics.priceScore * 100;
    const s_rating = (metrics.rating / 5) * 100;
    const s_reliability = Math.max(0, 100 - (metrics.cancellationRate * 100 * 2)); // 50% cancel = 0 score
    const s_sponsored = metrics.isSponsored ? 100 : 0;

    // Freshness: Boost for first 30 days
    const daysOld = (new Date() - new Date(metrics.createdAt)) / (1000 * 60 * 60 * 24);
    const s_freshness = daysOld < 30 ? 100 : Math.max(0, 100 - (daysOld - 30));

    // 2. Weighted Sum
    let score =
        (s_conversion * WEIGHTS.CONVERSION) +
        (s_availability * WEIGHTS.AVAILABILITY) +
        (s_price * WEIGHTS.PRICE) +
        (s_rating * WEIGHTS.RATING) +
        (s_reliability * WEIGHTS.RELIABILITY) +
        (s_sponsored * WEIGHTS.SPONSORED) +
        (s_freshness * WEIGHTS.FRESHNESS);

    // 3. Return Logic
    return {
        finalScore: parseFloat(score.toFixed(2)),
        breakdown: {
            conversion: parseFloat((s_conversion * WEIGHTS.CONVERSION).toFixed(2)),
            availability: parseFloat((s_availability * WEIGHTS.AVAILABILITY).toFixed(2)),
            price: parseFloat((s_price * WEIGHTS.PRICE).toFixed(2)),
            rating: parseFloat((s_rating * WEIGHTS.RATING).toFixed(2)),
            reliability: parseFloat((s_reliability * WEIGHTS.RELIABILITY).toFixed(2)),
            sponsored: parseFloat((s_sponsored * WEIGHTS.SPONSORED).toFixed(2)),
            freshness: parseFloat((s_freshness * WEIGHTS.FRESHNESS).toFixed(2))
        }
    };
};

/**
 * Sorts a list of items based on ranking score.
 * @param {Array} items - List of hotels/tours with metrics attached.
 * @returns {Array} Sorted items
 */
export const rankItems = (items) => {
    return items.map(item => ({
        ...item,
        ranking: calculateRankingScore(item.metrics || {
            // Default metrics for new items or missing data
            conversionRate: 0,
            availabilityScore: 1,
            priceScore: 0.5,
            rating: 0,
            cancellationRate: 0,
            isSponsored: false,
            createdAt: new Date().toISOString()
        })
    })).sort((a, b) => b.ranking.finalScore - a.ranking.finalScore);
};
