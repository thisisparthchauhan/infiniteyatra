import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, DollarSign, Award, Filter, Search,
    ArrowUpRight, ArrowDownRight, MoreHorizontal, Eye, Link,
    Instagram, Youtube, ChevronRight, BarChart2, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';

const InfluencerROI = () => {
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'detail'
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [influencers, setInfluencers] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeTab, setActiveTab] = useState('personal'); // For the modal form

    const [newInfluencer, setNewInfluencer] = useState({
        // Personal
        firstName: '', lastName: '', email: '', dob: '', gender: 'Male', govId: '', mobile: '',
        // Social
        platform: 'Instagram', profileLink: '', followers: '',
        // Trip
        tripName: '', tripCost: 0, personCount: 1, tripDate: '',
        // Emergency
        emergencyContactName: '', emergencyContactRelation: '', emergencyContactMobile: '',
        // ROI / Other
        inquiries: 0, bookings: 0, revenue: 0, promoCode: '', notes: ''
    });

    useEffect(() => {
        // Real-time listener for influencers
        const q = query(collection(db, 'influencers'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInfluencers(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching influencers:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddInfluencer = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'influencers'), {
                ...newInfluencer,
                name: `${newInfluencer.firstName} ${newInfluencer.lastName}`, // Composite for display
                status: 'Active',
                totalCost: Number(newInfluencer.tripCost), // Using trip cost as total cost base
                lastActive: new Date().toISOString(),
                engagement: '0%' // Default
            });
            setShowAddModal(false);
            setNewInfluencer({
                firstName: '', lastName: '', email: '', dob: '', gender: 'Male', govId: '', mobile: '',
                platform: 'Instagram', profileLink: '', followers: '',
                tripName: '', tripCost: 0, personCount: 1, tripDate: '',
                emergencyContactName: '', emergencyContactRelation: '', emergencyContactMobile: '',
                inquiries: 0, bookings: 0, revenue: 0, promoCode: '', notes: ''
            });
            setActiveTab('personal');
        } catch (error) {
            console.error("Error adding influencer:", error);
        }
    };

    // Add Example Data Function
    const addExampleData = async () => {
        const examples = [
            {
                name: 'Priya Sharma', platform: 'Instagram', followers: '450K',
                tripsGiven: 2, totalCost: 25000, inquiries: 156, bookings: 12, revenue: 180000,
                status: 'Top Performer', lastActive: new Date().toISOString(), promoCode: 'PRIYA20', engagement: '4.5%'
            },
            {
                name: 'Rahul Vlogs', platform: 'YouTube', followers: '1.2M',
                tripsGiven: 1, totalCost: 45000, inquiries: 890, bookings: 85, revenue: 1250000,
                status: 'Top Performer', lastActive: new Date().toISOString(), promoCode: 'RAHULYATRA', engagement: '8.2%'
            }
        ];

        for (const ex of examples) {
            await addDoc(collection(db, 'influencers'), ex);
        }
    };

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
                            {selectedInfluencer.firstName ? selectedInfluencer.firstName[0] : (selectedInfluencer.name ? selectedInfluencer.name[0] : '?')}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedInfluencer.name}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                <a
                                    href={selectedInfluencer.profileLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                >
                                    {selectedInfluencer.platform === 'Instagram' ? <Instagram size={14} /> : <Youtube size={14} />}
                                    {selectedInfluencer.platform} <Link size={12} />
                                </a>
                                <span>• {selectedInfluencer.followers} Followers</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                                    Code: {selectedInfluencer.promoCode || 'N/A'}
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
                                {selectedInfluencer.totalCost > 0 ? (((selectedInfluencer.revenue - selectedInfluencer.totalCost) / selectedInfluencer.totalCost) * 100).toFixed(0) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detail Grids */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal & Contact Info */}
                    <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Users size={18} className="text-purple-400" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Full Name</p>
                                <p className="text-white">{selectedInfluencer.firstName} {selectedInfluencer.lastName}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Date of Birth</p>
                                <p className="text-white">{selectedInfluencer.dob || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Gender</p>
                                <p className="text-white">{selectedInfluencer.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Gov ID</p>
                                <p className="text-white font-mono bg-white/5 px-2 py-1 rounded w-fit">{selectedInfluencer.govId || 'Not Provided'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-slate-500 text-xs uppercase mb-1">Contact</p>
                                <p className="text-white">{selectedInfluencer.mobile}</p>
                                <p className="text-slate-400 text-xs">{selectedInfluencer.email}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="text-sm font-bold text-red-400 mb-3">Emergency Contact</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase mb-1">Name</p>
                                    <p className="text-white">{selectedInfluencer.emergencyContactName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase mb-1">Relation</p>
                                    <p className="text-white">{selectedInfluencer.emergencyContactRelation || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-500 text-xs uppercase mb-1">Mobile</p>
                                    <p className="text-white">{selectedInfluencer.emergencyContactMobile || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trip & Performance */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Award size={18} className="text-yellow-400" /> Trip Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="col-span-2">
                                    <p className="text-slate-500 text-xs uppercase mb-1">Trip Name</p>
                                    <p className="text-white font-bold">{selectedInfluencer.tripName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase mb-1">Date</p>
                                    <p className="text-white">{selectedInfluencer.tripDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase mb-1">Group Size</p>
                                    <p className="text-white">{selectedInfluencer.personCount} Person(s)</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase mb-1">Cost To Company</p>
                                    <p className="text-red-400 font-bold">{formatCurrency(selectedInfluencer.totalCost)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">About / Notes</h3>
                            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                                {selectedInfluencer.notes || 'No notes added.'}
                            </p>
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
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2"
                    >
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

            {/* Conditional rendering for empty state */}
            {filteredInfluencers.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl border border-white/10 text-center text-slate-400">
                    <Users className="mx-auto mb-4" size={48} />
                    <p className="text-xl font-bold mb-2">No Influencers Found</p>
                    <p className="mb-4">Try adjusting your search or add a new influencer.</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2 mx-auto"
                    >
                        <Users size={16} /> Add New Influencer
                    </button>
                </div>
            ) : (
                <>
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
                </>
            )}

            {/* Add Influencer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0A0A0A] z-10">
                            <h2 className="text-xl font-bold text-white">Add New Influencer</h2>
                            <div className="flex gap-2">
                                {['personal', 'social', 'trip', 'emergency', 'other'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`w-2 h-2 rounded-full transition-colors ${activeTab === tab ? 'bg-purple-500' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleAddInfluencer} className="flex-1 p-6 space-y-6">

                            {/* TABS NAVIGATION */}
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                                {['personal', 'social', 'trip', 'emergency', 'other'].map(tab => (
                                    <button
                                        type="button"
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {tab} Info
                                    </button>
                                ))}
                            </div>

                            {/* PERSONAL INFO */}
                            {activeTab === 'personal' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                                            <input type="text" value={newInfluencer.firstName} onChange={e => setNewInfluencer({ ...newInfluencer, firstName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                                            <input type="text" value={newInfluencer.lastName} onChange={e => setNewInfluencer({ ...newInfluencer, lastName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                            <input type="email" value={newInfluencer.email} onChange={e => setNewInfluencer({ ...newInfluencer, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</label>
                                            {/* Simplified Country Code Display */}
                                            <div className="flex">
                                                <span className="bg-white/5 border border-white/10 rounded-l-lg p-3 text-slate-400 border-r-0">+91</span>
                                                <input type="tel" value={newInfluencer.mobile} onChange={e => setNewInfluencer({ ...newInfluencer, mobile: e.target.value })} placeholder="9876543210" className="w-full bg-white/5 border border-white/10 rounded-r-lg p-3 text-white focus:border-purple-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                                            <input type="date" value={newInfluencer.dob} onChange={e => setNewInfluencer({ ...newInfluencer, dob: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                                            <select value={newInfluencer.gender} onChange={e => setNewInfluencer({ ...newInfluencer, gender: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gov ID Number (Aadhar/PAN/Passport)</label>
                                        <input type="text" value={newInfluencer.govId} onChange={e => setNewInfluencer({ ...newInfluencer, govId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="XXXX-XXXX-XXXX" />
                                    </div>
                                    <button type="button" onClick={() => setActiveTab('social')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold mt-2">Next: Social Info &rarr;</button>
                                </div>
                            )}

                            {/* SOCIAL INFO */}
                            {activeTab === 'social' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Platform</label>
                                        <select value={newInfluencer.platform} onChange={e => setNewInfluencer({ ...newInfluencer, platform: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
                                            <option value="Instagram">Instagram</option>
                                            <option value="YouTube">YouTube</option>
                                            <option value="Blog">Blog / Website</option>
                                            <option value="TikTok">TikTok</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Profile Link</label>
                                        <input type="url" value={newInfluencer.profileLink} onChange={e => setNewInfluencer({ ...newInfluencer, profileLink: e.target.value })} placeholder="https://instagram.com/username" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Followers Count</label>
                                        <input type="text" value={newInfluencer.followers} onChange={e => setNewInfluencer({ ...newInfluencer, followers: e.target.value })} placeholder="e.g. 150K" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                    </div>
                                    <button type="button" onClick={() => setActiveTab('trip')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold mt-2">Next: Trip Details &rarr;</button>
                                </div>
                            )}

                            {/* TRIP DETAILS */}
                            {activeTab === 'trip' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trip Name</label>
                                        <input type="text" value={newInfluencer.tripName} onChange={e => setNewInfluencer({ ...newInfluencer, tripName: e.target.value })} placeholder="e.g. Bali Getaway" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Trip Date</label>
                                            <input type="date" value={newInfluencer.tripDate} onChange={e => setNewInfluencer({ ...newInfluencer, tripDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">No. of Persons</label>
                                            <input type="number" min="1" value={newInfluencer.personCount} onChange={e => setNewInfluencer({ ...newInfluencer, personCount: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Trip Cost (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                            <input type="number" value={newInfluencer.tripCost} onChange={e => setNewInfluencer({ ...newInfluencer, tripCost: Number(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setActiveTab('emergency')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold mt-2">Next: Emergency Contact &rarr;</button>
                                </div>
                            )}

                            {/* EMERGENCY CONTACT */}
                            {activeTab === 'emergency' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Name</label>
                                        <input type="text" value={newInfluencer.emergencyContactName} onChange={e => setNewInfluencer({ ...newInfluencer, emergencyContactName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Relation</label>
                                            <input type="text" value={newInfluencer.emergencyContactRelation} onChange={e => setNewInfluencer({ ...newInfluencer, emergencyContactRelation: e.target.value })} placeholder="e.g. Father" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</label>
                                            <input type="tel" value={newInfluencer.emergencyContactMobile} onChange={e => setNewInfluencer({ ...newInfluencer, emergencyContactMobile: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setActiveTab('other')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold mt-2">Next: Final Details &rarr;</button>
                                </div>
                            )}

                            {/* OTHER / FINAL */}
                            {activeTab === 'other' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Promo Code</label>
                                        <input type="text" value={newInfluencer.promoCode} onChange={e => setNewInfluencer({ ...newInfluencer, promoCode: e.target.value })} placeholder="e.g. TRAV20" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / About</label>
                                        <textarea rows="4" value={newInfluencer.notes} onChange={e => setNewInfluencer({ ...newInfluencer, notes: e.target.value })} placeholder="Add extra details, expectations, or background..." className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"></textarea>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-colors">Cancel</button>
                                        <button type="submit" className="flex-1 py-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20">Save Influencer</button>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencerROI;
