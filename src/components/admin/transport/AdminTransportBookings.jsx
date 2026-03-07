import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, Search, Download, Eye, CheckCircle, XCircle, Check, X, Clock, MapPin, Calendar, Car, IndianRupee, MessageCircle } from 'lucide-react';
import { getBookings, updateBookingStatus } from '../../../services/transportService';

const AdminTransportBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Modals
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [cancelReason, setCancelReason] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await getBookings();

            // Sort by most recent first
            data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus, additionalData = {}) => {
        try {
            await updateBookingStatus(id, newStatus, additionalData);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus, ...additionalData } : b));

            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(prev => ({ ...prev, status: newStatus, ...additionalData }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const confirmCancelBooking = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation.');
            return;
        }
        await handleStatusChange(bookingToCancel.id, 'cancelled', { cancelReason });
        setCancelReason('');
        setIsCancelModalOpen(false);
        setBookingToCancel(null);
    };

    const openCancelModal = (booking) => {
        setBookingToCancel(booking);
        setCancelReason('');
        setIsCancelModalOpen(true);
    };

    const handleConfirmBooking = (booking) => {
        handleStatusChange(booking.id, 'confirmed');
        // Optionally trigger WhatsApp here if needed via logic or API
        const phone = booking.passengerPhone.replace(/\D/g, '');
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const message = `Hi ${booking.passengerName}, your transport booking (ID: ${booking.id.slice(-6).toUpperCase()}) for ${booking.vehicleName} is confirmed! Pickup: ${booking.pickupDate} at ${booking.pickupTime}.`;
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

        if (window.confirm('Booking Confirmed! Open WhatsApp to send confirmation message?')) {
            window.open(waUrl, '_blank');
        }
    };

    const openDetailModal = (booking) => {
        setSelectedBooking(booking);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedBooking(null);
    };

    // Derived states (Stats & Filters)
    const stats = useMemo(() => {
        return {
            total: bookings.length,
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            completed: bookings.filter(b => b.status === 'completed').length,
        };
    }, [bookings]);

    const citiesList = useMemo(() => {
        const c = new Set(bookings.map(b => b.pickupCity).filter(Boolean));
        return Array.from(c);
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const matchesSearch =
                b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
            const matchesType = filterType === 'all' || b.vehicleType === filterType;
            const matchesCity = filterCity === 'all' || b.pickupCity === filterCity;

            let matchesDate = true;
            if (dateRange.start && dateRange.end) {
                const bStart = new Date(b.pickupDate);
                const rStart = new Date(dateRange.start);
                const rEnd = new Date(dateRange.end);
                matchesDate = bStart >= rStart && bStart <= rEnd;
            }

            return matchesSearch && matchesStatus && matchesType && matchesCity && matchesDate;
        });
    }, [bookings, searchTerm, filterStatus, filterType, filterCity, dateRange]);

    const exportToCSV = () => {
        if (filteredBookings.length === 0) {
            alert('No bookings to export');
            return;
        }

        const headers = [
            'Booking ID', 'Created At', 'Customer Name', 'Customer Email', 'Customer Phone',
            'Vehicle Name', 'Vehicle Type', 'Pickup City', 'Pickup Address', 'Drop City', 'Drop Address',
            'Start Date', 'Start Time', 'End Date', 'Total Days', 'Total Hours',
            'Total Amount', 'Status', 'Special Requests', 'Cancel Reason'
        ];

        const csvRows = [headers.join(',')];

        filteredBookings.forEach(b => {
            const created = b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : new Date(b.createdAt || 0).toISOString();

            const row = [
                b.id, created, `"${b.passengerName || ''}"`, b.passengerEmail || '', b.passengerPhone || '',
                `"${b.vehicleName || ''}"`, b.vehicleType || '', `"${b.pickupCity || ''}"`, `"${b.pickupAddress || ''}"`, `"${b.dropCity || ''}"`, `"${b.dropAddress || ''}"`,
                b.pickupDate || '', b.pickupTime || '', b.returnDate || '', b.totalDays || '', b.totalHours || '',
                b.totalAmount || 0, b.status || '', `"${(b.specialRequests || '').replace(/"/g, '""')}"`, `"${(b.cancelReason || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `transport_bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-wider"><CheckCircle size={12} /> Confirmed</span>;
            case 'completed': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider"><CheckCircle size={12} /> Completed</span>;
            case 'cancelled': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider"><XCircle size={12} /> Cancelled</span>;
            case 'pending': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider"><Clock size={12} /> Pending</span>;
            default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 uppercase tracking-wider">{status}</span>;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarCheck className="text-blue-500" />
                        Manage Transport Bookings
                    </h2>
                    <p className="text-slate-400">View, confirm, and manage your vehicle rentals.</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors border border-slate-700"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Bookings</p>
                    <h3 className="text-3xl font-black text-white">{stats.total}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <p className="text-yellow-500/70 text-xs font-bold uppercase tracking-wider mb-1">Pending action</p>
                    <h3 className="text-3xl font-black text-yellow-500">{stats.pending}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <p className="text-green-500/70 text-xs font-bold uppercase tracking-wider mb-1">Confirmed</p>
                    <h3 className="text-3xl font-black text-green-500">{stats.confirmed}</h3>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                    <p className="text-blue-500/70 text-xs font-bold uppercase tracking-wider mb-1">Completed</p>
                    <h3 className="text-3xl font-black text-blue-500">{stats.completed}</h3>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Search Customer or ID</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-[#111] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle Type</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="cycle">Cycle</option>
                        <option value="ebicycle">E-Bicycle</option>
                        <option value="bike">Bike</option>
                        <option value="car">Car</option>
                        <option value="traveller">Traveller</option>
                    </select>
                </div>

                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                    >
                        <option value="all">All Cities</option>
                        {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="w-full md:w-auto flex gap-2">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                        <input
                            type="date"
                            className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2text-white text-sm focus:outline-none focus:border-blue-500 h-[42px] color-scheme-dark"
                            value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                        <input
                            type="date"
                            className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2text-white text-sm focus:outline-none focus:border-blue-500 h-[42px] color-scheme-dark"
                            value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl flex flex-col max-h-[70vh] shadow-xl overflow-hidden">
                <div className="hidden lg:block overflow-x-auto overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#1a1a1a] border-b border-slate-800 text-slate-400 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">ID / Date</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Customer</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Vehicle</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Journey</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredBookings.map(booking => {
                                const createdDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt || 0);

                                return (
                                    <tr key={booking.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs font-bold text-slate-300 uppercase">
                                                {booking.id.slice(-6)}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">
                                                {createdDate.toLocaleDateString('en-GB')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white leading-tight">{booking.passengerName}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{booking.passengerPhone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white flex items-center gap-1.5 leading-tight">
                                                <Car size={14} className="text-slate-500" />
                                                {booking.vehicleName}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize mt-0.5 ml-5">{booking.vehicleType}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
                                                    <Calendar size={12} className="text-slate-500" />
                                                    {booking.pickupDate} <span className="text-slate-600 px-1">→</span> {booking.returnDate}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <MapPin size={12} className="text-blue-500" />
                                                    {booking.pickupCity}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            ₹{booking.totalAmount?.toLocaleString('en-IN') || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openDetailModal(booking)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-700"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleConfirmBooking(booking)}
                                                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors border border-green-500"
                                                            title="Confirm Booking"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openCancelModal(booking)}
                                                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors border border-red-500"
                                                            title="Cancel Booking"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}

                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(booking.id, 'completed')}
                                                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 text-xs font-bold rounded-lg transition-colors border border-blue-500 whitespace-nowrap"
                                                    >
                                                        Mark Done
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredBookings.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-500 bg-slate-900/50">
                                        <CalendarCheck size={48} className="mx-auto mb-4 text-slate-700" />
                                        <p className="text-lg font-medium text-slate-400">No bookings found</p>
                                        <p className="text-sm">Try adjusting your filters or search term.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-800/50">
                    {filteredBookings.map(booking => {
                        const createdDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt || 0);

                        return (
                            <div key={booking.id} className="p-4 space-y-4 hover:bg-slate-800/30 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-mono text-xs font-bold text-slate-300 uppercase">
                                            {booking.id.slice(-6)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {createdDate.toLocaleDateString('en-GB')}
                                        </div>
                                    </div>
                                    {getStatusBadge(booking.status)}
                                </div>

                                <div>
                                    <p className="font-bold text-white text-base truncate">{booking.passengerName}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{booking.passengerPhone}</p>
                                </div>

                                <div className="flex items-start gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white flex items-center gap-1.5 text-sm mb-1 truncate">
                                            <Car size={14} className="text-blue-400 shrink-0" />
                                            {booking.vehicleName}
                                        </p>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Calendar size={12} className="shrink-0" />
                                                {booking.pickupDate} → {booking.returnDate}
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <MapPin size={12} className="shrink-0" />
                                                {booking.pickupCity}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-bold text-white">₹{booking.totalAmount?.toLocaleString('en-IN') || 0}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/50">
                                    <button onClick={() => openDetailModal(booking)} className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors border border-slate-700"><Eye size={16} /></button>

                                    {booking.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleConfirmBooking(booking)} className="bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors border border-green-500"><Check size={16} /></button>
                                            <button onClick={() => openCancelModal(booking)} className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors border border-red-500"><X size={16} /></button>
                                        </>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <button onClick={() => handleStatusChange(booking.id, 'completed')} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold rounded-xl min-h-[44px] transition-colors whitespace-nowrap border border-blue-500">Mark Done</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredBookings.length === 0 && (
                        <div className="p-16 text-center text-slate-500 bg-slate-900/50">
                            <CalendarCheck size={48} className="mx-auto mb-4 text-slate-700" />
                            <p className="text-sm font-medium">No bookings found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Booking Modal */}
            <AnimatePresence>
                {isCancelModalOpen && bookingToCancel && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111] border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">Cancel Booking</h3>
                                <p className="text-slate-400 text-sm mb-6">
                                    Are you sure you want to cancel booking <span className="font-mono text-white">{bookingToCancel.id.slice(-6).toUpperCase()}</span>?
                                </p>

                                <label className="block text-sm font-medium text-slate-300 mb-2">Reason for Cancellation</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none mb-6"
                                    rows="3"
                                    placeholder="Enter reason..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                ></textarea>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-slate-400 font-medium hover:bg-slate-800 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={confirmCancelBooking}
                                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
                                    >
                                        Confirm Cancellation
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Details Modal */}
            <AnimatePresence>
                {isDetailModalOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] flex items-center justify-center md:p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="bg-[#0a0a0a] md:border border-slate-800 w-full h-full md:h-auto md:max-h-[90vh] max-w-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="py-5 px-8 border-b border-slate-800 bg-[#111] flex justify-between items-center shrink-0">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-bold text-white">Booking Details</h3>
                                        {getStatusBadge(selectedBooking.status)}
                                    </div>
                                    <p className="text-slate-500 font-mono text-xs mt-1">ID: {selectedBooking.id}</p>
                                </div>
                                <button onClick={closeDetailModal} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                                {/* Customer Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Customer Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium mb-1">Name</p>
                                            <p className="text-white font-bold">{selectedBooking.passengerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium mb-1">Phone</p>
                                            <p className="text-white font-mono">{selectedBooking.passengerPhone}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium mb-1">Email</p>
                                            <p className="text-white break-words">{selectedBooking.passengerEmail || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Vehicle Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium mb-1">Vehicle Name</p>
                                            <p className="text-white font-bold flex items-center gap-2">
                                                <Car size={16} className="text-slate-400" />
                                                {selectedBooking.vehicleName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium mb-1">Vehicle Type</p>
                                            <p className="text-white capitalize">{selectedBooking.vehicleType}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs font-medium mb-1">Base Price Mode</p>
                                            <p className="text-white">{selectedBooking.totalDays > 0 ? 'Per Day' : 'Per Hour'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Journey Details */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Journey Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <div>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Pickup</p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Calendar size={16} className="text-slate-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-white font-medium">{selectedBooking.pickupDate}</p>
                                                        <p className="text-slate-500 text-xs">Date</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Clock size={16} className="text-slate-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-white font-medium">{selectedBooking.pickupTime}</p>
                                                        <p className="text-slate-500 text-xs">Time</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <MapPin size={16} className="text-blue-500 mt-0.5" />
                                                    <div>
                                                        <p className="text-white font-medium">{selectedBooking.pickupCity}</p>
                                                        <p className="text-slate-400 text-sm mt-0.5">{selectedBooking.pickupAddress}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Return / Drop</p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Calendar size={16} className="text-slate-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-white font-medium">{selectedBooking.returnDate}</p>
                                                        <p className="text-slate-500 text-xs">Date</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Clock size={16} className="text-slate-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-white font-medium">As per duration</p>
                                                        <p className="text-slate-500 text-xs">Time</p>
                                                    </div>
                                                </div>
                                                {selectedBooking.dropCity && (
                                                    <div className="flex items-start gap-3">
                                                        <MapPin size={16} className="text-purple-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-white font-medium">{selectedBooking.dropCity}</p>
                                                            <p className="text-slate-400 text-sm mt-0.5">{selectedBooking.dropAddress}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financials & Duration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Duration</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">
                                                {selectedBooking.totalDays > 0 ? selectedBooking.totalDays : selectedBooking.totalHours}
                                            </span>
                                            <span className="text-slate-400 font-medium">
                                                {selectedBooking.totalDays > 0 ? (selectedBooking.totalDays === 1 ? 'Day' : 'Days') : (selectedBooking.totalHours === 1 ? 'Hour' : 'Hours')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-5 rounded-2xl border border-blue-500/20">
                                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4">Total Amount</h4>
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={28} className="text-white" />
                                            <span className="text-4xl font-black text-white leading-none">
                                                {selectedBooking.totalAmount?.toLocaleString('en-IN') || 0}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">Includes Base rate + CGST (9%) + SGST (9%)</p>
                                    </div>
                                </div>

                                {/* Special Requests / Cancel Reason */}
                                {(selectedBooking.specialRequests || selectedBooking.cancelReason) && (
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        {selectedBooking.specialRequests && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <MessageCircle size={14} /> Special Requests
                                                </h4>
                                                <p className="text-white text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                                                    {selectedBooking.specialRequests}
                                                </p>
                                            </div>
                                        )}
                                        {selectedBooking.cancelReason && (
                                            <div>
                                                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <XCircle size={14} /> Cancellation Reason
                                                </h4>
                                                <p className="text-white text-sm bg-red-500/10 text-red-100 p-4 rounded-xl border border-red-500/20">
                                                    {selectedBooking.cancelReason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="text-center">
                                    <p className="text-xs text-slate-600">
                                        Booking created on {selectedBooking.createdAt?.toDate ? selectedBooking.createdAt.toDate().toLocaleString() : new Date(selectedBooking.createdAt || 0).toLocaleString()}
                                    </p>
                                </div>

                            </div>

                            {/* Footer Actions */}
                            <div className="py-4 px-8 border-t border-slate-800 bg-[#111] flex justify-between items-center shrink-0">

                                <div>
                                    {selectedBooking.status === 'pending' && (
                                        <button
                                            onClick={() => openCancelModal(selectedBooking)}
                                            className="text-red-400 hover:text-red-300 font-bold transition-colors"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={closeDetailModal} className="px-6 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-bold transition-colors">
                                        Close
                                    </button>

                                    {selectedBooking.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                handleConfirmBooking(selectedBooking);
                                                closeDetailModal();
                                            }}
                                            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2 list-none"
                                        >
                                            <Check size={18} /> Confirm Now
                                        </button>
                                    )}
                                    {selectedBooking.status === 'confirmed' && (
                                        <button
                                            onClick={() => {
                                                handleStatusChange(selectedBooking.id, 'completed');
                                                closeDetailModal();
                                            }}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Mark Completed
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminTransportBookings;
