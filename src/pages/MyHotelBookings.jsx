import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { Building2, Calendar, Clock, CheckCircle2, CreditCard, XCircle, ChevronRight, Loader2, MessageCircle, MapPin, ArrowLeft, Eye, Search, Filter } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, emoji: '🟡' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CreditCard, emoji: '🔵' },
    paid: { label: 'Paid & Confirmed', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2, emoji: '✅' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, emoji: '❌' }
};

const MyHotelBookings = () => {
    const { user, currentUser } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'hotel_inquiries'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '-';
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => ['confirmed', 'paid'].includes(b.status)).length,
        totalSpent: bookings.filter(b => b.status === 'paid').reduce((s, b) => s + (b.totalAmount || 0), 0)
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-sm text-center">
                    <Building2 size={48} className="text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
                    <p className="text-zinc-500 text-sm mb-6">Please sign in to view your hotel bookings.</p>
                    <Link to="/login" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-700">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <SEO title="My Hotel Bookings | Infinite Yatra" description="Track your hotel bookings and inquiries on Infinite Yatra." />

            {/* Header */}
            <div className="border-b border-white/10 bg-gradient-to-b from-blue-900/20 to-transparent">
                <div className="container mx-auto px-4 max-w-5xl py-8">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight size={12} />
                        <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
                        <ChevronRight size={12} />
                        <span className="text-orange-500">Hotel Bookings</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">My Hotel Bookings</h1>
                            <p className="text-zinc-500 text-sm">Track your stays and payment status in real-time</p>
                        </div>
                        <Link to="/hotels" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/20">
                            Browse Hotels
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Bookings', value: stats.total, color: 'text-blue-400 bg-blue-500/10' },
                        { label: 'Pending', value: stats.pending, color: 'text-yellow-400 bg-yellow-500/10' },
                        { label: 'Confirmed', value: stats.confirmed, color: 'text-green-400 bg-green-500/10' },
                        { label: 'Total Spent', value: `₹${stats.totalSpent.toLocaleString()}`, color: 'text-emerald-400 bg-emerald-500/10' }
                    ].map(s => (
                        <div key={s.label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
                            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'pending', label: '🟡 Pending' },
                        { key: 'confirmed', label: '🔵 Confirmed' },
                        { key: 'paid', label: '✅ Paid' },
                        { key: 'cancelled', label: '❌ Cancelled' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.key ? 'bg-orange-500 text-white' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
                        <Building2 size={48} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">
                            {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
                        </h3>
                        <p className="text-zinc-500 text-sm mb-6">
                            {bookings.length === 0 ? 'Browse our curated hotels to plan your next stay.' : 'Try a different filter.'}
                        </p>
                        {bookings.length === 0 && (
                            <Link to="/hotels" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold">
                                Explore Hotels
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(booking => {
                            const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                            const StatusIcon = status.icon;
                            const isExpanded = expandedId === booking.id;

                            return (
                                <div key={booking.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                                    {/* Main Row */}
                                    <div className="p-5 flex items-center gap-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : booking.id)}>
                                        {/* Hotel Image */}
                                        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                                            {booking.hotelImage && <img src={booking.hotelImage} alt={booking.hotelName} className="w-full h-full object-cover" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white truncate">{booking.hotelName}</h3>
                                                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.color}`}>
                                                    <StatusIcon size={10} /> {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                {booking.hotelCity && <span className="flex items-center gap-1"><MapPin size={10} /> {booking.hotelCity}</span>}
                                                <span>{booking.roomType}</span>
                                                <span>{booking.nights} night{booking.nights > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                                                <span>{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</span>
                                                {booking.refId && <span className="font-mono text-blue-400">{booking.refId}</span>}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-bold text-white">₹{(booking.totalAmount || 0).toLocaleString()}</p>
                                            <p className="text-xs text-zinc-500">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</p>
                                        </div>

                                        <ChevronRight size={16} className={`text-zinc-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div><span className="text-zinc-500 text-xs block">Booked On</span><span className="text-white">{formatTimestamp(booking.createdAt)}</span></div>
                                                <div><span className="text-zinc-500 text-xs block">Check-in</span><span className="text-white">{formatDate(booking.checkIn)}</span></div>
                                                <div><span className="text-zinc-500 text-xs block">Check-out</span><span className="text-white">{formatDate(booking.checkOut)}</span></div>
                                                <div><span className="text-zinc-500 text-xs block">Special Requests</span><span className="text-white">{booking.specialRequests || 'None'}</span></div>
                                            </div>

                                            {/* Payment Link */}
                                            {booking.paymentLink && booking.status === 'confirmed' && (
                                                <a href={booking.paymentLink} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-center text-sm hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20">
                                                    💳 Complete Payment →
                                                </a>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <Link to={`/hotels/booking-confirmation?ref=${booking.id}`} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2 hover:bg-white/10">
                                                    <Eye size={14} /> View Confirmation
                                                </Link>
                                                <a href="https://wa.me/919265799325" target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 bg-green-600/20 border border-green-600/20 text-green-400 rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2 hover:bg-green-600/30">
                                                    <MessageCircle size={14} /> Chat Support
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyHotelBookings;
