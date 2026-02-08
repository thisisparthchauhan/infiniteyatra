import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Calculates refund amount based on policy.
 * @param {Object} booking 
 * @returns {number} refundAmount
 */
export const calculateRefundAmount = (booking) => {
    const bookingDate = booking.checkIn ? new Date(booking.checkIn) : new Date(booking.date); // Handle Hotel vs Package
    const today = new Date();
    const diffTime = bookingDate - today;
    const daysBefore = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const paid = booking.paidAmount || booking.amountPaid || 0;

    if (daysBefore > 30) return paid; // 100% refund
    if (daysBefore > 14) return paid * 0.75;
    if (daysBefore > 7) return paid * 0.50;
    return 0; // No refund
};

/**
 * Processes a cancellation and initiates refund.
 */
export const processCancellation = async (bookingId, collectionName = 'hotel_bookings', reason = 'User requested') => {
    try {
        const bookingRef = doc(db, collectionName, bookingId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) throw new Error("Booking not found");

        const booking = bookingSnap.data();
        if (booking.bookingStatus === 'Cancelled') throw new Error("Already cancelled");

        const refundAmount = calculateRefundAmount(booking);

        // 1. Update Booking Status
        await updateDoc(bookingRef, {
            bookingStatus: 'Cancelled',
            status: 'cancelled',
            cancellationReason: reason,
            refundAmount,
            refundStatus: refundAmount > 0 ? 'Initiated' : 'Not Eligible',
            cancelledAt: serverTimestamp()
        });

        // 2. Create Refund Record
        if (refundAmount > 0) {
            await addDoc(collection(db, 'refunds'), {
                bookingId,
                collectionName,
                userId: booking.userId,
                amount: refundAmount,
                reason,
                status: 'Initiated',
                processedAt: null, // Pending manual/gateway processing
                createdAt: serverTimestamp()
            });
        }

        // 3. Update Finance (If Hotel)
        if (collectionName === 'hotel_bookings' && booking.totalAmount) {
            // Find original finance record? Or just add a new negative record.
            // Adding negative record (contra entry) is cleaner.
            await addDoc(collection(db, 'hotel_finance'), {
                bookingId: bookingId,
                hotelId: booking.hotelId,
                type: 'REFUND',
                quantity: -1,
                grossAmount: -booking.totalAmount, // Reversing revenue
                refundPayload: refundAmount, // Actual cash out
                createdAt: serverTimestamp()
            });
        }

        return { success: true, refundAmount };

    } catch (error) {
        console.error("Cancellation failed:", error);
        return { success: false, error: error.message };
    }
};
