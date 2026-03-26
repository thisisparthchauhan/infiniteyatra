import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

const CYCLE_BOOKINGS_COLLECTION = 'cycle_bookings';

// ==========================================
// CYCLE BOOKINGS
// ==========================================

export const addCycleBooking = async (bookingData) => {
    try {
        const bookingRef = 'IY-CYCLE-' + String(Math.floor(1000 + Math.random() * 9000));

        const docRef = await addDoc(collection(db, CYCLE_BOOKINGS_COLLECTION), {
            ...bookingData,
            bookingRef,
            status: 'pending',
            adminNote: '',
            created_at: serverTimestamp(),
            source: 'website_cycle_page'
        });

        return { id: docRef.id, bookingRef };
    } catch (error) {
        console.error('Error adding cycle booking:', error);
        throw error;
    }
};

export const listenToCycleBookings = (callback, onError) => {
    const q = query(collection(db, CYCLE_BOOKINGS_COLLECTION), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(bookings);
    }, (error) => {
        console.error('Error listening to cycle bookings:', error);
        callback([]);
        if (onError) onError(error);
    });
};

export const updateCycleBookingStatus = async (id, status) => {
    try {
        const docRef = doc(db, CYCLE_BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating cycle booking status:', error);
        throw error;
    }
};

export const updateCycleBookingData = async (id, data) => {
    try {
        const docRef = doc(db, CYCLE_BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating cycle booking data:', error);
        throw error;
    }
};
