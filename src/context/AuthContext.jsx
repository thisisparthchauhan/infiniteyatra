import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    getIdTokenResult,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { isStaffRole } from '../config/staffRoles';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign Up Function
    const signup = async (email, password, name, phone) => {
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
                    // SA-1 — authorization comes from the verified ID token custom
                    // claim, and from nothing else.
                    //
                    // This previously read a hardcoded list of admin email addresses and the
                    // Firestore `users.role` field. Neither is a security
                    // boundary: an email is not a permission, and the profile
                    // document is separate from the token the server actually
                    // verifies. Firestore and Storage rules have always required
                    // a custom claim, so the UI was granting access the data layer
                    // then refused.
                    //
                    // `claimRole` / `isStaff` / `isAdmin` below are for UI
                    // affordances only. Route protection is UX; every protected
                    // action is authorised again on the server.
                    const tokenResult = await getIdTokenResult(user);
                    const claims = tokenResult?.claims || {};
                    const claimRole = typeof claims.role === 'string' ? claims.role : null;
                    const isAdmin = claims.admin === true || claimRole === 'admin';

                    // The profile is still loaded, but only for display data
                    // (name, phone, photo). Its `role` is deliberately not used
                    // for any access decision.
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

                    setCurrentUser({
                        ...user,
                        ...userData,
                        // Profile role kept under a distinct name so it can never
                        // be mistaken for the authorization role.
                        profileRole: userData.role || null,
                        claimRole,
                        isAdmin,
                        isStaff: isAdmin || isStaffRole(claimRole),
                        role: claimRole,
                    });
                } catch (error) {
                    console.error("Error resolving user claims/profile:", error);
                    // Fail closed: no claim resolved means no staff affordances.
                    setCurrentUser({ ...user, profileRole: null, claimRole: null, isAdmin: false, isStaff: false, role: null });
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
