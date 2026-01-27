import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB2R4R8u8WUaRDslaqYwFOfF5ArmNyhP5U",
    authDomain: "infiniteyatra-iy.firebaseapp.com",
    projectId: "infiniteyatra-iy",
    storageBucket: "infiniteyatra-iy.firebasestorage.app",
    messagingSenderId: "438226177676",
    appId: "1:438226177676:web:f9ccfe91e3220d1d3675a9",
    measurementId: "G-WJVGGTN2FB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
