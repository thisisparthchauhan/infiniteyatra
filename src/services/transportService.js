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
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Collections
const VEHICLES_COLLECTION = 'transport_vehicles';
const CITIES_COLLECTION = 'transport_cities';
const BOOKINGS_COLLECTION = 'transport_bookings';
const SETTINGS_COLLECTION = 'transport_settings';

// ==========================================
// VEHICLES
// ==========================================

export const getVehicles = async (filters = {}) => {
    try {
        let q = collection(db, VEHICLES_COLLECTION);

        // Apply filters if provided (e.g., active only, specific city)
        const conditions = [];
        if (filters.isActive !== undefined) {
            conditions.push(where('isActive', '==', filters.isActive));
        }
        if (filters.isVisible !== undefined) {
            conditions.push(where('isVisible', '==', filters.isVisible));
        }
        if (filters.city) {
            conditions.push(where('city', '==', filters.city));
        }

        if (conditions.length > 0) {
            q = query(q, ...conditions, orderBy('createdAt', 'desc'));
        } else {
            q = query(q, orderBy('createdAt', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting vehicles:", error);
        throw error;
    }
};

export const getVehicleById = async (id) => {
    try {
        const docRef = doc(db, VEHICLES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
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
        const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), {
            ...vehicleData,
            rating: 0,
            totalBookings: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
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
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating vehicle:", error);
        throw error;
    }
};

export const deleteVehicle = async (id) => {
    try {
        const docRef = doc(db, VEHICLES_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        throw error;
    }
};

// ==========================================
// CITIES
// ==========================================

export const getCities = async (activeOnly = false) => {
    try {
        let q = collection(db, CITIES_COLLECTION);
        if (activeOnly) {
            q = query(q, where('isActive', '==', true), orderBy('cityName'));
        } else {
            q = query(q, orderBy('cityName'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting cities:", error);
        throw error;
    }
};

export const addCity = async (cityData) => {
    try {
        const docRef = await addDoc(collection(db, CITIES_COLLECTION), {
            ...cityData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding city:", error);
        throw error;
    }
};

export const updateCity = async (id, cityData) => {
    try {
        const docRef = doc(db, CITIES_COLLECTION, id);
        await updateDoc(docRef, cityData);
        return true;
    } catch (error) {
        console.error("Error updating city:", error);
        throw error;
    }
};

export const deleteCity = async (id) => {
    try {
        const docRef = doc(db, CITIES_COLLECTION, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error deleting city:", error);
        throw error;
    }
};

// ==========================================
// BOOKINGS
// ==========================================

export const getBookings = async (userId = null) => {
    try {
        let q = collection(db, BOOKINGS_COLLECTION);
        if (userId) {
            q = query(q, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        } else {
            q = query(q, orderBy('createdAt', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting bookings:", error);
        throw error;
    }
};

export const getBookingById = async (id) => {
    try {
        const docRef = doc(db, BOOKINGS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting booking:", error);
        throw error;
    }
};

export const addBooking = async (bookingData) => {
    try {
        const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
            ...bookingData,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Optionally: Update vehicle totalBookings count here
        if (bookingData.vehicleId) {
            const vehicleRef = doc(db, VEHICLES_COLLECTION, bookingData.vehicleId);
            // We'd ideally use a transaction or FieldValue.increment here, but keeping it simple for now
        }

        return docRef.id;
    } catch (error) {
        console.error("Error adding booking:", error);
        throw error;
    }
};

export const updateBookingStatus = async (id, status) => {
    try {
        const docRef = doc(db, BOOKINGS_COLLECTION, id);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error;
    }
};

// ==========================================
// SETTINGS
// ==========================================

export const getTransportSettings = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        // Return defaults if not found
        return {
            isTransportEnabled: false,
            maintenanceMode: false,
            bookingAdvanceDays: 30,
            cancellationHours: 24
        };
    } catch (error) {
        console.error("Error getting settings:", error);
        throw error;
    }
};

export const updateTransportSettings = async (settingsData) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'global');
        await setDoc(docRef, settingsData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

// ==========================================
// HOMEPAGE CONFIG
// ==========================================

const DEFAULT_HOMEPAGE_CONFIG = {
    homepageHeading: "Move Infinite",
    homepageSubtext: "From a cycle to a Cruise — book the right ride for your journey. Explore our premium collection of vehicles available for rent.",
    buttonPrefix: "Explore",
    categories: [
        { id: "cycles", title: "Cycles", desc: "Eco-friendly short commutes", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80", type: "Cycles", icon: "Bike", isVisible: true },
        { id: "bikes", title: "Bikes", desc: "Adventure ready motorcycles", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80", type: "Bikes", icon: "Zap", isVisible: true },
        { id: "cars", title: "Cars", desc: "Self-Drive & Driven options", image: "/assets/transport/tesla_car.png", type: "Cars", icon: "Car", isVisible: true },
        { id: "traveller", title: "Traveller", desc: "Group travels and vans", image: "/assets/transport/urbania_traveller.png", type: "Traveller", icon: "Bus", isVisible: true },
        { id: "bus", title: "Bus", desc: "Intercity luxury bus travel", image: "/assets/transport/cyberpunk_bus.png", type: "Bus", icon: "Bus", isVisible: true },
        { id: "trains", title: "Trains", desc: "Scenic railway journeys", image: "/assets/transport/bullet_train.jpg", type: "Trains", icon: "Train", isVisible: true },
        { id: "flights", title: "Flights", desc: "Quick intercity routing", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80", type: "Flights", icon: "Plane", isVisible: true },
        { id: "jet-planes", title: "Jet Planes", desc: "Private luxury aviation", image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80", type: "Jet Planes", icon: "Rocket", isVisible: true },
        { id: "cruise", title: "Cruise", desc: "Ocean & river voyages", image: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&q=80", type: "Cruise", icon: "Ship", isVisible: true }
    ]
};

export const getTransportConfig = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'homepage_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // Merge defaults with saved data to ensure no missing fields
            return {
                ...DEFAULT_HOMEPAGE_CONFIG,
                ...docSnap.data(),
                categories: docSnap.data().categories?.length > 0 ? docSnap.data().categories : DEFAULT_HOMEPAGE_CONFIG.categories
            };
        }
        return DEFAULT_HOMEPAGE_CONFIG;
    } catch (error) {
        console.error("Error getting transport homepage config:", error);
        return DEFAULT_HOMEPAGE_CONFIG; 
    }
};

export const updateTransportConfig = async (configData) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, 'homepage_config');
        await setDoc(docRef, configData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating transport homepage config:", error);
        throw error;
    }
};
