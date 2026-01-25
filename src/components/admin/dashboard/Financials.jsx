import React, { useEffect, useState } from 'react';
import { TrendingUp, Download, PieChart, DollarSign, Calendar, ArrowUpRight, FileText } from 'lucide-react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const Financials = () => {
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        netProfit: 0,
        pendingPayments: 0,
        gstCollected: 0
    });

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const q = query(collection(db, 'bookings'));
                const snapshot = await getDocs(q);
                const bookings = snapshot.docs.map(doc => doc.data());

                let revenue = 0;
                let pending = 0;
                const monthlyStats = {};

                bookings.forEach(b => {
                    const amount = parseFloat(b.totalPrice) || 0;
                    const paid = parseFloat(b.amountPaid) || 0;

                    if (b.status === 'confirmed') {
                        revenue += amount;
                        // GST Calculation (Assuming 5% included)
                        // Group by Month
                        const date = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date();
                        const monthKey = date.toLocaleString('default', { month: 'short' });

                        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { name: monthKey, revenue: 0, profit: 0 };
                        monthlyStats[monthKey].revenue += amount;
                        monthlyStats[monthKey].profit += (amount * 0.20); // 20% Margin Assumption
                    }

                    if (b.status === 'pending' || (b.status === 'confirmed' && paid < amount)) {
                        pending += (amount - paid);
                    }
                });

                // Convert to array and sort (mock sort order for now: Jan, Feb...)
                const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const charData = Object.values(monthlyStats).sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));

                setMonthlyData(charData);
                setMetrics({
                    totalRevenue: revenue,
                    netProfit: revenue * 0.20, // 20% Margin
                    pendingPayments: pending,
                    gstCollected: revenue * 0.05 // 5% GST
                });
            } catch (err) {
                console.error("Error calculating financials:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancials();
    }, []);

    const formatCurrency = (val) => `₹${val.toLocaleString()}`;

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Calculating Financials...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-green-400" /> Financial Intelligence
                    </h3>
                    <p className="text-slate-400 text-sm">Real-time P&L, GST Reports & Revenue Analysis</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
                        <FileText size={16} /> GST Report
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} className="text-green-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.totalRevenue)}</p>
                    <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                        <ArrowUpRight size={12} /> +12% this month
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart size={64} className="text-purple-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Profit (Est)</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.netProfit)}</p>
                    <p className="text-purple-400 text-xs mt-2">
                        ~20% Margin
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={64} className="text-orange-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Collect</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.pendingPayments)}</p>
                    <p className="text-orange-400 text-xs mt-2">
                        Due from bookings
                    </p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={64} className="text-blue-500" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">GST Liability</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.gstCollected)}</p>
                    <p className="text-blue-400 text-xs mt-2">
                        @ 5% on Revenue
                    </p>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-6">Revenue Growth</h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Profit vs Revenue Bar */}
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-6">P&L Analysis</h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Financials;
