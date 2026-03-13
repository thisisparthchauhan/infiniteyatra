import { db } from '../firebase';
import {
    doc, getDoc, setDoc, updateDoc, getDocs,
    collection, query, where, arrayUnion, increment, serverTimestamp
} from 'firebase/firestore';

// ── Generate a unique referral code ──
const generateReferralCode = (name) => {
    const clean = (name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8);
    const num = Math.floor(10 + Math.random() * 90); // 2-digit
    return `IY-${clean}${num}`;
};

// ── Initialize passport for a user ──
export const initPassport = async (userId, userName) => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists() && snap.data().passport?.joinedAt) {
        return snap.data().passport; // Already initialized
    }

    const referralCode = generateReferralCode(userName);

    const passportData = {
        totalCredits: 0,
        currentCredits: 0,
        history: [],
        referralCode,
        referredBy: null,
        joinedAt: new Date().toISOString()
    };

    await setDoc(userRef, { passport: passportData }, { merge: true });
    return passportData;
};

// ── Add credits to a user's passport ──
export const addCredits = async (userId, type, description, credits, refId = '') => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    // Auto-init passport if missing
    if (!snap.exists() || !snap.data().passport?.joinedAt) {
        await initPassport(userId, snap.data()?.name || 'User');
    }

    const historyEntry = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        description,
        credits,
        date: new Date().toISOString(),
        refId
    };

    await updateDoc(userRef, {
        'passport.totalCredits': increment(credits),
        'passport.currentCredits': increment(credits),
        'passport.history': arrayUnion(historyEntry)
    });

    return historyEntry;
};

// ── Get passport data for a user ──
export const getPassport = async (userId) => {
    if (!userId) return null;
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data().passport || null;
};

// ── Apply a referral code ──
export const applyReferralCode = async (userId, code) => {
    if (!userId || !code) throw new Error('Missing userId or code');

    const trimmed = code.trim().toUpperCase();

    // Find the referrer by code
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('passport.referralCode', '==', trimmed));
    const snap = await getDocs(q);

    if (snap.empty) {
        throw new Error('Referral code not found');
    }

    const referrerDoc = snap.docs[0];
    const referrerId = referrerDoc.id;

    // Don't allow self-referral
    if (referrerId === userId) {
        throw new Error('Cannot use your own referral code');
    }

    // Mark the new user as referred
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        'passport.referredBy': trimmed
    });

    // Award 50 credits to new user (welcome bonus)
    await addCredits(userId, 'referral', `Welcome bonus — referred by ${trimmed}`, 50, trimmed);

    // Award 150 credits to referrer
    const referrerData = referrerDoc.data();
    await addCredits(referrerId, 'referral', `Referral: ${referrerData.name || 'a friend'} joined with your code`, 150, userId);

    return true;
};

// ── Get all users with passport data (for admin) ──
export const getAllPassportUsers = async () => {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    const users = [];

    snap.forEach(d => {
        const data = d.data();
        if (data.passport && data.passport.joinedAt) {
            users.push({ id: d.id, ...data });
        }
    });

    // Sort by total credits descending
    users.sort((a, b) => (b.passport?.totalCredits || 0) - (a.passport?.totalCredits || 0));
    return users;
};

// ── Admin: manual credit adjustment ──
export const adminAdjustCredits = async (userId, credits, adminEmail) => {
    return addCredits(
        userId,
        'manual',
        `Admin adjustment by ${adminEmail}`,
        credits,
        `admin_${Date.now()}`
    );
};

// ── Find user by email (for admin search) ──
export const findUserByEmail = async (email) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
};
