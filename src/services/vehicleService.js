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
import { db } from '../firebase';

const VEHICLES_COLLECTION = 'vehicles';
const CITIES_COLLECTION = 'vehicle_cities';

// ==========================================
// VEHICLES
// ==========================================

export const listenToVehicles = (filters = {}, callback, onError) => {
    let q = collection(db, VEHICLES_COLLECTION);
    const conditions = [];
    
    // Default to not showing deleted
    conditions.push(where('isDeleted', '!=', true));

    if (filters.type) {
        conditions.push(where('type', '==', filters.type));
    }
    if (filters.isAvailable !== undefined) {
        conditions.push(where('isAvailable', '==', filters.isAvailable));
    }
    if (filters.city) {
        conditions.push(where('cities', 'array-contains', filters.city));
    }
    
    // We can't use multiple inequality filters on different fields, 
    // but here we just have isDeleted != true. We should sort on client if needed, 
    // or keep it simple. If we orderBy here, it must be 'isDeleted' first.
    // For simplicity, let's fetch all mostly active ones and sort on the client,
    // or just omit the isDeleted filter and filter out deleted ones on the client
    // to allow complex orderBys. Let's do client side filtering for isDeleted to allow ordering.
    
    q = collection(db, VEHICLES_COLLECTION);
    const newConditions = [];
    
    if (filters.type) {
        newConditions.push(where('type', '==', filters.type));
    }
    if (filters.isAvailable !== undefined) {
        newConditions.push(where('isAvailable', '==', filters.isAvailable));
    }
    if (filters.city) {
        newConditions.push(where('cities', 'array-contains', filters.city));
    }

    if (newConditions.length > 0) {
        q = query(q, ...newConditions);
    } else {
        q = query(q);
    }

    return onSnapshot(q, (snapshot) => {
        const vehicles = snapshot.docs
            .map(d => ({ ...d.data(), id: d.id })) // MUST be in this order
            .filter(v => !v.isDeleted); // Client-side soft-delete filter
            
        // Client-side sorting to prevent FIRESTORE (12.6.0) INTERNAL ASSERTION FAILED
        // when a pending serverTimestamp() write interacts with orderBy()
        vehicles.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
            return timeB - timeA;
        });

        callback(vehicles);
    }, (error) => {
        console.error('Error listening to vehicles:', error);
        callback([]);
        if (onError) onError(error);
    });
};

export const getVehicles = async (filters = {}) => {
    try {
        let q = collection(db, VEHICLES_COLLECTION);
        const conditions = [];

        if (filters.type) {
            conditions.push(where('type', '==', filters.type));
        }
        if (filters.isAvailable !== undefined) {
            conditions.push(where('isAvailable', '==', filters.isAvailable));
        }
        if (filters.city) {
            conditions.push(where('cities', 'array-contains', filters.city));
        }

        if (conditions.length > 0) {
            q = query(q, ...conditions);
        } else {
            q = query(q);
        }

        const querySnapshot = await getDocs(q);
        const vehicles = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id }))
            .filter(v => !v.isDeleted);
            
        vehicles.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
            return timeB - timeA;
        });
        
        return vehicles;
    } catch (error) {
        console.error("Error getting vehicles:", error);
        throw error;
    }
};

export const getVehicleById = async (id) => {
    try {
        const docRef = doc(db, VEHICLES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && !docSnap.data().isDeleted) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting vehicle:", error);
        throw error;
    }
};

export const addVehicle = async (vehicleData) => {
    try {
        const now = new Date().toISOString();
        const dataToSave = { ...vehicleData };
        delete dataToSave.id; // Prevent saving {id: null} inside the doc
        
        const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), {
            ...dataToSave,
            isDeleted: false,
            createdAt: now,
            updatedAt: now
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding vehicle:", error);
        throw error;
    }
};

export const updateVehicle = async (id, vehicleData) => {
    try {
        const docRef = doc(db, VEHICLES_COLLECTION, id);
        await updateDoc(docRef, {
            ...vehicleData,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error updating vehicle:", error);
        throw error;
    }
};

// Soft delete
export const deleteVehicle = async (id) => {
    try {
        const docRef = doc(db, VEHICLES_COLLECTION, id);
        await updateDoc(docRef, {
            isDeleted: true,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        throw error;
    }
};

// ==========================================
// CITIES
// ==========================================

export const listenToVehicleCities = (callback, onError) => {
    const q = query(collection(db, CITIES_COLLECTION), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
        const cities = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(cities);
    }, (error) => {
        console.error('Error listening to cities:', error);
        callback([]);
        if (onError) onError(error);
    });
};

export const getVehicleCities = async (activeOnly = false) => {
    try {
        let q = collection(db, CITIES_COLLECTION);
        if (activeOnly) {
            q = query(q, where('isActive', '==', true), orderBy('name'));
        } else {
            q = query(q, orderBy('name'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting cities:", error);
        throw error;
    }
};

export const addVehicleCity = async (cityData) => {
    try {
        const docRef = await addDoc(collection(db, CITIES_COLLECTION), {
            ...cityData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding city:", error);
        throw error;
    }
};

export const updateVehicleCity = async (id, cityData) => {
    try {
        const docRef = doc(db, CITIES_COLLECTION, id);
        await updateDoc(docRef, cityData);
        return true;
    } catch (error) {
        console.error("Error updating city:", error);
        throw error;
    }
};
