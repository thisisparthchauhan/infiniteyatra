/**
 * AI Demand Prediction Engine (MVP)
 * 
 * Rules-based "AI" that analyzes booking trends to suggest pricing.
 * In a real production system, this would define a TensorFlow.js model or call a Python API.
 * 
 * Factors:
 * 1. Seat Utilization (High demand -> Increase Price)
 * 2. Days until trip (Last minute + High Demand -> Surge)
 * 3. Historical Seasonality (Mocked)
 */

export const predictPrice = (packagePrice, totalSeats, bookedSeats, daysUntilTravel) => {
    const utilization = bookedSeats / totalSeats;
    let recommendation = {
        newPrice: packagePrice,
        action: 'KEEP', // 'INCREASE' | 'DECREASE' | 'KEEP'
        confidence: 0,
        reason: 'Normal demand patterns.'
    };

    // Rule 1: High Demand (>80% booked)
    if (utilization > 0.8) {
        recommendation.newPrice = packagePrice * 1.15; // +15%
        recommendation.action = 'INCREASE';
        recommendation.confidence = 92;
        recommendation.reason = 'High seat utilization (>80%). Scarcity pricing applied.';
    }
    // Rule 2: Low Demand (<30% booked) & approaching date (<7 days)
    else if (utilization < 0.3 && daysUntilTravel < 7) {
        recommendation.newPrice = packagePrice * 0.90; // -10%
        recommendation.action = 'DECREASE';
        recommendation.confidence = 85;
        recommendation.reason = 'Low bookings for upcoming trip. Discount to fill seats.';
    }
    // Rule 3: Moderate Demand (40-70%) - Sweet spot
    else if (utilization >= 0.4 && utilization <= 0.7) {
        recommendation.confidence = 65;
        recommendation.reason = 'Healthy booking rate. Maintain current pricing.';
    }

    // Formatting
    recommendation.newPrice = Math.round(recommendation.newPrice / 100) * 100; // Round to nearest 100

    return recommendation;
};

// Mock Forecast Generator for Dashboard
export const getDemandForecast = () => {
    return [
        { day: 'Mon', demand: 45 },
        { day: 'Tue', demand: 30 },
        { day: 'Wed', demand: 65 }, // Surge
        { day: 'Thu', demand: 50 },
        { day: 'Fri', demand: 85 }, // High
        { day: 'Sat', demand: 95 }, // Peak
        { day: 'Sun', demand: 80 }
    ];
};
