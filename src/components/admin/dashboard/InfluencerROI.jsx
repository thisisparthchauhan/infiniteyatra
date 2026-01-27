import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, DollarSign, Award, Filter, Search,
    ArrowUpRight, ArrowDownRight, MoreHorizontal, Eye, Link,
    Instagram, Youtube, ChevronRight, BarChart2, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const InfluencerROI = () => {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Data (Replace with Firebase in next step)
    const [influencers, setInfluencers] = useState([
        {
            id: '1',
            name: 'Priya Sharma',
            platform: 'Instagram',
            followers: '450K',
            tripsGiven: 2,
            totalCost: 25000,
            inquiries: 156,
            bookings: 12,
            revenue: 180000,
            status: 'Top Performer',
            lastActive: '2 days ago',
            promoCode: 'PRIYA20',
            engagement: '4.5%'
        },
        {
            id: '2',
            name: 'Rahul Vlogs',
            platform: 'YouTube',
            followers: '1.2M',
            tripsGiven: 1,
            totalCost: 45000,
            inquiries: 890,
            bookings: 85,
            revenue: 1250000,
            status: 'Top Performer',
            lastActive: '1 week ago',
            promoCode: 'RAHULYATRA',
            engagement: '8.2%'
        },
        {
            id: '3',
            name: 'Simran Travels',
            platform: 'Blog',
            followers: '90K',
            tripsGiven: 1,
            totalCost: 12000,
            inquiries: 45,
            bookings: 3,
            revenue: 36000,
            status: 'Average',
            lastActive: '3 weeks ago',
            promoCode: 'SIMRAN10',
            engagement: '1.2%'
        }
    ]);

    useEffect(() => {
        // Simulate API Load
        setTimeout(() => setLoading(false), 1000);
    }, []);

    // Derived Metrics
    const totalCost = influencers.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalRevenue = influencers.reduce((acc, curr) => acc + curr.revenue, 0);
    const netProfit = totalRevenue - totalCost;
    const totalROI = ((netProfit / totalCost) * 100).toFixed(1);

    const formatCurrency = (val) => `₹${val.toLocaleString()}`;

    // Filter Logic
    const filteredInfluencers = influencers.filter(inf =>
        inf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading Analytics...</div>;

    // DETAIL VIEW
    if (view === 'detail' && selectedInfluencer) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <button
                    onClick={() => { setView('list'); setSelectedInfluencer(null); }}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronRight className="rotate-180" size={16} /> Back to Overview
                </button>

                {/* Profile Header */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white uppercase">
                            {selectedInfluencer.name[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedInfluencer.name}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                <span className="flex items-center gap-1">
                                    {selectedInfluencer.platform === 'Instagram' ? <Instagram size={14} /> : <Youtube size={14} />}
                                    {selectedInfluencer.platform}
                                </span>
                                <span>• {selectedInfluencer.followers} Followers</span>
                                <span>• {selectedInfluencer.engagement} Engagement</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                                    Code: {selectedInfluencer.promoCode}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedInfluencer.status === 'Top Performer' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {selectedInfluencer.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        <div className="text-right">
                            <p className="text-slate-500 text-xs font-bold uppercase">Total Cost</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(selectedInfluencer.totalCost)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 text-xs font-bold uppercase">Revenue</p>
                            <p className="text-xl font-bold text-green-400">{formatCurrency(selectedInfluencer.revenue)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 text-xs font-bold uppercase">ROI</p>
                            <p className={`text-xl font-bold ${((selectedInfluencer.revenue - selectedInfluencer.totalCost) > 0) ? 'text-green-400' : 'text-red-400'}`}>
                                {(((selectedInfluencer.revenue - selectedInfluencer.totalCost) / selectedInfluencer.totalCost) * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Funnel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-6">Attribution Funnel</h3>
                        <div className="space-y-6">
                            <div className="relative">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Total Views (Est.)</span>
                                    <span className="text-white font-bold">150,000</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-full opacity-30"></div>
                                </div>
                            </div>
                            <div className="relative pl-4 border-l border-white/10">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Link Clicks / Inquiries</span>
                                    <span className="text-white font-bold">{selectedInfluencer.inquiries}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[45%]"></div>
                                </div>
                                <span className="text-xs text-blue-400 mt-1 block">{(selectedInfluencer.inquiries / 150000 * 100).toFixed(2)}% CTR</span>
                            </div>
                            <div className="relative pl-4 border-l border-white/10">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Final Bookings</span>
                                    <span className="text-white font-bold">{selectedInfluencer.bookings}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[15%]"></div>
                                </div>
                                <span className="text-xs text-green-400 mt-1 block">{(selectedInfluencer.bookings / selectedInfluencer.inquiries * 100).toFixed(1)}% Conversion</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-6">Revenue Impact</h3>
                        <div className="h-64 flex items-center justify-center text-slate-500">
                            {/* Placeholder for Revenue Chart */}
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Cost', value: selectedInfluencer.totalCost },
                                    { name: 'Revenue', value: selectedInfluencer.revenue },
                                    { name: 'Profit', value: selectedInfluencer.revenue - selectedInfluencer.totalCost }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-purple-400" /> Influencer Performance
                    </h3>
                    <p className="text-slate-400 text-sm">Track ROI, conversions, and campaign success.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Find influencer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 w-64"
                        />
                    </div>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2">
                        <Users size={16} /> Add Influencer
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 group hover:border-purple-500/30 transition-colors">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Spend</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalCost)}</p>
                    <p className="text-slate-400 text-xs mt-2">On free trips & fees</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 group hover:border-green-500/30 transition-colors">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</p>
                    <p className="text-green-400 text-xs mt-2 font-bold flex items-center gap-1">
                        <TrendingUp size={12} /> +12% vs last month
                    </p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 group hover:border-blue-500/30 transition-colors">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Profit</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(netProfit)}</p>
                    <p className="text-slate-400 text-xs mt-2">Revenue - Cost</p>
                </div>
                <div className="glass-card p-6 rounded-2xl border border-white/10 group hover:border-pink-500/30 transition-colors">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Overall ROI</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{totalROI}%</p>
                    <p className="text-slate-400 text-xs mt-2">Return on Investment</p>
                </div>
            </div>

            {/* TABLE */}
            {/* TABLE - Desktop Only */}
            <div className="hidden md:block glass-card rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Influencer</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Trips</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right">Cost</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right">Revenue</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-center">ROI</th>
                            <th className="p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredInfluencers.map((inf) => {
                            const roi = ((inf.revenue - inf.totalCost) / inf.totalCost * 100).toFixed(0);
                            return (
                                <tr key={inf.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => { setSelectedInfluencer(inf); setView('detail'); }}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                                                {inf.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">{inf.name}</p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    {inf.platform} • {inf.followers}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">{inf.tripsGiven}</td>
                                    <td className="p-4 text-slate-300 text-sm text-right">{formatCurrency(inf.totalCost)}</td>
                                    <td className="p-4 text-green-400 font-bold text-sm text-right">{formatCurrency(inf.revenue)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${roi > 200 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            roi > 100 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {roi}%
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* CARDS - Mobile Only */}
            <div className="md:hidden space-y-4">
                {filteredInfluencers.map((inf) => {
                    const roi = ((inf.revenue - inf.totalCost) / inf.totalCost * 100).toFixed(0);
                    return (
                        <div
                            key={inf.id}
                            onClick={() => { setSelectedInfluencer(inf); setView('detail'); }}
                            className="glass-card p-4 rounded-xl border border-white/10 space-y-4 active:scale-95 transition-transform"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold uppercase">
                                        {inf.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{inf.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            {inf.platform === 'Instagram' ? <Instagram size={10} /> : <Youtube size={10} />}
                                            {inf.followers}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${roi > 200 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        roi > 100 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    ROI: {roi}%
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Cost</p>
                                    <p className="text-lg font-mono text-white">{formatCurrency(inf.totalCost)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Revenue</p>
                                    <p className="text-lg font-bold text-green-400">{formatCurrency(inf.revenue)}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-slate-500">Code: <span className="text-blue-400">{inf.promoCode}</span></span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    Tap for details <ChevronRight size={12} />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InfluencerROI;
