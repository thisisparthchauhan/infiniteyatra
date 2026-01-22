import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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

                // Smart Merge: Start with Firestore packages, but merge in static data (like proper images/categories) 
                // if they match by ID.
                const mergedPackages = firestorePackages.map(fp => {
                    const staticPkg = staticPackages.find(sp => sp.id === fp.id);
                    // Use staticPkg as base (for locally defined fields like category) and overlay Firestore data (for dynamic prices/dates)
                    return staticPkg ? { ...staticPkg, ...fp } : fp;
                });

                // Add packages that exist ONLY in static (local)
                staticPackages.forEach(staticPkg => {
                    if (!mergedPackages.some(p => p.id === staticPkg.id)) {
                        mergedPackages.push(staticPkg);
                    }
                });

                // Explicitly remove 'kedarnath' (Price 12000) as requested by user
                // This ensures it doesn't show up even if it exists in Firestore
                const finalPackages = mergedPackages.filter(p => p.id !== 'kedarnath');

                setPackages(finalPackages);
            } else {
                // Fallback to static data if DB is empty
                console.log('No packages in DB, using static data');
                setPackages(staticPackages);
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
            setPackages(staticPackages); // Fallback on error
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

    const getPackageById = (id) => {
        return packages.find(pkg => pkg.id === id);
    };

    return (
        <PackageContext.Provider value={{ packages, loading, refreshPackages, getPackageById }}>
            {children}
        </PackageContext.Provider>
    );
};
