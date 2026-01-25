import React, { useEffect, useState } from 'react';
import { Activity, Clock, TrendingUp, Search, Filter, Calendar, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import AdminAIWidget from '../AdminAIWidget';
import AdminSeatAnalytics from '../AdminSeatAnalytics';
import AdminStats from '../AdminStats';

const Overview = () => {
    const [stats, setStats] = useState({
        total: 0,
        revenue: 0,
        profit: 0,
        pending: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const calculateProfit = (totalPrice, travelers) => {
        if (!travelers || travelers === 0) return 0;
        const pricePerPerson = totalPrice / travelers;
        let profitPerPerson = 0;
        // Simple heuristic for profit calculation
        if (pricePerPerson < 10000) profitPerPerson = 2000;
        else if (pricePerPerson <= 20000) profitPerPerson = 5000;
        else profitPerPerson = 8000;
        return profitPerPerson * travelers;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, 'bookings'));
                const querySnapshot = await getDocs(q);
                const bookingsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort by date desc
                bookingsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                const total = bookingsData.length;
                const revenue = bookingsData.reduce((acc, curr) => {
                    const amountPaid = parseFloat(curr.amountPaid) || 0;
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
                setRecentBookings(bookingsData.slice(0, 5)); // Only top 5 for overview

            } catch (err) {
                console.error("Error fetching overview data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading Command Center...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* COMMAND CENTER HEADER */}
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Activity className="text-blue-400" /> Command Center
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Live Operational Status • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div className="flex gap-6 md:gap-10">
                        <div className="text-center">
                            <div className="relative inline-block">
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <p className="text-3xl font-bold text-white">3</p>
                            </div>
                            <p className="text-xs text-green-400 font-bold uppercase tracking-wider mt-1">Live Trips</p>
                        </div>

                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">{stats.pending}</p>
                            <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider mt-1">Pending Actions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI WIDGET */}
            <AdminAIWidget />

            {/* ANALYTICS & STATS */}
            <AdminSeatAnalytics />
            <AdminStats stats={stats} />

            {/* RECENT ACTIVITY TABLE */}
            <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-xs text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Trip</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{booking.contactName}</div>
                                        <div className="text-xs text-slate-500">{new Date(booking.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">{booking.packageTitle}</td>
                                    <td className="p-4 font-mono text-white">₹{booking.totalPrice}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400' :
                                                booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    'bg-red-500/10 text-red-400'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Overview;
