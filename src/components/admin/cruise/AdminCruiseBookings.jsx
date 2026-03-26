import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck, Search, Download, Eye, CheckCircle, XCircle,
    Clock, Calendar, IndianRupee, X, Phone, Mail, Users,
    Save, ExternalLink, Ship, PartyPopper, MessageCircle
} from 'lucide-react';
import { listenToCruiseBookings, updateCruiseBookingStatus, updateCruiseBookingData } from '../../../services/cruiseService';

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled'];
const SLOT_OPTIONS = ['all', 'Lunch Cruise', 'Dinner Slot 1', 'Dinner Slot 2', 'River Blue Party'];

const AdminCruiseBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSlot, setFilterSlot] = useState('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Drawer
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerStatus, setDrawerStatus] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    // ── Real-time listener ──
    useEffect(() => {
        const unsubscribe = listenToCruiseBookings((data) => {
            setBookings(data);
            setLoading(false);
            setSelectedBooking(prev => {
                if (!prev) return null;
                return data.find(b => b.id === prev.id) || prev;
            });
        }, (error) => {
            console.error('Cruise bookings listener error:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ── Stats ──
    const stats = useMemo(() => {
        const confirmed = bookings.filter(b => b.status === 'confirmed');
        return {
            total: bookings.length,
            pending: bookings.filter(b => b.status === 'pending').length,
            confirmed: confirmed.length,
            cancelled: bookings.filter(b => b.status === 'cancelled').length,
            estimatedRevenue: confirmed.reduce((sum, b) => sum + (b.estimated_total || 0), 0),
        };
    }, [bookings]);

    // ── Filtered bookings ──
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term ||
                (b.name || '').toLowerCase().includes(term) ||
                (b.phone || '').includes(term) ||
                (b.bookingRef || '').toLowerCase().includes(term);
            const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
            const matchesSlot = filterSlot === 'all' || (b.slot || '').includes(filterSlot);

            let matchesDate = true;
            if (filterDateFrom) matchesDate = matchesDate && (b.date || '') >= filterDateFrom;
            if (filterDateTo) matchesDate = matchesDate && (b.date || '') <= filterDateTo;

            return matchesSearch && matchesStatus && matchesSlot && matchesDate;
        });
    }, [bookings, searchTerm, filterStatus, filterSlot, filterDateFrom, filterDateTo]);

    // ── Helpers ──
    const formatTimestamp = (val) => {
        if (!val) return '—';
        if (val?.toDate) return val.toDate().toLocaleString('en-IN');
        return new Date(val).toLocaleString('en-IN');
    };

    const statusBadge = (status) => {
        const map = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
            cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        const icons = { pending: Clock, confirmed: CheckCircle, cancelled: XCircle };
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
            await updateCruiseBookingStatus(selectedBooking.id, drawerStatus);
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
            await updateCruiseBookingData(selectedBooking.id, { adminNote });
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
        const ref = b.bookingRef || b.id.slice(-6).toUpperCase();
        const message = `Hi ${b.name}, your River Cruise booking (Ref: ${ref}) for ${b.date || 'your voyage'} — ${b.slot || ''} is confirmed! 🚢\n- Infinite Yatra Team`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    };

    const getCallLink = (b) => {
        const phone = (b.phone || '').replace(/\D/g, '');
        return `tel:+91${phone.startsWith('91') ? phone.slice(2) : phone}`;
    };

    // ── CSV Export ──
    const exportCSV = () => {
        if (filteredBookings.length === 0) { alert('No bookings to export'); return; }
        const headers = ['Ref', 'Name', 'Phone', 'Email', 'Slot', 'Date', 'Guests', 'Occasion', 'Est. Total', 'Status', 'Special Requests'];
        const rows = filteredBookings.map(b => [
            b.bookingRef || '',
            `"${b.name || ''}"`,
            b.phone || '',
            b.email || '',
            `"${b.slot || ''}"`,
            b.date || '',
            b.guests || 1,
            `"${b.occasion || ''}"`,
            b.estimated_total || 0,
            b.status || '',
            `"${(b.special_requests || '').replace(/"/g, '""')}"`,
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'IY_Cruise_Bookings.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Ship className="text-amber-500" />
                        Cruise Bookings
                    </h2>
                    <p className="text-slate-400 text-sm">Real-time bookings from the River Cruise page.</p>
                </div>
                <button
                    onClick={exportCSV}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors border border-slate-700"
                >
                    <Download size={18} /> Export CSV
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                    { label: 'Total', value: stats.total, color: 'text-white', border: 'border-l-slate-400', icon: CalendarCheck },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-400', border: 'border-l-yellow-500', icon: Clock },
                    { label: 'Confirmed', value: stats.confirmed, color: 'text-green-400', border: 'border-l-green-500', icon: CheckCircle },
                    { label: 'Cancelled', value: stats.cancelled, color: 'text-red-400', border: 'border-l-red-500', icon: XCircle },
                    { label: 'Est. Revenue', value: `₹${stats.estimatedRevenue.toLocaleString('en-IN')}`, color: 'text-amber-400', border: 'border-l-amber-500', icon: IndianRupee, isText: true },
                ].map((s, i) => (
                    <div key={i} className={`bg-slate-900 border border-slate-800 ${s.border} border-l-4 rounded-2xl p-5`}>
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon size={16} className={s.color} />
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                        </div>
                        <h3 className={`text-3xl font-black ${s.color}`}>{s.isText ? s.value : s.value}</h3>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Search by Name, Phone or Ref</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-[#111] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-40">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm capitalize"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-44">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Slot</label>
                    <select
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm"
                        value={filterSlot}
                        onChange={e => setFilterSlot(e.target.value)}
                    >
                        {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Slots' : s}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                    <input
                        type="date"
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm"
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                    <input
                        type="date"
                        className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm"
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                    />
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden">
                {filteredBookings.length === 0 && bookings.length === 0 ? (
                    <div className="py-24 px-6 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-slate-800/50 rounded-full flex items-center justify-center">
                            <Ship size={40} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">No cruise bookings yet</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">When customers book the river cruise, their details show up here in real time.</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="py-16 px-6 text-center">
                        <Search size={40} className="mx-auto mb-4 text-slate-700" />
                        <p className="text-lg font-medium text-slate-400">No bookings match your filters</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-[#1a1a1a] border-b border-slate-800 text-slate-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Ref</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Phone</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Slot</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Guests</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Est. Total</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Occasion</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredBookings.map(b => (
                                        <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-xs font-bold text-amber-400 uppercase">{b.bookingRef || b.id.slice(-6)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-white truncate max-w-[160px]">{b.name || '—'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-mono text-xs">{b.phone || '—'}</span>
                                                    <a href={getWhatsAppLink(b)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 transition">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-300 truncate max-w-[140px]">{b.slot || '—'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-300">{b.date || '—'}</td>
                                            <td className="px-5 py-4 text-center"><span className="text-white font-bold">{b.guests || 1}</span></td>
                                            <td className="px-5 py-4 font-bold text-white">₹{(b.estimated_total || 0).toLocaleString('en-IN')}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-slate-400 text-xs truncate max-w-[120px]">{b.occasion || '—'}</p>
                                            </td>
                                            <td className="px-5 py-4">{statusBadge(b.status)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => openDrawer(b)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5">
                                                    <Eye size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden flex-1 overflow-y-auto divide-y divide-slate-800/50 max-h-[70vh]">
                            {filteredBookings.map(b => (
                                <div key={b.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-mono text-xs font-bold text-amber-400 uppercase">{b.bookingRef || b.id.slice(-6)}</span>
                                            <p className="font-bold text-white mt-1">{b.name || '—'}</p>
                                            <p className="text-xs text-slate-500 font-mono">{b.phone || '—'}</p>
                                        </div>
                                        {statusBadge(b.status)}
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                                                <Ship size={14} className="text-amber-400 shrink-0" />
                                                {b.slot || '—'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">{b.guests} guest{b.guests > 1 ? 's' : ''} · {b.occasion || 'General'}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className="font-bold text-white">₹{(b.estimated_total || 0).toLocaleString('en-IN')}</p>
                                            <p className="text-[10px] text-slate-500">{b.date || '—'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => openDrawer(b)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-bold transition border border-slate-700 flex items-center justify-center gap-2">
                                        <Eye size={16} /> View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ══ BOOKING DETAIL DRAWER ══ */}
            <AnimatePresence>
                {isDrawerOpen && selectedBooking && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] flex justify-end" onClick={closeDrawer}>
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#0a0a0a] border-l border-slate-800 w-full md:w-[520px] h-full shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drawer Header */}
                            <div className="py-5 px-6 border-b border-slate-800 bg-[#111] flex justify-between items-center shrink-0">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">Booking Details</h3>
                                        {statusBadge(selectedBooking.status)}
                                    </div>
                                    <p className="text-amber-400 font-mono text-xs mt-1 font-bold">{selectedBooking.bookingRef || selectedBooking.id}</p>
                                </div>
                                <button onClick={closeDrawer} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><X size={20} /></button>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                                {/* Customer Info */}
                                <div>
                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Customer</h4>
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Users size={16} className="text-slate-500" />
                                            <span className="text-white font-bold text-lg">{selectedBooking.name || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-slate-500" />
                                            <span className="text-slate-300 font-mono">+91 {selectedBooking.phone || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-slate-500" />
                                            <span className="text-slate-300 text-sm">{selectedBooking.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex gap-3 mt-3 pt-3 border-t border-slate-800">
                                            <a href={getCallLink(selectedBooking)} className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition text-sm">
                                                <Phone size={16} /> Call
                                            </a>
                                            <a href={getWhatsAppLink(selectedBooking)} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold transition text-sm">
                                                <ExternalLink size={16} /> WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Cruise Details */}
                                <div>
                                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Cruise Details</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Slot</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.slot || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Date</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.date || '—'}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Guests</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.guests || 1}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Occasion</p>
                                            <p className="text-white font-semibold text-sm">{selectedBooking.occasion || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Special Requests */}
                                {selectedBooking.special_requests && (
                                    <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <MessageCircle size={14} /> Special Requests
                                        </h4>
                                        <p className="text-white text-sm bg-black/20 p-3 rounded-xl border border-white/5">{selectedBooking.special_requests}</p>
                                    </div>
                                )}

                                {/* Financials */}
                                <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 p-5 rounded-2xl border border-amber-500/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-400 text-sm">Price per Person</span>
                                        <span className="text-white font-bold">₹{(selectedBooking.slot_price || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-slate-400 text-sm">Guests</span>
                                        <span className="text-white font-bold">{selectedBooking.guests || 1}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-amber-500/20">
                                        <span className="text-amber-400 font-bold text-sm">Estimated Total</span>
                                        <span className="text-2xl font-black text-amber-400">₹{(selectedBooking.estimated_total || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Timestamp */}
                                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Booking Ref</p>
                                        <p className="text-amber-400 font-mono text-xs font-bold">{selectedBooking.bookingRef || selectedBooking.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Created</p>
                                        <p className="text-slate-400 text-xs">{formatTimestamp(selectedBooking.created_at)}</p>
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
                                                className="flex-1 bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm capitalize"
                                                value={drawerStatus}
                                                onChange={e => setDrawerStatus(e.target.value)}
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                                            </select>
                                            <button
                                                onClick={handleUpdateStatus}
                                                disabled={savingStatus || drawerStatus === selectedBooking.status}
                                                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition flex items-center gap-1.5 shrink-0"
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
                                            className="w-full bg-[#111] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm resize-none mb-2"
                                            value={adminNote}
                                            onChange={e => setAdminNote(e.target.value)}
                                        />
                                        <button
                                            onClick={handleSaveNote}
                                            disabled={savingNote}
                                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-1.5 border border-slate-700"
                                        >
                                            {savingNote ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={14} /> Save Note</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="py-4 px-6 border-t border-slate-800 bg-[#111] shrink-0">
                                <button onClick={closeDrawer} className="w-full py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-bold transition text-sm">
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

export default AdminCruiseBookings;
