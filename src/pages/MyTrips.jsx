import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import SEO from '../components/SEO';

const MyTrips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchTrips(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchTrips = async (userId) => {
        try {
            const q = query(
                collection(db, 'savedTrips'),
                where('userId', '==', userId),
                where('isDeleted', '!=', true), // Filter out deleted trips
                orderBy('createdAt', 'desc')
            );
            // Note: Requires an index for 'isDeleted' and 'createdAt' if mixed. 
            // However, since we are filtering by isDeleted != true, it might need a composite index.
            // Simpler approach if index is missing: Fetch all and filter in client, or just use simple query.
            // Let's try the query. If it fails, we might need to create an index.
            // Actually, `!=` queries are tricky. Better to use `where('isDeleted', '==', false)` 
            // but older records might not have this field.
            // Best approach for backward compatibility: Fetch all, then filter in JS, 
            // OR ensure all records have isDeleted: false (which we can't easily do right now).
            // Let's try fetching all for user and filtering in JS to be safe and avoid index issues for now.

            const q2 = query(
                collection(db, 'savedTrips'),
                where('userId', '==', userId)
            );

            const querySnapshot = await getDocs(q2);
            const tripsData = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(trip => !trip.isDeleted) // Client-side filter for soft delete
                .sort((a, b) => {
                    // Sort by createdAt desc, handling missing dates
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB - dateA;
                });

            setTrips(tripsData);
        } catch (error) {
            console.error("Error fetching trips:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tripId) => {
        if (!window.confirm("Are you sure you want to delete this trip?")) return;

        try {
            const tripRef = doc(db, 'savedTrips', tripId);
            await updateDoc(tripRef, {
                isDeleted: true
            });

            // Update local state to remove the deleted trip
            setTrips(prev => prev.filter(t => t.id !== tripId));
        } catch (error) {
            console.error("Error deleting trip:", error);
            alert("Failed to delete trip.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Login</h2>
                    <p className="text-slate-600 mb-6">You need to be logged in to view your saved trips.</p>
                    <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                        Login Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16">
            <SEO title="My Trips" description="View your saved AI-generated itineraries." url="/my-trips" />
            <div className="container mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">My Saved Trips</h1>
                    <Link to="/trip-planner" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        + New Trip
                    </Link>
                </div>

                {trips.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Saved Trips Yet</h3>
                        <p className="text-slate-500 mb-6">Start planning your next adventure with our AI.</p>
                        <Link to="/trip-planner" className="text-blue-600 font-semibold hover:underline">
                            Go to Trip Planner
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map((trip) => (
                            <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden group flex flex-col"
                            >
                                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-end relative">
                                    <h3 className="text-2xl font-bold text-white">{trip.destination}</h3>
                                    <button
                                        onClick={() => handleDelete(trip.id)}
                                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-red-500/80 backdrop-blur-sm rounded-full text-white transition-colors"
                                        title="Delete Trip"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="p-6 flex-grow flex flex-col justify-between">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                                        <Calendar className="w-4 h-4" />
                                        <span>{trip.days} Days Trip</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <Link
                                            to={`/trip/${trip.id}`}
                                            className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all"
                                        >
                                            View Itinerary <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTrips;
