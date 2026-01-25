import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Mail, Star, Search, Filter, Phone, Award } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';

const CustomerCRM = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDeepCRMData = async () => {
            setLoading(true);
            try {
                // 1. Fetch all bookings to calculate real LTV
                const bookingsSnap = await getDocs(collection(db, 'bookings'));
                const bookingMap = {}; // userId -> { count, revenue, lastDate }

                bookingsSnap.docs.forEach(doc => {
                    const b = doc.data();
                    const uid = b.userId || b.contactEmail; // Fallback
                    if (!uid) return;

                    if (!bookingMap[uid]) bookingMap[uid] = { count: 0, revenue: 0, lastDate: 0 };

                    bookingMap[uid].count += 1;
                    if (b.status === 'confirmed') {
                        bookingMap[uid].revenue += parseFloat(b.totalPrice || b.amountPaid || 0);
                    }

                    const dateSeconds = b.createdAt?.seconds || 0;
                    if (dateSeconds > bookingMap[uid].lastDate) bookingMap[uid].lastDate = dateSeconds;
                });

                // 2. Fetch Users (or simulate from bookings if users coll is empty)
                // Ideally we fetch from 'users' collection where role == 'customer'
                // But for now, let's just use unique emails from bookings + users?
                // Let's stick to the 'users' collection logic as per schema, but merge with calculated data.

                // Fallback: If no users in DB, build from bookingMap
                const crmData = Object.keys(bookingMap).map(uid => {
                    const stats = bookingMap[uid];
                    return {
                        id: uid,
                        name: uid.includes('@') ? uid.split('@')[0] : 'Guest User', // Placeholder
                        email: uid.includes('@') ? uid : 'N/A',
                        phone: 'N/A',
                        totalBookings: stats.count,
                        ltv: stats.revenue,
                        lastActive: new Date(stats.lastDate * 1000).toLocaleDateString(),
                        segment: stats.revenue > 50000 ? 'VIP' : stats.revenue > 20000 ? 'Loyal' : 'New'
                    };
                });

                // Sort by LTV desc
                crmData.sort((a, b) => b.ltv - a.ltv);
                setCustomers(crmData);

            } catch (err) {
                console.error("CRM Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDeepCRMData();
    }, []);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-blue-400" /> Customer Relationships
                    </h3>
                    <p className="text-slate-400 text-sm">Track Lifetime Value (LTV) and engagement.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Find customer..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <UserPlus size={16} /> Add
                    </button>
                </div>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl border border-white/10">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Customers</p>
                    <p className="text-3xl font-bold text-white mt-2">{customers.length}</p>
                </div>
                <div className="glass-card p-6 rounded-xl border border-white/10">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Avg. LTV</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">
                        ₹{customers.length ? Math.round(customers.reduce((a, b) => a + b.ltv, 0) / customers.length).toLocaleString() : 0}
                    </p>
                </div>
                <div className="glass-card p-6 rounded-xl border border-white/10">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">VIP Segment</p>
                    <p className="text-3xl font-bold text-purple-400 mt-2">
                        {customers.filter(c => c.segment === 'VIP').length} <span className="text-sm text-slate-500 font-normal">Users</span>
                    </p>
                </div>
            </div>

            {/* TABLE */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Customer</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Segment</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Bookings</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">LTV (Revenue)</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500 animate-pulse">Analyzing Customer Data...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">No customers found.</td></tr>
                        ) : filtered.map((c, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                                            {c.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{c.name}</p>
                                            <p className="text-xs text-slate-500">{c.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border flex w-fit items-center gap-1 ${c.segment === 'VIP' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            c.segment === 'Loyal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                        }`}>
                                        {c.segment === 'VIP' && <Award size={10} />}
                                        {c.segment}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-300 text-sm font-mono">{c.totalBookings}</td>
                                <td className="p-4 text-green-400 font-bold text-sm">₹{c.ltv.toLocaleString()}</td>
                                <td className="p-4 text-right text-slate-500 text-xs">{c.lastActive}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerCRM;
