import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const productionFirebaseConfig = {
    apiKey: "AIzaSyB2R4R8u8WUaRDslaqYwFOfF5ArmNyhP5U",
    authDomain: "infiniteyatra-iy.firebaseapp.com",
    projectId: "infiniteyatra-iy",
    storageBucket: "infiniteyatra-iy.firebasestorage.app",
    messagingSenderId: "438226177676",
    appId: "1:438226177676:web:f9ccfe91e3220d1d3675a9",
    measurementId: "G-WJVGGTN2FB"
};

const envOrDefault = (key, fallback) => {
    const value = import.meta.env[key];
    return value && !value.startsWith("your_") ? value : fallback;
};

const firebaseConfig = {
    apiKey: envOrDefault("VITE_FIREBASE_API_KEY", productionFirebaseConfig.apiKey),
    authDomain: envOrDefault("VITE_FIREBASE_AUTH_DOMAIN", productionFirebaseConfig.authDomain),
    projectId: envOrDefault("VITE_FIREBASE_PROJECT_ID", productionFirebaseConfig.projectId),
    storageBucket: envOrDefault("VITE_FIREBASE_STORAGE_BUCKET", productionFirebaseConfig.storageBucket),
    messagingSenderId: envOrDefault("VITE_FIREBASE_MESSAGING_SENDER_ID", productionFirebaseConfig.messagingSenderId),
    appId: envOrDefault("VITE_FIREBASE_APP_ID", productionFirebaseConfig.appId),
    measurementId: envOrDefault("VITE_FIREBASE_MEASUREMENT_ID", productionFirebaseConfig.measurementId)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize core services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Lazy-loaded services: split firebase bundle by on-demand imports
export const getAnalyticsAsync = async () => {
    const { getAnalytics } = await import('firebase/analytics');
    return getAnalytics(app);
};

export const getStorageAsync = async () => {
    try {
        const { getStorage } = await import('firebase/storage');
        return getStorage(app);
    } catch (error) {
        console.error('Failed to initialize Firebase Storage:', error);
        throw new Error('Storage service unavailable. Please check Firebase configuration.');
    }
};

export default app;
