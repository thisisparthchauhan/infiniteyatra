import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, deleteObject, listAll } from 'firebase/storage';

// Collections
const CARS_COLLECTION = 'iy_cars';
const CAR_BOOKINGS_COLLECTION = 'car_bookings';

// ==========================================
// CARS CRUD
// ==========================================

export const getCars = async (filters = {}) => {
    try {
        let q = collection(db, CARS_COLLECTION);
        const conditions = [];

        if (filters.isActive !== undefined) {
            conditions.push(where('isActive', '==', filters.isActive));
        }
        if (filters.type) {
            conditions.push(where('type', '==', filters.type));
        }
        if (filters.city) {
            conditions.push(where('city', '==', filters.city));
        }

        if (conditions.length > 0) {
            q = query(q, ...conditions, orderBy('createdAt', 'desc'));
        } else {
            q = query(q, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting cars:', error);
        throw error;
    }
};

export const getActiveCars = async () => {
    return getCars({ isActive: true });
};

export const getCarById = async (id) => {
    try {
        const docRef = doc(db, CARS_COLLECTION, id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting car:', error);
        throw error;
    }
};

export const addCar = async (carData) => {
    try {
        const docRef = await addDoc(collection(db, CARS_COLLECTION), {
            ...carData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding car:', error);
        throw error;
    }
};

export const updateCar = async (id, carData) => {
    try {
        const docRef = doc(db, CARS_COLLECTION, id);
        await updateDoc(docRef, {
            ...carData,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating car:', error);
        throw error;
    }
};

export const deleteCar = async (id) => {
    try {
        // Try to delete storage photos
        try {
            const storageRef = ref(storage, `iy_cars/${id}`);
            const list = await listAll(storageRef);
            await Promise.all(list.items.map(item => deleteObject(item)));
        } catch (e) {
            console.log('No storage photos to delete or error:', e.message);
        }

        const docRef = doc(db, CARS_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting car:', error);
        throw error;
    }
};

export const toggleCarStatus = async (id, isActive) => {
    try {
        const docRef = doc(db, CARS_COLLECTION, id);
        await updateDoc(docRef, { isActive, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error toggling car status:', error);
        throw error;
    }
};

export const duplicateCar = async (id) => {
    try {
        const car = await getCarById(id);
        if (!car) throw new Error('Car not found');

        const { id: _id, createdAt, updatedAt, ...carData } = car;
        return addCar({
            ...carData,
            name: `${carData.name} Copy`,
            isActive: false
        });
    } catch (error) {
        console.error('Error duplicating car:', error);
        throw error;
    }
};

// ==========================================
// CAR BOOKINGS
// ==========================================

export const addCarBooking = async (bookingData) => {
    try {
        const bookingRef = 'IY-CAR-' + String(Math.floor(1000 + Math.random() * 9000));

        const docRef = await addDoc(collection(db, CAR_BOOKINGS_COLLECTION), {
            ...bookingData,
            bookingRef,
            status: 'pending',
            adminNote: '',
            createdAt: serverTimestamp()
        });

        return { id: docRef.id, bookingRef };
    } catch (error) {
        console.error('Error adding car booking:', error);
        throw error;
    }
};

export const listenToCarBookings = (callback, onError) => {
    const q = query(collection(db, CAR_BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(bookings);
    }, (error) => {
        console.error('Error listening to car bookings:', error);
        callback([]);
        if (onError) onError(error);
    });
};

export const updateCarBookingStatus = async (id, status) => {
    try {
        const docRef = doc(db, CAR_BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating car booking status:', error);
        throw error;
    }
};

export const updateCarBookingData = async (id, data) => {
    try {
        const docRef = doc(db, CAR_BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error updating car booking data:', error);
        throw error;
    }
};
