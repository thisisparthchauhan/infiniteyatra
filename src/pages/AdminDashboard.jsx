import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Loader, CheckCircle, XCircle, Trash2, Search, Calendar, DollarSign, Users, Eye, X, Clock, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';

const AdminDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null); // For Modal
    const [stats, setStats] = useState({
        total: 0,
        revenue: 0,
        profit: 0,
        pending: 0
    });

    const calculateProfit = (totalPrice, travelers) => {
        if (!travelers || travelers === 0) return 0;
        const pricePerPerson = totalPrice / travelers;
        let profitPerPerson = 0;

        if (pricePerPerson < 10000) {
            profitPerPerson = 2000;
        } else if (pricePerPerson <= 20000) {
            profitPerPerson = 5000;
        } else {
            profitPerPerson = 8000;
        }

        return profitPerPerson * travelers;
    };

    const fetchBookings = async () => {
        setLoading(true);
        setError('');
        try {
            const q = query(collection(db, 'bookings'));
            const querySnapshot = await getDocs(q);

            const bookingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by createdAt desc
            bookingsData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setBookings(bookingsData);

            const total = bookingsData.length;
            const revenue = bookingsData.reduce((acc, curr) => {
                const amountPaid = parseFloat(curr.amountPaid) || 0;
                // Fallback for old bookings that might only have totalPrice
                if (!curr.amountPaid && curr.status === 'confirmed') return acc + (parseFloat(curr.totalPrice) || 0);
                return acc + amountPaid;
            }, 0);

            const profit = bookingsData.reduce((acc, curr) => {
                const price = parseFloat(curr.totalPrice) || 0;
                const travelers = parseInt(curr.travelers) || 1;
                return acc + calculateProfit(price, travelers);
            }, 0);

            const pending = bookingsData.filter(b => b.status === 'pending').length;

            setStats({ total, revenue, profit, pending });

        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError(`Failed to fetch bookings: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, 'bookings', id), {
                status: newStatus
            });
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to DELETE this booking? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'bookings', id));
            setBookings(bookings.filter(b => b.id !== id));
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(null);
            }
        } catch (error) {
            console.error("Error deleting booking:", error);
            alert("Failed to delete booking.");
        }
    };

    const filteredBookings = bookings.filter(booking =>
        booking.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleString();
        }
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader className="animate-spin text-blue-600" size={40} />
                <p className="text-slate-500">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-24 px-6">
            <SEO title="Admin Dashboard" description="Manage bookings" url="/admin" />

            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <button onClick={fetchBookings} className="text-blue-600 hover:underline">Refresh Data</button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Bookings</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Revenue (Est.)</p>
                                <p className="text-2xl font-bold text-slate-900">₹{stats.revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Profit (Est.)</p>
                                <p className="text-2xl font-bold text-slate-900">₹{stats.profit.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending Actions</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or booking ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Booking ID</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Customer</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Booked On</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Package</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Amount</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-sm text-slate-500 font-mono">#{booking.id.slice(0, 6)}</td>
                                        <td className="p-4">
                                            <p className="font-medium text-slate-900">{booking.contactName || 'N/A'}</p>
                                            <p className="text-xs text-slate-500">{booking.contactEmail || 'N/A'}</p>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {formatDate(booking.createdAt)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            <p className="font-medium">{booking.packageTitle}</p>
                                            <p className="text-xs text-slate-500">Travel: {booking.bookingDate}</p>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-900">
                                            ₹{booking.amountPaid ? booking.amountPaid.toLocaleString() : booking.totalPrice?.toLocaleString()}
                                            {booking.balanceDue > 0 && (
                                                <div className="text-xs text-orange-600 font-normal">Pending: ₹{booking.balanceDue.toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {booking.status !== 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Mark Confirmed"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {booking.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Mark Cancelled"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredBookings.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No bookings found matching your search.
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-slate-900">Booking Details</h2>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${selectedBooking.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                selectedBooking.status === 'pending' && selectedBooking.amountPaid > 0 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                    selectedBooking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                        'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {selectedBooking.status === 'confirmed' ? <CheckCircle size={24} /> :
                                    selectedBooking.status === 'pending' ? <Clock size={24} /> : <XCircle size={24} />}
                                <div>
                                    <p className="font-bold uppercase tracking-wide text-sm">Booking Status: {selectedBooking.status}</p>
                                    <p className="text-sm opacity-90">
                                        {selectedBooking.status === 'confirmed' ? 'Payment Received & Trip Confirmed' :
                                            selectedBooking.status === 'pending' ? 'Waiting for Payment Verification' : 'Booking Cancelled'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Customer Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Customer Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500">Full Name</p>
                                            <p className="font-medium text-slate-900 text-lg">{selectedBooking.contactName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Email Address</p>
                                            <p className="font-medium text-slate-900">{selectedBooking.contactEmail || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Phone Number</p>
                                            <p className="font-medium text-slate-900">{selectedBooking.contactPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Package</p>
                                        <p className="font-medium text-slate-900 text-lg">{selectedBooking.packageTitle}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Travel Date</p>
                                        <p className="font-medium text-slate-900">{selectedBooking.bookingDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Travelers</p>
                                        <p className="font-medium text-slate-900">{selectedBooking.travelers} Person(s)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Traveler List */}
                        {selectedBooking.travelersList && selectedBooking.travelersList.length > 0 && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Traveler Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedBooking.travelersList.map((traveler, index) => (
                                        <div key={index} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                                            <div className="absolute top-2 right-2 bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                                                #{index + 1}
                                            </div>
                                            <p className="font-semibold text-slate-800">{traveler.name}</p>
                                            <div className="text-sm text-slate-500 mt-1 space-y-1">
                                                <p>Age: {traveler.age} • Gender: {traveler.gender}</p>
                                                <p>Mobile: {traveler.mobile}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Financials */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-500 text-sm">Total Package Cost</p>
                                    <p className="text-xl font-bold text-slate-900">₹{selectedBooking.totalPrice?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-sm">Amount Paid</p>
                                    <p className="text-xl font-bold text-green-600">
                                        ₹{selectedBooking.amountPaid ? selectedBooking.amountPaid.toLocaleString() : '0'}
                                    </p>
                                </div>
                                <div className="col-span-2 border-t border-slate-200 pt-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-slate-500 text-sm">Payment Type</p>
                                        <p className="font-semibold text-slate-800 capitalize">
                                            {selectedBooking.paymentType === 'token' ? 'Token Payment' : 'Full Payment'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-500 text-sm">Balance Due</p>
                                        <p className={`text-xl font-bold ${selectedBooking.balanceDue > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
                                            ₹{selectedBooking.balanceDue ? selectedBooking.balanceDue.toLocaleString() : '0'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profit Info (Admin Only) */}
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-4">Profit Analysis</h3>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-purple-600 text-sm">Estimated Profit</p>
                                    <p className="text-3xl font-bold text-purple-900">
                                        ₹{calculateProfit(selectedBooking.totalPrice, selectedBooking.travelers).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-purple-600 text-sm">Margin</p>
                                    <p className="font-bold text-purple-900">
                                        {Math.round((calculateProfit(selectedBooking.totalPrice, selectedBooking.travelers) / selectedBooking.totalPrice) * 100)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Special Requests */}
                        {selectedBooking.specialRequests && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Special Requests</h3>
                                <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm border border-blue-100">
                                    "{selectedBooking.specialRequests}"
                                </div>
                            </div>
                        )}

                        {/* Meta Info */}
                        <div className="pt-6 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                            <p>Booking ID: {selectedBooking.id}</p>
                            <p>Booked On: {formatDate(selectedBooking.createdAt)}</p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                        <button
                            onClick={() => setSelectedBooking(null)}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Close
                        </button>
                        {selectedBooking.status === 'pending' && (
                            <button
                                onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Confirm Booking
                            </button>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AdminDashboard;
