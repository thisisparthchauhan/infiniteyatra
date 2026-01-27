import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { packages as staticPackages } from '../data/packages';

const PackageContext = createContext();

export const usePackages = () => useContext(PackageContext);

export const PackageProvider = ({ children }) => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'packages'));
            if (!querySnapshot.empty) {
                const firestorePackages = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const mergedPackages = firestorePackages.map(fp => {
                    const staticPkg = staticPackages.find(sp => sp.id === fp.id);
                    const merged = staticPkg ? { ...staticPkg, ...fp } : fp;
                    // Force priceDisplay to match numeric price
                    merged.priceDisplay = `₹${(merged.price || 0).toLocaleString('en-IN')}`;
                    return merged;
                });

                // Add static-only packages
                staticPackages.forEach(staticPkg => {
                    if (!mergedPackages.some(p => p.id === staticPkg.id)) {
                        mergedPackages.push(staticPkg);
                    }
                });

                // Explicitly remove 'kedarnath' (Price 12000) as requested by user
                const finalPackages = mergedPackages.filter(p => p.id !== 'kedarnath');

                setPackages(finalPackages);
            } else {
                setPackages(staticPackages);
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
            setPackages(staticPackages);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const refreshPackages = () => {
        return fetchPackages();
    };

    // Public getter returns valid visible packages
    const getVisiblePackages = () => {
        return packages.filter(p => p.isVisible !== false); // Default to true if undefined
    };

    const getPackageById = (id) => {
        return packages.find(pkg => pkg.id === id);
    };

    const updatePackageHomepageSettings = async (packageId, settings) => {
        try {
            const packageRef = doc(db, 'packages', packageId);
            await setDoc(packageRef, settings, { merge: true });
            await fetchPackages(); // Refresh packages after update
            return { success: true };
        } catch (error) {
            console.error('Error updating package homepage settings:', error);
            return { success: false, error };
        }
    };

    const getFeaturedPackages = () => {
        return packages
            .filter(pkg => pkg.featuredOnHomepage === true)
            .sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
    };

    return (
        <PackageContext.Provider value={{ packages: getVisiblePackages(), allPackages: packages, loading, refreshPackages, getPackageById, updatePackageHomepageSettings, getFeaturedPackages }}>
            {children}
        </PackageContext.Provider>
    );
};
