import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook to check availability for selected dates.
 * Returns { available, blocked, booked, checking, checkAvailability }
 */
const useAvailability = (hotelId, roomType) => {
    const [availability, setAvailability] = useState({});
    const [checking, setChecking] = useState(false);

    const checkDates = async (checkIn, checkOut) => {
        if (!hotelId || !roomType || !checkIn || !checkOut) return { available: true, blockedDates: [], bookedDates: [] };

        setChecking(true);
        try {
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);
            const blockedDates = [];
            const bookedDates = [];

            // Get all months in range
            const months = new Set();
            let current = new Date(startDate);
            while (current < endDate) {
                months.add(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
                current.setMonth(current.getMonth() + 1);
            }
            // Also add the start month
            months.add(`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`);

            // Fetch availability for each month
            for (const month of months) {
                const docId = `${hotelId}_${roomType}_${month}`;
                try {
                    const snap = await getDoc(doc(db, 'hotel_availability', docId));
                    if (snap.exists()) {
                        const data = snap.data();
                        // Check each date in range
                        let d = new Date(startDate);
                        while (d < endDate) {
                            const dateStr = d.toISOString().split('T')[0];
                            const dateMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            if (dateMonth === month) {
                                if (data.dates?.[dateStr] === 'blocked') blockedDates.push(dateStr);
                                if (data.dates?.[dateStr] === 'booked') bookedDates.push(dateStr);
                            }
                            d.setDate(d.getDate() + 1);
                        }
                    }
                } catch (err) {
                    console.warn('Availability check error:', err);
                }
            }

            const result = {
                available: blockedDates.length === 0 && bookedDates.length === 0,
                blockedDates,
                bookedDates,
                unavailableCount: blockedDates.length + bookedDates.length
            };
            setAvailability(result);
            return result;
        } catch (err) {
            console.error('Availability check failed:', err);
            return { available: true, blockedDates: [], bookedDates: [] };
        } finally {
            setChecking(false);
        }
    };

    return { ...availability, checking, checkDates };
};

export default useAvailability;
