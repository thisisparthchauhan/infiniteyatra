import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Loader, Calendar, MapPin, Clock, AlertCircle, ArrowRight, Plane, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const MyBookings = () => {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchBookings = async () => {
        if (!currentUser) return;
        setLoading(true);
        setError('');

        try {
            const q = query(
                collection(db, 'bookings'),
                where('userId', '==', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            const bookingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side
            bookingsData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setBookings(bookingsData);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setError(`Failed to load bookings: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [currentUser]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader className="animate-spin text-blue-500" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-slate-900">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-red-500/20">
                    <AlertCircle className="text-red-500" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 mb-8">{error}</p>
                <button
                    onClick={fetchBookings}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-500 transition-all hover:scale-105 shadow-lg shadow-blue-600/20"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 py-24 px-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            <SEO
                title="My Bookings - Infinite Yatra"
                description="View your upcoming and past trips with Infinite Yatra."
                url="/my-bookings"
            />
            <div className="max-w-5xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">My Bookings</h1>
                        <p className="text-slate-400">Manage and view your travel history</p>
                    </div>
                    {bookings.length > 0 && (
                        <div className="hidden md:block">
                            <Link to="/destinations" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                                Book another trip <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>

                {bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-12 text-center max-w-2xl mx-auto border border-white/10"
                    >
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-blue-500/30">
                            <Plane className="text-blue-400" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">No Bookings Yet</h2>
                        <p className="text-slate-400 mb-10 text-lg leading-relaxed max-w-md mx-auto">
                            Your passport is waiting to be stamped! Start your adventure today and create memories that last.
                        </p>
                        <Link
                            to="/destinations"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
                        >
                            Explore Destinations <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {bookings.map((booking) => (
                            <motion.div
                                key={booking.id}
                                variants={itemVariants}
                                className="glass-card overflow-hidden group hover:border-white/20 transition-all duration-300"
                            >
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                                <span className="text-slate-500 text-xs font-mono tracking-wide">ID: {booking.id.slice(0, 8)}</span>
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{booking.packageTitle}</h3>
                                        </div>
                                        <div className="text-left md:text-right bg-white/5 px-6 py-4 rounded-2xl border border-white/5">
                                            <p className="text-3xl font-bold text-blue-400">₹{booking.totalPrice?.toLocaleString()}</p>
                                            <p className="text-sm text-slate-400 mt-1">{booking.travelers} Travelers</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <Calendar size={20} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Travel Date</p>
                                                <p className="text-white font-medium">{new Date(booking.bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                <Clock size={20} className="text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Booked On</p>
                                                <p className="text-white font-medium">{booking.createdAt?.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin size={20} className="text-teal-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Package Details</p>
                                                <Link to={`/package/${booking.packageId}`} className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1 group-hover:underline decoration-blue-400/30">
                                                    View Itinerary <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.status === 'pending' && (
                                        <div className="mt-6 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-5 flex items-start gap-4">
                                            <Sparkles className="text-yellow-400 flex-shrink-0 mt-0.5 animate-pulse" size={20} />
                                            <div>
                                                <h4 className="text-yellow-400 font-bold text-sm mb-1">Confirmation Pending</h4>
                                                <p className="text-sm text-yellow-200/80 leading-relaxed">
                                                    We've received your booking! Our travel experts will verify availability and reach out to you shortly via WhatsApp/Phone to finalize your payment.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {bookings.length > 0 && (
                    <div className="flex justify-center pt-12 md:hidden">
                        <Link
                            to="/destinations"
                            className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg"
                        >
                            Book Your New Journey <ArrowRight size={20} />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
