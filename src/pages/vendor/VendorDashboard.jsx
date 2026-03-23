import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { LayoutDashboard, Calendar, Building2, DollarSign, Phone, LogOut, Loader2, MessageCircle, Star, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'hotels', label: 'My Hotels', icon: Building2 },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'support', label: 'Support', icon: Phone }
];

const VendorDashboard = () => {
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [bookings, setBookings] = useState([]);
    const [hotels, setHotels] = useState([]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) { navigate('/vendor/login'); return; }
            try {
                const vDoc = await getDoc(doc(db, 'hotel_vendors', user.uid));
                if (!vDoc.exists() || vDoc.data().status === 'suspended') {
                    navigate('/vendor/login');
                    return;
                }
                setVendor({ uid: user.uid, ...vDoc.data() });
            } catch (e) {
                console.error(e);
                navigate('/vendor/login');
            } finally {
                setLoading(false);
            }
        });
        return () => unsub();
    }, [navigate]);

    // Load bookings for vendor's hotels
    useEffect(() => {
        if (!vendor?.hotelIds?.length) return;
        const q = query(collection(db, 'hotel_inquiries'), where('hotelId', 'in', vendor.hotelIds.slice(0, 10)));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => {
                const da = a.createdAt?.toDate?.() || new Date(0);
                const db2 = b.createdAt?.toDate?.() || new Date(0);
                return db2 - da;
            });
            setBookings(data);
        });
        return () => unsub();
    }, [vendor]);

    // Load vendor's hotels
    useEffect(() => {
        if (!vendor?.hotelIds?.length) return;
        const loadHotels = async () => {
            const loaded = [];
            for (const hid of vendor.hotelIds) {
                const snap = await getDoc(doc(db, 'hotels', hid));
                if (snap.exists()) loaded.push({ id: snap.id, ...snap.data() });
            }
            setHotels(loaded);
        };
        loadHotels();
    }, [vendor]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 size={32} className="text-teal-500 animate-spin" />
            </div>
        );
    }

    const confirmedBookings = bookings.filter(b => ['confirmed', 'paid'].includes(b.status));
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/vendor/login');
    };

    const formatDate = (ts) => {
        if (!ts) return '-';
        const d = ts.toDate?.() || new Date(ts);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    // ──── Dashboard Tab ────
    const DashboardView = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Bookings', value: confirmedBookings.length, icon: Calendar, color: 'text-teal-400 bg-teal-500/10' },
                    { label: 'Pending', value: pendingBookings.length, icon: Users, color: 'text-yellow-400 bg-yellow-500/10' },
                    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
                    { label: 'Hotels', value: hotels.length, icon: Building2, color: 'text-blue-400 bg-blue-500/10' }
                ].map(s => (
                    <div key={s.label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                            <s.icon size={20} />
                        </div>
                        <p className="text-2xl font-bold text-white">{s.value}</p>
                        <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Bookings */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10">
                    <h3 className="font-bold text-white">Recent Bookings</h3>
                </div>
                <div className="divide-y divide-white/5">
                    {bookings.slice(0, 5).map(b => (
                        <div key={b.id} className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">{b.clientName}</p>
                                <p className="text-xs text-zinc-500">{b.hotelName} • {b.roomType}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold text-sm">₹{(b.totalAmount || 0).toLocaleString()}</p>
                                <span className={`text-xs font-bold capitalize ${b.status === 'paid' ? 'text-green-400' : b.status === 'confirmed' ? 'text-blue-400' : b.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'}`}>{b.status}</span>
                            </div>
                        </div>
                    ))}
                    {bookings.length === 0 && <p className="p-6 text-center text-zinc-500 text-sm">No bookings yet</p>}
                </div>
            </div>
        </div>
    );

    // ──── Bookings Tab ────
    const BookingsView = () => (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-xs uppercase text-zinc-500 tracking-wider text-left">
                            <th className="p-4">Guest</th>
                            <th className="p-4">Room</th>
                            <th className="p-4">Dates</th>
                            <th className="p-4">Guests</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map(b => (
                            <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4">
                                    <p className="font-medium text-white">{b.clientName}</p>
                                    <p className="text-xs text-zinc-500">{b.refId || '-'}</p>
                                </td>
                                <td className="p-4 text-zinc-300">{b.roomType}</td>
                                <td className="p-4 text-zinc-300 whitespace-nowrap">{b.checkIn} → {b.checkOut}</td>
                                <td className="p-4 text-zinc-300">{b.guests}</td>
                                <td className="p-4 font-bold text-white">₹{(b.totalAmount || 0).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${b.status === 'paid' ? 'bg-green-500/20 text-green-400' : b.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' : b.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{b.status}</span>
                                </td>
                                <td className="p-4">
                                    <a href={`https://wa.me/91${b.clientPhone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 inline-flex">
                                        <MessageCircle size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && <p className="p-8 text-center text-zinc-500 text-sm">No bookings yet</p>}
            </div>
        </div>
    );

    // ──── My Hotels Tab ────
    const HotelsView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotels.map(h => (
                <div key={h.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${h.image || h.imageUrl || ''})` }}>
                        <div className="h-full w-full bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                            <div>
                                <h3 className="font-bold text-white">{h.name}</h3>
                                <p className="text-xs text-zinc-400">{h.location || h.city}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Rooms</span>
                            <span className="text-white">{h.rooms?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Starting Price</span>
                            <span className="text-white">₹{(h.price || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Category</span>
                            <span className="text-white">{h.category || '-'}</span>
                        </div>
                    </div>
                </div>
            ))}
            {hotels.length === 0 && (
                <div className="col-span-2 bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-zinc-500">No hotels assigned to your account</p>
                </div>
            )}
        </div>
    );

    // ──── Earnings Tab ────
    const EarningsView = () => {
        const IY_COMMISSION = 0.20; // 20% average
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-5 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-5 text-center">
                        <p className="text-xs text-zinc-500 mb-1">IY Commission (~20%)</p>
                        <p className="text-2xl font-bold text-orange-400">₹{Math.round(totalRevenue * IY_COMMISSION).toLocaleString()}</p>
                    </div>
                    <div className="bg-[#111] border border-emerald-500/20 rounded-2xl p-5 text-center">
                        <p className="text-xs text-zinc-500 mb-1">Your Earnings</p>
                        <p className="text-2xl font-bold text-emerald-400">₹{Math.round(totalRevenue * (1 - IY_COMMISSION)).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10">
                        <h3 className="font-bold text-white">Earnings Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-xs text-zinc-500 uppercase tracking-wider text-left">
                                    <th className="p-4">Ref</th>
                                    <th className="p-4">Hotel</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Commission</th>
                                    <th className="p-4">Your Share</th>
                                    <th className="p-4">Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                {confirmedBookings.map(b => {
                                    const total = b.totalAmount || 0;
                                    const commission = Math.round(total * IY_COMMISSION);
                                    const share = total - commission;
                                    return (
                                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-4 font-mono text-xs text-blue-400">{b.refId || b.id?.slice(0, 8)}</td>
                                            <td className="p-4 text-white">{b.hotelName}</td>
                                            <td className="p-4 text-white">₹{total.toLocaleString()}</td>
                                            <td className="p-4 text-orange-400">₹{commission.toLocaleString()}</td>
                                            <td className="p-4 text-emerald-400 font-bold">₹{share.toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${b.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {b.status === 'paid' ? 'Pending Payout' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {confirmedBookings.length === 0 && <p className="p-8 text-center text-zinc-500 text-sm">No confirmed bookings yet</p>}
                    </div>
                </div>
            </div>
        );
    };

    // ──── Support Tab ────
    const SupportView = () => (
        <div className="max-w-md mx-auto space-y-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center space-y-4">
                <h3 className="font-bold text-white text-lg">Need Help?</h3>
                <p className="text-sm text-zinc-400">Our team is available 24/7 to help you with any questions.</p>
                <a href="https://wa.me/919265799325" target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> Chat on WhatsApp
                </a>
                <a href="mailto:chauhanparth165@gmail.com" className="block w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">
                    📧 Email: chauhanparth165@gmail.com
                </a>
                <a href="tel:+919265799325" className="block w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">
                    📞 Call: +91 92657 99325
                </a>
            </div>
        </div>
    );

    const renderTab = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView />;
            case 'bookings': return <BookingsView />;
            case 'hotels': return <HotelsView />;
            case 'earnings': return <EarningsView />;
            case 'support': return <SupportView />;
            default: return <DashboardView />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#111] border-r border-white/10 flex flex-col shrink-0">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Infinite Yatra</p>
                            <p className="text-sm font-bold text-white">Vendor Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400 font-bold text-sm">
                            {(vendor?.vendorName || 'V')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{vendor?.vendorName}</p>
                            <p className="text-xs text-zinc-500 truncate">{vendor?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        {TABS.find(t => t.id === activeTab)?.label || 'Dashboard'}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">Welcome, {vendor?.vendorName}</p>
                </div>
                {renderTab()}
            </main>
        </div>
    );
};

export default VendorDashboard;
