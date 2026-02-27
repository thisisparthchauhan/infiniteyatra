import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Search, Calendar, CreditCard, ChevronDown, Download, CheckCircle, XCircle, Clock } from 'lucide-react';


const AdminHotelBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const q = query(collection(db, 'hotel_bookings'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBookings(data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-500/10 text-gray-500';
        switch (status.toLowerCase()) {
            case 'confirmed': return 'bg-green-500/10 text-green-500';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            default: return 'bg-blue-500/10 text-blue-500';
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'All' || b.bookingStatus === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Hotel Bookings</h1>
                    <p className="text-slate-400">Track and manage hotel reservations</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                        <Download size={16} /> Export CSV
                    </button>
                    <button onClick={fetchBookings} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or booking ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500 transition-colors text-white"
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Confirmed', 'Pending', 'Cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${filterStatus === status
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Booking ID</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Hotel / Room</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Dates</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Payment</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading bookings...</td></tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500">No bookings found.</td></tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-xs text-blue-400">{booking.referenceId || booking.id.slice(0, 8)}</span>
                                            <p className="text-[10px] text-slate-500">{new Date(booking.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-sm text-white">{booking.customerName}</p>
                                            <p className="text-xs text-slate-500">{booking.customerPhone}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-slate-300">{booking.hotelName}</p>
                                            <p className="text-xs text-slate-500 bg-white/5 inline-block px-1 rounded mt-1">{booking.roomName}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Calendar size={12} />
                                                {booking.checkIn} <span className="text-slate-600">to</span> {booking.checkOut}
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">{booking.nights} Nights</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-sm text-white">₹{parseInt(booking.totalAmount).toLocaleString()}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded w-fit ${booking.paymentMethod === 'full' ? 'bg-green-500/10 text-green-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                                    {booking.paymentMethod === 'full' ? 'Full Paid' : 'Partial'}
                                                </span>
                                                <span className="text-[10px] text-slate-500">Paid: ₹{parseInt(booking.paidAmount).toLocaleString() || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(booking.bookingStatus)}`}>
                                                {booking.bookingStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button className="text-blue-500 hover:text-white transition-colors text-xs font-bold underline">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminHotelBookings;
