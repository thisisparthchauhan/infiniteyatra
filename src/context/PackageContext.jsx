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
                // Sort by ID or some specific order if needed
                setPackages(firestorePackages);
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
