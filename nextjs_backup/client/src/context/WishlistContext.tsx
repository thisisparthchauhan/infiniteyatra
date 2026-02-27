'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistContextType {
    wishlist: string[];
    toggleWishlist: (tourId: string) => void;
    isInWishlist: (tourId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const [wishlist, setWishlist] = useState<string[]>([]);

    // Load wishlist from Firestore when user logs in
    useEffect(() => {
        if (!currentUser) {
            setWishlist([]);
            return;
        }
        const load = async () => {
            const ref = doc(db, 'wishlists', currentUser.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setWishlist(snap.data().items || []);
            }
        };
        load();
    }, [currentUser]);

    const toggleWishlist = async (tourId: string) => {
        if (!currentUser) {
            toast.error('Please log in to save packages to your wishlist.');
            return;
        }
        const ref = doc(db, 'wishlists', currentUser.uid);
        const isIn = wishlist.includes(tourId);
        if (isIn) {
            setWishlist((prev) => prev.filter((id) => id !== tourId));
            await updateDoc(ref, { items: arrayRemove(tourId) });
            toast.success('Removed from wishlist');
        } else {
            setWishlist((prev) => [...prev, tourId]);
            await setDoc(ref, { items: arrayUnion(tourId) }, { merge: true });
            toast.success('Added to wishlist ❤️');
        }
    };

    const isInWishlist = (tourId: string) => wishlist.includes(tourId);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist(): WishlistContextType {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
    return ctx;
}
