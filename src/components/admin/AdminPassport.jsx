import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Search, Award, Users, TrendingUp, Gift, IndianRupee, 
    Loader, ChevronUp, ChevronDown, Mail
} from 'lucide-react';
import { getAllPassportUsers, adminAdjustCredits, findUserByEmail } from '../../services/passportService';

const AdminPassport = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Manual adjustment
    const [searchEmail, setSearchEmail] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjusting, setAdjusting] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllPassportUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load passport users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Aggregate stats
    const stats = useMemo(() => {
        let totalCredits = 0;
        let totalReferrals = 0;
        users.forEach(u => {
            totalCredits += u.passport?.totalCredits || 0;
            const referralEntries = (u.passport?.history || []).filter(h => h.type === 'referral' && h.credits === 150);
            totalReferrals += referralEntries.length;
        });
        return { totalCredits, totalReferrals, totalMembers: users.length };
    }, [users]);

    // Top 10 leaderboard
    const leaderboard = useMemo(() => {
        return users.slice(0, 10).map((u, i) => {
            const history = u.passport?.history || [];
            const bookings = history.filter(h => h.type === 'booking').length;
            const referrals = history.filter(h => h.type === 'referral' && h.credits === 150).length;
            return { ...u, rank: i + 1, bookings, referrals };
        });
    }, [users]);

    const handleSearch = async () => {
        if (!searchEmail.trim()) return;
        setSearching(true);
        setSearchError('');
        setFoundUser(null);
        try {
            const u = await findUserByEmail(searchEmail);
            if (u) setFoundUser(u);
            else setSearchError('No user found with that email');
        } catch (err) {
            setSearchError('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleAdjust = async () => {
        if (!foundUser || !adjustAmount) return;
        const credits = parseInt(adjustAmount);
        if (isNaN(credits) || credits === 0) return;
        setAdjusting(true);
        try {
            await adminAdjustCredits(foundUser.id, credits, 'admin');
            setAdjustAmount('');
            setFoundUser(null);
            setSearchEmail('');
            await loadUsers();
        } catch (err) {
            console.error('Adjust failed:', err);
        } finally {
            setAdjusting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <Loader className="animate-spin text-purple-500" size={32} />
        </div>
    );

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Award className="text-purple-500" /> IY Passport Overview
                </h2>
                <p className="text-slate-400 text-sm">Loyalty program analytics & manual credit management</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Credits Issued', value: stats.totalCredits.toLocaleString(), icon: TrendingUp, color: 'text-purple-400', border: 'border-l-purple-500' },
                    { label: 'Total Referrals', value: stats.totalReferrals, icon: Gift, color: 'text-green-400', border: 'border-l-green-500' },
                    { label: 'Passport Members', value: stats.totalMembers, icon: Users, color: 'text-blue-400', border: 'border-l-blue-500' },
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

            {/* Leaderboard */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        🏆 Top 10 Leaderboard
                    </h3>
                </div>
                {leaderboard.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">No passport members yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-[#1a1a1a] text-slate-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-3">Rank</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3 text-center">Credits</th>
                                    <th className="px-6 py-3 text-center">Bookings</th>
                                    <th className="px-6 py-3 text-center">Referrals</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {leaderboard.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`w-8 h-8 inline-flex items-center justify-center rounded-full font-black text-sm ${
                                                u.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                                                u.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                                                u.rank === 3 ? 'bg-orange-600/20 text-orange-400' :
                                                'bg-slate-800 text-slate-500'
                                            }`}>
                                                {u.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{u.name || u.passport?.name || '—'}</td>
                                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">{u.email || '—'}</td>
                                        <td className="px-6 py-4 text-center font-bold text-purple-400">{(u.passport?.totalCredits || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center text-slate-300">{u.bookings}</td>
                                        <td className="px-6 py-4 text-center text-green-400">{u.referrals}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manual Credit Adjustment */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <IndianRupee size={18} className="text-orange-400" /> Manual Credit Adjustment
                </h3>

                <div className="flex flex-wrap gap-3 items-end mb-4">
                    <div className="flex-1 min-w-[250px]">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Search by Email</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                    value={searchEmail}
                                    onChange={e => setSearchEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searching}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors border border-slate-700 flex items-center gap-1.5 shrink-0"
                            >
                                {searching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {searchError && <p className="text-red-400 text-sm mb-4">{searchError}</p>}

                {foundUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-white">{foundUser.name || '—'}</p>
                                <p className="text-slate-500 text-xs">{foundUser.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold">Current Credits</p>
                                <p className="text-xl font-black text-purple-400">{(foundUser.passport?.totalCredits || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                placeholder="Credits (e.g. 50 or -25)"
                                className="flex-1 bg-[#0a0a0a] border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                                value={adjustAmount}
                                onChange={e => setAdjustAmount(e.target.value)}
                            />
                            <button
                                onClick={handleAdjust}
                                disabled={adjusting || !adjustAmount}
                                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                {adjusting ? <Loader size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                                Add Credits
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminPassport;
