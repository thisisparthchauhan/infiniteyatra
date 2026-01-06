import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyB2R4R8u8WUaRDslaqYwFOfF5ArmNyhP5U",
    authDomain: "infiniteyatra-iy.firebaseapp.com",
    projectId: "infiniteyatra-iy",
    storageBucket: "infiniteyatra-iy.firebasestorage.app",
    messagingSenderId: "438226177676",
    appId: "1:438226177676:web:f9ccfe91e3220d1d3675a9",
    measurementId: "G-WJVGGTN2FB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
