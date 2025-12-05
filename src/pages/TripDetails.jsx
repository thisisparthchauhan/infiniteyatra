import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, Calendar, Clock, TrendingUp, Sparkles, Share2, ArrowLeft, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';

const TripDetails = () => {
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const docRef = doc(db, 'savedTrips', tripId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTrip({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError("Trip not found!");
                }
            } catch (err) {
                console.error("Error fetching trip:", err);
                setError("Failed to load trip details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
    }, [tripId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Oops!</h2>
                <p className="text-slate-600 mb-6">{error || "Trip not found."}</p>
                <Link to="/trip-planner" className="text-blue-600 font-semibold hover:underline">
                    Create a New Trip
                </Link>
            </div>
        );
    }

    const { itinerary } = trip;

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16">
            <SEO
                title={`${trip.destination} Itinerary`}
                description={`Check out this ${trip.days}-day trip to ${trip.destination} planned by AI.`}
                url={`/trip/${tripId}`}
            />

            <div className="container mx-auto px-6 lg:px-8">
                <Link to="/my-trips" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to My Trips
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white text-center">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{trip.destination}</h1>
                            <div className="flex justify-center items-center gap-6 text-white/90">
                                <span className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {trip.days} Days</span>
                                <span className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI Curated</span>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Created on {trip.createdAt?.toDate().toLocaleDateString()}</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert("Link copied to clipboard!");
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 text-blue-600 font-medium transition-all"
                            >
                                <Share2 className="w-4 h-4" /> Share Trip
                            </button>
                        </div>
                    </div>

                    {/* Itinerary Content */}
                    <div className="space-y-8">
                        {itinerary.dayPlans?.map((day, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                            >
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-slate-900">Day {day.day}</h3>
                                    <span className="text-slate-600 font-medium">{day.title}</span>
                                </div>
                                <div className="p-6 space-y-6">
                                    {day.activities.map((activity, actIndex) => (
                                        <div key={actIndex} className="flex gap-4">
                                            <div className="w-16 flex-shrink-0 text-center pt-1">
                                                <span className="block text-sm font-bold text-slate-900">{activity.time}</span>
                                            </div>
                                            <div className="flex-grow border-l-2 border-slate-100 pl-4 pb-2">
                                                <h4 className="font-bold text-slate-900 text-lg mb-1">{activity.title}</h4>
                                                <p className="text-slate-600 text-sm leading-relaxed">{activity.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Budget Section */}
                    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                            Estimated Budget
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Daily Cost</span>
                                    <span className="font-bold text-slate-900">${itinerary.costBreakdown?.daily}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Total per Person</span>
                                    <span className="font-bold text-slate-900">${itinerary.costBreakdown?.perPerson}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

export default TripDetails;
