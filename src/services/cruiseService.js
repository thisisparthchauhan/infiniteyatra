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

const CRUISE_BOOKINGS_COLLECTION = 'cruise_bookings';

// ==========================================
// CRUISE BOOKINGS
// ==========================================

export const addCruiseBooking = async (bookingData) => {
    try {
        const bookingRef = 'IY-CRUISE-' + String(Math.floor(1000 + Math.random() * 9000));

        const docRef = await addDoc(collection(db, CRUISE_BOOKINGS_COLLECTION), {
            ...bookingData,
            bookingRef,
            status: 'pending',
            adminNote: '',
            created_at: serverTimestamp(),
            source: 'website_cruise_page'
        });

        return { id: docRef.id, bookingRef };
    } catch (error) {
        console.error('Error adding cruise booking:', error);
        throw error;
    }
};

export const listenToCruiseBookings = (callback, onError) => {
    const q = query(collection(db, CRUISE_BOOKINGS_COLLECTION), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(bookings);
    }, (error) => {
        console.error('Error listening to cruise bookings:', error);
        callback([]);
        if (onError) onError(error);
    });
};

export const updateCruiseBookingStatus = async (id, status) => {
    try {
        const docRef = doc(db, CRUISE_BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating cruise booking status:', error);
        throw error;
    }
};

export const updateCruiseBookingData = async (id, data) => {
    try {
        const docRef = doc(db, CRUISE_BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating cruise booking data:', error);
        throw error;
    }
};
