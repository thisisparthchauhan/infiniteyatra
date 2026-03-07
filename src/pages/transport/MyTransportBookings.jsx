import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Calendar, MapPin, Clock, ArrowRight, Eye, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { getTransportSettings } from '../../services/transportService';

const MyTransportBookings = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    // Cancellation modal
    const [cancelModal, setCancelModal] = useState({ isOpen: false, booking: null, reason: '' });

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const fetchData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [settingsData, bookingsSnap] = await Promise.all([
                getTransportSettings(),
                getDocs(query(collection(db, 'transport_bookings'), where('userId', '==', currentUser.uid)))
            ]);

            setSettings(settingsData);

            const bData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client side sort due to firestore index requirement if ordered with where
            bData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setBookings(bData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load transport bookings.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!cancelModal.reason.trim()) {
            alert('Please provide a reason for cancellation.');
            return;
        }

        try {
            const docRef = doc(db, 'transport_bookings', cancelModal.booking.id);
            await updateDoc(docRef, {
                status: 'cancelled',
                cancelReason: cancelModal.reason,
                cancelledAt: new Date()
            });

            setBookings(prev => prev.map(b => b.id === cancelModal.booking.id ? { ...b, status: 'cancelled', cancelReason: cancelModal.reason } : b));
            setCancelModal({ isOpen: false, booking: null, reason: '' });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking.');
        }
    };

    const isCancelAllowed = (booking) => {
        if (booking.status !== 'pending' && booking.status !== 'confirmed') return false;

        // Calculate hours difference
        const now = new Date();
        const pickupParts = booking.pickupDate.split('-'); // YYYY-MM-DD
        const timeParts = booking.pickupTime.split(':'); // HH:MM

        // Create valid date object
        const pickupDate = new Date();
        pickupDate.setFullYear(parseInt(pickupParts[0]), parseInt(pickupParts[1]) - 1, parseInt(pickupParts[2]));
        pickupDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

        const diffMs = pickupDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        const freeHours = settings?.freeCancellationHours || 24;
        return diffHours > freeHours;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto">

                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/profile')} className="text-slate-400 hover:text-white transition-colors">
                        ← Back to Profile
                    </button>
                </div>

                <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Car className="text-blue-500" size={32} />
                            My Transport Bookings
                        </h1>
                        <p className="text-slate-400 mt-2">Manage your vehicle rentals and past rides.</p>
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                            <Car size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No rides booked yet</h2>
                        <p className="text-slate-400 mb-8 max-w-md">
                            Explore our premium collection of vehicles available for rent in your city right now.
                        </p>
                        <Link to="/transport" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25">
                            Book a Ride <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map(booking => {
                            const isExpanded = expandedId === booking.id;

                            return (
                                <div key={booking.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                                    <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-6">

                                        {/* Vehicle Image */}
                                        <div className="w-full md:w-48 h-32 md:h-full bg-slate-800 rounded-xl overflow-hidden shrink-0 relative">
                                            {booking.vehicleImage ? (
                                                <img src={booking.vehicleImage} alt={booking.vehicleName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                    <Car size={32} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Main Summary */}
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                        <span className="text-xs font-mono text-slate-500 uppercase">ID: {booking.id.slice(-8)}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white truncate">{booking.vehicleName}</h3>
                                                    <p className="text-sm text-slate-400 capitalize">{booking.vehicleType}</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <p className="text-2xl font-black text-white">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                                                    <p className="text-xs text-slate-500">{booking.totalDays > 0 ? `${booking.totalDays} Days` : `${booking.totalHours} Hours`}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-800 pt-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <MapPin size={16} className="text-blue-500" />
                                                    <span className="truncate">{booking.pickupCity}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Calendar size={16} className="text-purple-500" />
                                                    <span className="truncate">{booking.pickupDate} → {booking.returnDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="bg-[#111] px-5 sm:px-6 py-3 border-t border-slate-800 flex justify-between items-center sm:flex-row flex-col gap-3">

                                        <div className="flex items-center gap-3 w-full sm:w-auto text-sm">
                                            {booking.status === 'completed' && (
                                                <Link to={`/transport/book/${booking.vehicleId}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition-colors">
                                                    <RefreshCw size={14} /> Rebook Same Ride
                                                </Link>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                            {isCancelAllowed(booking) && (
                                                <button
                                                    onClick={() => setCancelModal({ isOpen: true, booking, reason: '' })}
                                                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                                >
                                                    <XCircle size={14} /> Cancel Booking
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                                                className="text-white hover:bg-slate-800 px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                                            >
                                                {isExpanded ? 'Hide Details' : <><Eye size={14} /> View Details</>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details Panel */}
                                    {isExpanded && (
                                        <div className="bg-slate-900 px-5 sm:px-6 py-6 border-t border-slate-800 text-sm animate-in slide-in-from-top-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                                {/* Pickup/Drop info */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-2">Pickup Details</h4>
                                                        <p className="text-white font-medium">{booking.pickupDate} at {booking.pickupTime}</p>
                                                        <p className="text-slate-400 mt-1">{booking.pickupAddress}, {booking.pickupCity}</p>
                                                    </div>

                                                    {booking.dropAddress && (
                                                        <div>
                                                            <h4 className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-2">Drop Details</h4>
                                                            <p className="text-white font-medium">{booking.returnDate}</p>
                                                            <p className="text-slate-400 mt-1">{booking.dropAddress}, {booking.dropCity}</p>
                                                        </div>
                                                    )}

                                                    {booking.specialRequests && (
                                                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                                            <h4 className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-1">Special Requests</h4>
                                                            <p className="text-slate-300">{booking.specialRequests}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Meta Info */}
                                                <div className="space-y-4 md:border-l md:border-slate-800 md:pl-8">
                                                    <div>
                                                        <h4 className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mb-2">Passenger Details</h4>
                                                        <p className="text-white font-medium">{booking.passengerName}</p>
                                                        <p className="text-slate-400 mt-0.5">{booking.passengerPhone}</p>
                                                        <p className="text-slate-400">{booking.passengerEmail}</p>
                                                    </div>

                                                    <div className="bg-[#111] p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                                        <span className="text-slate-400">Total Amount Paid</span>
                                                        <span className="text-xl font-bold text-white">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                                                    </div>

                                                    <p className="text-xs text-slate-500 text-right">
                                                        Booked on {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleString() : new Date(booking.createdAt).toLocaleString()}
                                                    </p>
                                                </div>

                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Cancel Booking</h3>
                        <p className="text-slate-400 text-sm mb-6">Are you sure you want to cancel your ride for <span className="text-white font-bold">{cancelModal.booking?.vehicleName}</span>?</p>

                        <label className="block text-sm font-medium text-slate-300 mb-2">Reason for cancellation</label>
                        <textarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none mb-6"
                            rows="3"
                            placeholder="Plans changed..."
                            value={cancelModal.reason}
                            onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                        ></textarea>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setCancelModal({ isOpen: false, booking: null, reason: '' })}
                                className="px-5 py-2.5 text-slate-300 font-medium hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Nevermind
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                            >
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTransportBookings;
