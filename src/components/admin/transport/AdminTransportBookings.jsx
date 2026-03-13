import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CalendarCheck, Search, Download, Eye, CheckCircle, XCircle, 
    Clock, MapPin, Calendar, Car, IndianRupee, MessageCircle, 
    X, Phone, Mail, Users, FileText, Save, ExternalLink
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const VEHICLE_TYPES = ['cycles', 'bikes', 'cars', 'traveller', 'bus', 'trains', 'flights', 'jet-planes', 'cruise'];
const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

const AdminTransportBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Drawer
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Drawer inline state
    const [drawerStatus, setDrawerStatus] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    // ── Real-time listener ──
    useEffect(() => {
        const q = query(
            collection(db, 'transportation_bookings'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setBookings(data);
            setLoading(false);

            // If drawer is open, refresh selected booking with live data
            setSelectedBooking(prev => {
                if (!prev) return null;
                const updated = data.find(b => b.id === prev.id);
                return updated || prev;
            });
        }, (error) => {
            console.error('Bookings listener error:', error);
            setBookings([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ── Stats ──
    const stats = useMemo(() => ({
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        completed: bookings.filter(b => b.status === 'completed').length,
    }), [bookings]);

    // ── Filtered bookings ──
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term ||
                (b.name || '').toLowerCase().includes(term) ||
                (b.phone || '').includes(term) ||
                b.id.toLowerCase().includes(term);
            const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
            const matchesType = filterType === 'all' || b.vehicleType === filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [bookings, searchTerm, filterStatus, filterType]);

    // ── Helpers ──
    const formatDate = (val) => {
        if (!val) return '—';
        if (val?.toDate) return val.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTimestamp = (val) => {
        if (!val) return '—';
        if (val?.toDate) return val.toDate().toLocaleString('en-IN');
        return new Date(val).toLocaleString('en-IN');
    };

    const getRoute = (b) => {
        const from = b.from || b.stops?.[0] || '—';
        const to = b.to || b.stops?.[b.stops?.length - 1] || '—';
        return { from, to };
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
            completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        const icons = { pending: Clock, confirmed: CheckCircle, completed: CheckCircle, cancelled: XCircle };
        const Icon = icons[status] || Clock;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${map[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                <Icon size={12} /> {status}
            </span>
        );
    };

    // ── Actions ──
    const openDrawer = (booking) => {
        setSelectedBooking(booking);
        setDrawerStatus(booking.status || 'pending');
        setAdminNote(booking.adminNote || '');
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedBooking(null);
    };

    const handleUpdateStatus = async () => {
        if (!selectedBooking || drawerStatus === selectedBooking.status) return;
        setSavingStatus(true);
        try {
            await updateDoc(doc(db, 'transportation_bookings', selectedBooking.id), {
                status: drawerStatus,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error('Status update failed:', err);
            alert('Failed to update status');
        } finally {
            setSavingStatus(false);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedBooking) return;
        setSavingNote(true);
        try {
            await updateDoc(doc(db, 'transportation_bookings', selectedBooking.id), {
                adminNote,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error('Note save failed:', err);
            alert('Failed to save note');
        } finally {
            setSavingNote(false);
        }
    };

    const getWhatsAppLink = (b) => {
        const phone = (b.phone || '').replace(/\D/g, '');
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const message = `Hi ${b.name}, your ${b.vehicleType || 'vehicle'} booking (ID: ${b.id.slice(-6).toUpperCase()}) for ${b.travelDate || 'your trip'} is confirmed! - Infinite Yatra Team`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    };

    const getCallLink = (b) => {
        const phone = (b.phone || '').replace(/\D/g, '');
        return `tel:+91${phone.startsWith('91') ? phone.slice(2) : phone}`;
    };

    // ── CSV Export ──
    const exportCSV = () => {
        if (filteredBookings.length === 0) { alert('No bookings to export'); return; }
        const headers = ['Booking ID', 'Name', 'Phone', 'Vehicle', 'From', 'To', 'Date', 'Passengers', 'Advance', 'Status'];
        const rows = filteredBookings.map(b => {
            const r = getRoute(b);
            return [
                b.id,
                `"${b.name || ''}"`,
                b.phone || '',
                b.vehicleType || '',
                `"${r.from}"`,
                `"${r.to}"`,
                b.travelDate || '',
                b.passengers || 1,
                b.advanceAmount || 0,
                b.status || ''
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'IY_Transport_Bookings.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Loading state ──
    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarCheck className="text-blue-500" />
                        Transport Bookings
                    </h2>
                    <p className="text-slate-400 text-sm">Real-time bookings from the transportation website.</p>
                </div>
                <button
                    onClick={exportCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors border border-slate-700"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Bookings', value: stats.total, color: 'text-white', border: 'border-l-slate-400', icon: CalendarCheck },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-400', border: 'border-l-yellow-500', icon: Clock },
                    { label: 'Confirmed', value: stats.confirmed, color: 'text-green-400', border: 'border-l-green-500', icon: CheckCircle },
                    { label: 'Completed', value: stats.completed, color: 'text-blue-400', border: 'border-l-blue-500', icon: CheckCircle },
                ].map((s, i) => (
                    <div key={i} className={`bg-slate-900 border border-slate-800 ${s.border} border-l-4 rounded-2xl p-5`}>
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon size={16} className={s.color} />
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                        </div>
                        <h3 className={`text-3xl font-black ${s.color}`}>{s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Search by Name or Phone</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-[#111] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-44">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle Type</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 capitalize"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Vehicles</option>
                        {VEHICLE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('-', ' ')}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-40">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 capitalize"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Bookings Table / Empty State */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden">
                {filteredBookings.length === 0 && bookings.length === 0 ? (
                    /* True empty state — no bookings at all */
                    <div className="py-24 px-6 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-slate-800/50 rounded-full flex items-center justify-center">
                            <CalendarCheck size={40} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No bookings yet — they'll appear here in real time</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">When customers book through the website, their details show up instantly.</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    /* Filter yields no results */
                    <div className="py-16 px-6 text-center">
                        <Search size={40} className="mx-auto mb-4 text-slate-700" />
                        <p className="text-lg font-medium text-slate-400">No bookings match your filters</p>
                        <p className="text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-[#1a1a1a] border-b border-slate-800 text-slate-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Booking ID</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Customer</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Phone</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Vehicle</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Route</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Travel Date</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Pax</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Advance</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredBookings.map(b => {
                                        const route = getRoute(b);
                                        return (
                                            <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-4">
                                                    <span className="font-mono text-xs font-bold text-slate-300 uppercase">{b.id.slice(-6)}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-white leading-tight truncate max-w-[160px]">{b.name || '—'}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-slate-400 font-mono text-xs">{b.phone || '—'}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold text-white capitalize flex items-center gap-1.5">
                                                        <Car size={14} className="text-slate-500" />
                                                        {(b.vehicleType || '—').replace('-', ' ')}
                                                    </p>
                                                    {b.subType && <p className="text-[10px] text-slate-500 capitalize ml-5">{b.subType}</p>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-xs text-slate-300 truncate max-w-[180px]">
                                                        {route.from} <span className="text-slate-600 px-1">→</span> {route.to}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm text-slate-300">{b.travelDate || '—'}</p>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="text-white font-bold">{b.passengers || 1}</span>
                                                </td>
                                                <td className="px-5 py-4 font-bold text-white">
                                                    ₹{(b.advanceAmount || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {statusBadge(b.status)}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => openDrawer(b)}
                                                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-800/50 max-h-[70vh]">
                            {filteredBookings.map(b => {
                                const route = getRoute(b);
                                return (
                                    <div key={b.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-mono text-xs font-bold text-slate-300 uppercase">{b.id.slice(-6)}</span>
                                                <p className="font-bold text-white mt-1">{b.name || '—'}</p>
                                                <p className="text-xs text-slate-500 font-mono">{b.phone || '—'}</p>
                                            </div>
                                            {statusBadge(b.status)}
                                        </div>
                                        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white capitalize flex items-center gap-1.5">
                                                    <Car size={14} className="text-blue-400 shrink-0" />
                                                    {(b.vehicleType || '—').replace('-', ' ')}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate mt-1">{route.from} → {route.to}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                <p className="font-bold text-white">₹{(b.advanceAmount || 0).toLocaleString('en-IN')}</p>
                                                <p className="text-[10px] text-slate-500">{b.travelDate || '—'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openDrawer(b)}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors border border-slate-700 flex items-center justify-center gap-2"
                                        >
                                            <Eye size={16} /> View Details
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ── BOOKING DETAIL DRAWER ── */}
            <AnimatePresence>
                {isDrawerOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] flex justify-end" onClick={closeDrawer}>
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-[#0a0a0a] border-l border-slate-800 w-full md:w-[520px] h-full shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drawer Header */}
                            <div className="py-5 px-6 border-b border-slate-800 bg-[#111] flex justify-between items-center shrink-0">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">Booking Details</h3>
                                        {statusBadge(selectedBooking.status)}
                                    </div>
                                    <p className="text-slate-500 font-mono text-xs mt-1">ID: {selectedBooking.id}</p>
                                </div>
                                <button onClick={closeDrawer} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                                {/* Customer Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Customer</h4>
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Users size={16} className="text-slate-500" />
                                            <span className="text-white font-bold text-lg">{selectedBooking.name || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-slate-500" />
                                            <span className="text-slate-300 font-mono">{selectedBooking.phone || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-slate-500" />
                                            <span className="text-slate-300 text-sm">{selectedBooking.email || 'N/A'}</span>
                                        </div>

                                        {/* Call & WhatsApp */}
                                        <div className="flex gap-3 mt-3 pt-3 border-t border-slate-800">
                                            <a
                                                href={getCallLink(selectedBooking)}
                                                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors text-sm"
                                            >
                                                <Phone size={16} /> Call
                                            </a>
                                            <a
                                                href={getWhatsAppLink(selectedBooking)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors text-sm"
                                            >
                                                <ExternalLink size={16} /> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Journey Route */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Journey</h4>
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        {/* Visual route: A → B → C → D */}
                                        <div className="relative pl-8 space-y-0">
                                            {/* Dotted connector line */}
                                            <div className="absolute top-3 bottom-3 left-[11px] border-l-2 border-dashed border-slate-700"></div>

                                            {/* From */}
                                            <div className="relative pb-5">
                                                <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">From</p>
                                                <p className="text-white font-medium">{selectedBooking.from || '—'}</p>
                                            </div>

                                            {/* Intermediate stops */}
                                            {(selectedBooking.stops || []).filter(s => s && s.trim()).map((stop, i) => (
                                                <div key={i} className="relative pb-5">
                                                    <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stop {String.fromCharCode(66 + i)}</p>
                                                    <p className="text-slate-300 text-sm">{stop}</p>
                                                </div>
                                            ))}

                                            {/* To */}
                                            <div className="relative">
                                                <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">To</p>
                                                <p className="text-white font-medium">{selectedBooking.to || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle & Trip Details */}
                                <div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Trip Details</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Vehicle</p>
                                            <p className="text-white font-semibold capitalize text-sm">{(selectedBooking.vehicleType || '—').replace('-', ' ')}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Sub-type</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.subType || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Travel Date</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.travelDate || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Pickup Time</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.pickupTime || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Return Date</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.returnDate || 'One-way'}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Passengers</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.passengers || 1}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Special Requirements */}
                                {selectedBooking.specialReqs && (
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <MessageCircle size={14} /> Special Requirements
                                        </h4>
                                        <p className="text-white text-sm bg-black/20 p-3 rounded-xl border border-white/5">{selectedBooking.specialReqs}</p>
                                    </div>
                                )}

                                {/* Financials */}
                                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-5 rounded-2xl border border-blue-500/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-400 text-sm">Estimated Fare</span>
                                        <span className="text-white font-bold text-lg">₹{(selectedBooking.estimatedFare || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-blue-500/20">
                                        <span className="text-blue-400 font-bold text-sm">Advance Paid (20%)</span>
                                        <span className="text-2xl font-black text-blue-400">₹{(selectedBooking.advanceAmount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Booking ID & Timestamp */}
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Booking ID</p>
                                        <p className="text-white font-mono text-xs">{selectedBooking.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Created</p>
                                        <p className="text-slate-400 text-xs">{formatTimestamp(selectedBooking.createdAt)}</p>
                                    </div>
                                </div>

                                {/* ── Admin Actions ── */}
                                <div className="space-y-4 pt-2">
                                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-slate-800 pb-2">Admin Actions</h4>

                                    {/* Status Updater */}
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Update Status</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="flex-1 bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 capitalize"
                                                value={drawerStatus}
                                                onChange={(e) => setDrawerStatus(e.target.value)}
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                                            </select>
                                            <button
                                                onClick={handleUpdateStatus}
                                                disabled={savingStatus || drawerStatus === selectedBooking.status}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
                                            >
                                                {savingStatus ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><CheckCircle size={14} /> Update</>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Internal Notes */}
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Internal Notes</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Add private notes about this booking..."
                                            className="w-full bg-[#111] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none mb-2"
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                        />
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={savingNote}
                                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1.5 border border-slate-700"
                                        >
                                            {savingNote ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={14} /> Save Note</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="py-4 px-6 border-t border-slate-800 bg-[#111] shrink-0">
                                <button onClick={closeDrawer} className="w-full py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-bold transition-colors text-sm">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTransportBookings;
