import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Calculates Risk Score for a Booking.
 * @param {Object} bookingData - Details of current attempt
 * @param {Object} user - User making the booking
 */
export const analyzeRisk = async (bookingData, user) => {
    let score = 0;
    const signals = [];

    // 1. Check for Short Lead Time (Impulse Booking)
    const checkIn = new Date(bookingData.checkIn || bookingData.date);
    const now = new Date();
    const hoursDifference = (checkIn - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
        score += 15;
        signals.push({ code: 'SHORT_LEAD_TIME', desc: 'Booking within 24h', points: 15 });
    }

    // 2. High Value Transaction
    const amount = Number(bookingData.totalAmount || bookingData.totalPrice);
    if (amount > 100000) {
        score += 20;
        signals.push({ code: 'HIGH_VALUE', desc: 'Amount > ₹1,00,000', points: 20 });
    } else if (amount > 50000) {
        score += 10;
        signals.push({ code: 'MED_VALUE', desc: 'Amount > ₹50,000', points: 10 });
    }

    // 3. New Account Logic
    const accountAgeDays = user?.metadata?.creationTime
        ? (new Date() - new Date(user.metadata.creationTime)) / (1000 * 60 * 60 * 24)
        : 0;

    if (accountAgeDays < 1) {
        score += 15;
        signals.push({ code: 'NEW_ACCOUNT', desc: 'Account created < 24h ago', points: 15 });
    }

    // 4. Repeated Cancellations (Mock Check)
    // Real implementation would query 'bookings' where status == 'cancelled' & userId == user.uid
    // For MVP, we'll skip the query to save reads, or do a lightweight check if provided in history

    // 5. Payment Failures (Simulated)
    // If 'failedAttempts' passed in bookingData
    if (bookingData.failedAttempts > 2) {
        score += 25;
        signals.push({ code: 'PAYMENT_FAILURES', desc: '3+ Failed Payment Attempts', points: 25 });
    }

    // Determining Level
    let level = 'LOW';
    if (score >= 60) level = 'HIGH';
    else if (score >= 30) level = 'MEDIUM';

    // Log to DB
    const flagData = {
        userId: user?.uid || 'guest',
        bookingId: null, // Will be updated after booking
        riskScore: score,
        riskLevel: level,
        signals: signals,
        attemptedAmount: amount,
        createdAt: serverTimestamp()
    };

    try {
        if (score > 10) { // Only log if some risk
            await addDoc(collection(db, 'fraud_flags'), flagData);
        }
    } catch (e) {
        console.error("Fraud Log Error", e);
    }

    return { score, level, signals, shouldBlock: level === 'HIGH' };
};

export const getFraudFlags = async () => {
    try {
        const q = query(collection(db, 'fraud_flags'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching flags", error);
        return [];
    }
};
