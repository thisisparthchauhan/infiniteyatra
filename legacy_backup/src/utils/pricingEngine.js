import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Calculates the dynamic price for a hotel room based on various factors.
 * 
 * @param {Object} params
 * @param {number} params.basePrice - The standard rate for the room
 * @param {number} params.costPrice - The cost price (floor)
 * @param {number} params.totalInventory - Total rooms of this type
 * @param {string} params.checkInDate - YYYY-MM-DD
 * @param {string} params.hotelId - Hotel ID
 * @param {string} params.roomId - Room ID
 * @returns {Promise<Object>} - { finalPrice, breakdown, alerts }
 */
export const calculateDynamicPrice = async ({
    basePrice,
    costPrice,
    totalInventory,
    checkInDate,
    hotelId,
    roomId
}) => {
    const today = new Date();
    const checkIn = new Date(checkInDate);
    const breakdown = {};
    let multiplier = 1.0;

    // 1. Date Proximity (Days Left)
    const diffTime = Math.abs(checkIn - today);
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let dateMultiplier = 1.0;

    if (daysLeft < 2) dateMultiplier = 1.35; // Urgent
    else if (daysLeft <= 6) dateMultiplier = 1.2;
    else if (daysLeft <= 14) dateMultiplier = 1.1;

    breakdown.daysLeft = daysLeft;
    breakdown.dateMultiplier = dateMultiplier;
    multiplier *= dateMultiplier;

    // 2. Day Type (Weekend vs Weekday)
    const dayOfWeek = checkIn.getDay(); // 0 = Sun, 6 = Sat
    let dayMultiplier = 1.0;
    if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5) { // Fri, Sat, Sun
        dayMultiplier = 1.15;
    }
    breakdown.isWeekend = (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5);
    breakdown.dayMultiplier = dayMultiplier;
    multiplier *= dayMultiplier;

    // 3. Seasonality (Mock Logic for now - ideally fetched from DB)
    const month = checkIn.getMonth(); // 0-11
    let seasonMultiplier = 1.0;
    // Example: Peak seasons in India (Dec, Jan, May, June)
    if ([11, 0, 4, 5].includes(month)) {
        seasonMultiplier = 1.3;
        breakdown.season = 'Peak';
    } else {
        breakdown.season = 'Standard';
    }
    breakdown.seasonMultiplier = seasonMultiplier;
    multiplier *= seasonMultiplier;

    // 4. Occupancy (Requires DB Fetch - Simulating for speed if no DB access in context, but adding logic)
    // In a real scenario, we'd query: count(bookings) where date OVERLAPS checkIn
    // For this implementation, we will fetch current bookings count.
    let occupancyMultiplier = 1.0;
    let currentOccupancyPercent = 0;

    try {
        // Query bookings for this room type for this date
        // Note: This is an expensive query for client-side valid for MVP only. 
        // Real-world: Use aggregated Stats collection.
        if (totalInventory > 0) {
            const bookingsRef = collection(db, 'hotel_bookings');
            const q = query(
                bookingsRef,
                where('hotelId', '==', hotelId),
                where('roomId', '==', roomId),
                where('status', '!=', 'Cancelled')
                // Ideally check date ranges, simplified to 'Active' for demo
            );
            const snapshot = await getDocs(q);
            // This is a naive count. In production, check date overlaps.
            const bookedCount = snapshot.size; // Placeholder logic

            // Simulating occupancy for demo based on bookedCount
            // Let's assume bookedCount represents occupancy for the target date for now
            currentOccupancyPercent = (bookedCount / totalInventory) * 100;
        }
    } catch (e) {
        console.warn("Failed to fetch occupancy, using default", e);
    }

    // Logic:
    // < 40% -> 1.0
    // 40-70% -> 1.1
    // 70-90% -> 1.25
    // > 90% -> 1.4
    if (currentOccupancyPercent > 90) occupancyMultiplier = 1.4;
    else if (currentOccupancyPercent > 70) occupancyMultiplier = 1.25;
    else if (currentOccupancyPercent > 40) occupancyMultiplier = 1.1;

    breakdown.occupancyPercent = Math.round(currentOccupancyPercent);
    breakdown.occupancyMultiplier = occupancyMultiplier;
    multiplier *= occupancyMultiplier;

    // 5. Calculate Final
    let finalPrice = Math.round(basePrice * multiplier);

    // 6. Caps
    const minMargin = 0.15; // 15% min margin
    const minPrice = costPrice * (1 + minMargin);
    const maxPrice = basePrice * 1.6;

    breakdown.originalCalculated = finalPrice;
    breakdown.isCapped = false;

    if (finalPrice < minPrice) {
        finalPrice = Math.round(minPrice);
        breakdown.note = "Floored to Min Price (Cost + Margin)";
        breakdown.isCapped = true;
    } else if (finalPrice > maxPrice) {
        finalPrice = Math.round(maxPrice);
        breakdown.note = "Capped at Max Price (1.6x Base)";
        breakdown.isCapped = true;
    }

    return {
        finalPrice,
        currency: 'INR',
        breakdown
    };
};
