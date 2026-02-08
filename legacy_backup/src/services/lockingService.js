import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, getDoc, runTransaction } from 'firebase/firestore';

const LOCK_DURATION_MINUTES = 10;

/**
 * Cleanup expired locks logic (Lazy implementation)
 * In production, this would be a scheduled Cloud Function.
 */
const cleanupExpiredLocks = async (resourceId) => {
    try {
        const now = Timestamp.now();
        const locksRef = collection(db, 'availability_locks');
        // Query locks for this resource that have expired
        const q = query(
            locksRef,
            where('resourceId', '==', resourceId),
            where('expiresAt', '<', now)
        );

        const snapshot = await getDocs(q);
        const deletionPromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletionPromises);
    } catch (error) {
        console.warn("Lock cleanup failed (non-critical):", error);
    }
};

/**
 * Attempts to acquire a lock for inventory.
 * @returns {Promise<{success: boolean, lockId?: string, error?: string}>}
 */
export const acquireLock = async ({ resourceType, resourceId, date, quantity, userId, totalInventory }) => {
    try {
        // 1. Lazy Cleanup
        await cleanupExpiredLocks(resourceId);

        return await runTransaction(db, async (transaction) => {
            // 2. Count Active Locks
            const locksRef = collection(db, 'availability_locks');
            const locksQuery = query(
                locksRef,
                where('resourceId', '==', resourceId),
                where('status', '==', 'active')
                // Ideally check date ranges overlap here. 
                // Simplified: Assuming strict matching or handled by caller logic
            );
            const locksSnap = await getDocs(locksQuery);
            let lockedQuantity = 0;
            locksSnap.forEach(doc => {
                lockedQuantity += doc.data().quantity || 0;
            });

            // 3. Count Confirmed Bookings
            const bookingsRef = collection(db, resourceType === 'hotel_room' ? 'hotel_bookings' : 'bookings');
            const bookingsQuery = query(
                bookingsRef,
                where(resourceType === 'hotel_room' ? 'roomId' : 'packageId', '==', resourceId),
                where('status', 'in', ['confirmed', 'paid'])
            );
            const bookingsSnap = await getDocs(bookingsQuery);
            let bookedQuantity = 0;
            bookingsSnap.forEach(doc => {
                // Adjust field names based on collection schema
                bookedQuantity += (doc.data().guests || doc.data().travelers || 1);
            });

            // 4. Check Availability
            if ((lockedQuantity + bookedQuantity + quantity) > totalInventory) {
                return { success: false, error: 'High demand! Someone just grabbed the last spot.' };
            }

            // 5. Create Lock
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + LOCK_DURATION_MINUTES);

            const newLockRef = doc(collection(db, 'availability_locks'));
            transaction.set(newLockRef, {
                resourceType,
                resourceId,
                date, // Can be range object or string
                quantity,
                userId: userId || 'guest',
                expiresAt: Timestamp.fromDate(expiresAt),
                status: 'active',
                createdAt: Timestamp.now()
            });

            return { success: true, lockId: newLockRef.id, expiresAt };
        });

    } catch (error) {
        console.error("Lock acquisition failed:", error);
        return { success: false, error: 'System busy. Please try again.' };
    }
};

export const releaseLock = async (lockId) => {
    if (!lockId) return;
    try {
        await deleteDoc(doc(db, 'availability_locks', lockId));
    } catch (error) {
        console.error("Error releasing lock:", error);
    }
};

export const keepLockAlive = async (lockId) => {
    // Optional: endpoint to extend lock if user is active
};
