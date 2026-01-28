import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Search, Calendar, Eye, ArrowUpRight, DollarSign, Users, BarChart3, Clock } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';
import AdminSeatAnalytics from '../AdminSeatAnalytics';

const Overview = () => {
    const [stats, setStats] = useState({
        total: 0,
        mainRevenue: 0,
        estProfit: 0,
        avgBookingValue: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [topPackages, setTopPackages] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
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
                // 1. Fetch Packages to get Cost Prices
                const pkgSnapshot = await getDocs(collection(db, 'packages'));
                const pkgMap = {};
                pkgSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Normalize ID to match booking packageIds if needed
                    pkgMap[doc.id] = data;
                    // Also map by title if ID is not reliable in bookings, but ID is preferred
                });

                // 2. Fetch Bookings
                const bookingsQ = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
                const bookingsSnapshot = await getDocs(bookingsQ);
                const bookingsData = bookingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const total = bookingsData.length;

                let revenue = 0;
                let profit = 0;
                const tripCounts = {}; // For Top Performing
                const categoryCounts = {}; // For Top Categories

                bookingsData.forEach(booking => {
                    const amount = parseFloat(booking.totalPrice) || 0;
                    const travelers = parseInt(booking.travelers) || 1;

                    // Revenue
                    revenue += amount;

                    // Profit
                    // Try to find package by ID first
                    let pkg = pkgMap[booking.packageId];

                    // Fallback: If not found by ID (legacy data), try finding by Title match
                    if (!pkg) {
                        pkg = Object.values(pkgMap).find(p => p.title === booking.packageTitle);
                    }

                    if (pkg && pkg.costPrice) {
                        const cost = parseFloat(pkg.costPrice) || 0;
                        const sellPrice = amount; // Total selling price for this booking
                        // Cost for this booking = CostPerPerson * Travelers
                        // Note: Assuming costPrice in package is Per Person
                        const totalCost = cost * travelers;
                        profit += (sellPrice - totalCost);
                    } else {
                        // Fallback Heuristic if no package/cost found
                        profit += calculateProfit(amount, travelers);
                    }

                    // Count for Top Performing
                    const tripKey = booking.packageTitle || 'Unknown Trip';
                    if (!tripCounts[tripKey]) tripCounts[tripKey] = 0;
                    tripCounts[tripKey]++;
                });

                const avgValue = total > 0 ? revenue / total : 0;

                setStats({
                    total,
                    mainRevenue: revenue,
                    estProfit: profit,
                    avgBookingValue: avgValue
                });


                const sortedTrips = Object.entries(tripCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 3) // Top 3
                    .map(([title, count]) => ({ title, count }));

                const sortedCategories = Object.entries(categoryCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 4)
                    .map(([name, count]) => ({ name, count }));

                setTopCategories(sortedCategories);

                setTopPackages(sortedTrips);
                setRecentBookings(bookingsData.slice(0, 5)); // Recent Activity Table


            } catch (err) {
                console.error("Error fetching overview data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            {/* TOP HEADER CARD */}
            <div className="w-full relative overflow-hidden rounded-3xl bg-[#1a103c] border border-white/5 shadow-2xl">
                {/* Background Gradient Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                    <div className="space-y-4 max-w-xl">
                        <div className="flex items-baseline gap-4">
                            <h2 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(stats.mainRevenue)}</h2>
                            <span className="text-slate-400 line-through text-sm">₹{Math.round(stats.mainRevenue * 0.8).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <TrendingUp size={16} />
                            <span>High seat utilization ({'>'}80%). Scarcity pricing applied.</span>
                        </div>
                        <button className="mt-2 w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                            Apply AI Pricing
                        </button>
                    </div>
                </div>
            </div>

            {/* SEAT ANALYTICS SECTION */}
            <AdminSeatAnalytics />

            {/* 4-COLUMN KEY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <DollarSign size={20} />
                        </div>
                        <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <ArrowUpRight size={10} /> +12.5% MoM
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.mainRevenue)}</p>
                </div>

                {/* Net Profit */}
                <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <TrendingUp size={20} />
                        </div>
                        <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <ArrowUpRight size={10} /> +15.3% MoM
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Net Profit (Est.)</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.estProfit)}</p>
                </div>

                {/* Total Bookings */}
                <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Calendar size={20} />
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <ArrowUpRight size={10} /> +8.2% MoM
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Bookings</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>

                {/* Avg Booking Value */}
                <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                            <BarChart3 size={20} />
                        </div>
                        <span className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <ArrowUpRight size={10} /> +5.1%
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Booking Value</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgBookingValue)}</p>
                </div>
            </div>

            {/* CATEGORY ANALYTICS */}
            <div className="bg-[#151515] p-6 rounded-3xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6">Most Booked Categories</h3>
                <div className="space-y-4">
                    {topCategories.map((cat, index) => (
                        <div key={index}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-300 text-sm font-medium">{cat.name}</span>
                                <span className="text-white font-mono text-xs bg-white/5 px-2 py-1 rounded">{cat.count} Bookings</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(cat.count / (topCategories[0].count || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {topCategories.length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">No data available yet.</p>
                    )}
                </div>
            </div>

            {/* RECENT ACTIVITY TABLE */}
            <div className="bg-[#151515] rounded-3xl border border-white/5 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] text-xs text-slate-500 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-5 pl-6">Customer</th>
                                <th className="p-5">Trip</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5 pr-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-5 pl-6">
                                        <div className="font-bold text-slate-200">{booking.contactName}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{new Date(booking.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-5 text-slate-400 text-sm">{booking.packageTitle}</td>
                                    <td className="p-5 font-mono text-white font-medium">{formatCurrency(booking.totalPrice)}</td>
                                    <td className="p-5 pr-6 text-right">
                                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentBookings.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500 text-sm">
                                        No recent activity to show.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Overview;
