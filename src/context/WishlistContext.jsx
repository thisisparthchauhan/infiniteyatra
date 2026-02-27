import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const { addToast } = useToast();
    const [wishlist, setWishlist] = useState(() => {
        try {
            const saved = localStorage.getItem('infiniteyatra_wishlist');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error reading wishlist from localStorage:', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('infiniteyatra_wishlist', JSON.stringify(wishlist));
        } catch (error) {
            console.error('Error saving wishlist to localStorage:', error);
        }
    }, [wishlist]);

    const addToWishlist = (pkg) => {
        setWishlist(prev => {
            if (prev.some(item => item.id === pkg.id)) return prev;
            addToast(`${pkg.title} added to Wishlist!`, 'success');
            return [...prev, pkg];
        });
    };

    const removeFromWishlist = (id, title) => {
        setWishlist(prev => prev.filter(item => item.id !== id));
        if (title) addToast(`${title} removed from Wishlist`, 'info');
    };

    const isInWishlist = (id) => {
        return wishlist.some(item => item.id === id);
    };

    const toggleWishlist = (pkg) => {
        if (isInWishlist(pkg.id)) {
            removeFromWishlist(pkg.id, pkg.title);
        } else {
            addToWishlist(pkg);
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};
