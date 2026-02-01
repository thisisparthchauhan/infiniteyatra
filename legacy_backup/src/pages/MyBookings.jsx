import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Loader, Calendar, MapPin, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
            // Removing orderBy to avoid index issues for now
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
            // Show the actual error message for debugging
            setError(`Failed to load bookings: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={fetchBookings}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-24 px-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

            <SEO
                title="My Bookings - Infinite Yatra"
                description="View your upcoming and past trips with Infinite Yatra."
                url="/my-bookings"
            />
            <div className="max-w-5xl mx-auto relative z-10">
                <h1 className="text-3xl font-bold text-white mb-8">My Bookings</h1>

                {bookings.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center shadow-lg border border-white/10 max-w-2xl mx-auto bg-white/5 backdrop-blur-xl">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="text-blue-400" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Book Your First Journey With Us! 🌟</h2>
                        <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                            It looks like you haven't booked any trips yet.<br />
                            Start your adventure today and create memories that last a lifetime.
                        </p>
                        <Link
                            to="/destinations"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
                        >
                            Explore Destinations <ArrowRight size={20} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid gap-6">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="glass-card rounded-xl shadow-lg border border-white/10 overflow-hidden hover:border-white/20 transition-all bg-white/5 backdrop-blur-md">
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                                        booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                                            'bg-white/10 text-slate-300 border-white/10'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    <span className="text-slate-400 text-sm font-mono">#{booking.id.slice(0, 8)}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white">{booking.packageTitle}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-400">₹{booking.totalPrice?.toLocaleString()}</p>
                                                <p className="text-sm text-slate-400">{booking.travelers} Travelers</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-white/10">
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <Calendar size={18} className="text-blue-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Travel Date</p>
                                                    <p className="font-medium text-white">{new Date(booking.bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <Clock size={18} className="text-blue-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Booked On</p>
                                                    <p className="font-medium text-white">{booking.createdAt?.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <MapPin size={18} className="text-blue-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Package ID</p>
                                                    <Link to={`/package/${booking.packageId}`} className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                                                        View Package
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                        {booking.status === 'pending' && (
                                            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                                                <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                                                <p className="text-sm text-yellow-200">
                                                    Your booking is currently pending confirmation. Our team will contact you shortly via WhatsApp/Phone to confirm details and process payment.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-4">
                            <Link
                                to="/destinations"
                                className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/10 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all hover:scale-105 shadow-lg backdrop-blur-md"
                            >
                                Book Your New Journey <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
