import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign Up Function
    const signup = async (email, password, name, phone, role = 'customer') => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Profile with Name
        await updateProfile(user, {
            displayName: name
        });

        // Save extra user details to Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            phone: phone,
            role: role,
            createdAt: new Date().toISOString()
        });

        return user;
    };

    // Login Function
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Login with Phone Number (looks up email first)
    const loginWithPhone = async (phone, password) => {
        try {
            // Query Firestore to find user with this phone number
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phone', '==', phone));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error('Phone number not registered. Please sign up first.');
            }

            // Get the user's email from Firestore
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const email = userData.email;

            // Login using email and password
            return signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            // Re-throw with more specific error message
            if (error.message.includes('Phone number not registered')) {
                throw error;
            }
            throw error;
        }
    };

    // Logout Function
    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, fetch their profile from Firestore
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    const ADMIN_EMAILS = [
                        'infiniteyatra@gmail.com',
                        'chauhanparth165@gmail.com',
                        'universetcenter@gmail.com'
                    ];

                    let userData = {};
                    if (userDocSnap.exists()) {
                        userData = userDocSnap.data();
                    }

                    // Force isAdmin for hardcoded emails
                    const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email);

                    // Determine Role
                    let role = userData.role || 'customer';
                    if (isHardcodedAdmin) role = 'admin';

                    setCurrentUser({
                        ...user,
                        ...userData,
                        isAdmin: isHardcodedAdmin || userData.isAdmin,
                        role: role
                    });
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        loginWithPhone,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
