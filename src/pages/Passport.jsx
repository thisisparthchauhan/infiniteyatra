import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Copy, Check, ExternalLink, Lock, Plane, Hotel, Car, Star, Users, 
    Gift, Clock, ArrowRight, Sparkles, Calendar, CreditCard, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPassport, initPassport, applyReferralCode } from '../services/passportService';
import SEO from '../components/SEO';

// ── Animated credit counter ──
const CreditCounter = ({ target }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        if (target === 0) { setCount(0); return; }
        const duration = 1500;
        const steps = 60;
        const stepTime = duration / steps;
        let current = 0;
        const inc = target / steps;
        const timer = setInterval(() => {
            current += inc;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.round(current));
        }, stepTime);
        return () => clearInterval(timer);
    }, [target]);
    return <span ref={ref}>{count.toLocaleString()}</span>;
};

// ── Stamp data ──
const STAMPS = [
    { id: 'trip', label: 'Trip Traveller', emoji: '✈️', icon: Plane, color: 'from-blue-500 to-cyan-500', historyType: 'booking', matchDesc: 'trip' },
    { id: 'hotel', label: 'Hotel Guest', emoji: '🏨', icon: Hotel, color: 'from-amber-500 to-orange-500', historyType: 'booking', matchDesc: 'hotel' },
    { id: 'transport', label: 'Road Rider', emoji: '🚗', icon: Car, color: 'from-green-500 to-emerald-500', historyType: 'booking', matchDesc: 'transport' },
    { id: 'review', label: 'Storyteller', emoji: '⭐', icon: Star, color: 'from-yellow-400 to-amber-500', historyType: 'review', matchDesc: null },
    { id: 'referral', label: 'Ambassador', emoji: '👥', icon: Users, color: 'from-purple-500 to-pink-500', historyType: 'referral', matchDesc: null },
];

const EARN_TYPES = [
    { emoji: '✈️', label: 'Trips', credits: '+100' },
    { emoji: '🏨', label: 'Hotels', credits: '+75' },
    { emoji: '🚗', label: 'Transport', credits: '+50' },
    { emoji: '⭐', label: 'Reviews', credits: '+25' },
    { emoji: '👥', label: 'Referrals', credits: '+150' },
];

const Passport = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [passport, setPassport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [referralInput, setReferralInput] = useState('');
    const [applyingCode, setApplyingCode] = useState(false);
    const [initializingPassport, setInitializingPassport] = useState(false);

    // ── Load passport data ──
    useEffect(() => {
        if (!currentUser?.uid) return;
        loadPassport();
    }, [currentUser]);

    const loadPassport = async () => {
        setLoading(true);
        try {
            let data = await getPassport(currentUser.uid);
            if (!data || !data.joinedAt) {
                setShowOnboarding(true);
            } else {
                setPassport(data);
                setShowOnboarding(false);
            }
        } catch (err) {
            console.error('Error loading passport:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInitPassport = async (skipReferral = true) => {
        setInitializingPassport(true);
        try {
            await initPassport(currentUser.uid, currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
            if (!skipReferral && referralInput.trim()) {
                try {
                    await applyReferralCode(currentUser.uid, referralInput);
                    addToast('🎉 Referral code applied! +50 welcome credits!', 'success');
                } catch (refErr) {
                    addToast(refErr.message || 'Referral code not found', 'error');
                }
            }
            await loadPassport();
        } catch (err) {
            console.error('Error initializing passport:', err);
            addToast('Failed to initialize passport', 'error');
        } finally {
            setInitializingPassport(false);
        }
    };

    const handleApplyCode = async () => {
        if (!referralInput.trim()) {
            addToast('Please enter a referral code', 'error');
            return;
        }
        setApplyingCode(true);
        try {
            await handleInitPassport(false);
        } finally {
            setApplyingCode(false);
        }
    };

    const handleCopyCode = () => {
        if (!passport?.referralCode) return;
        navigator.clipboard.writeText(passport.referralCode);
        setCopied(true);
        addToast('Referral code copied!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const code = passport?.referralCode || '';
        const msg = `Join Infinite Yatra with my code ${code} and get 50 bonus credits! infiniteyatra.com`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const getHistoryIcon = (type) => {
        switch (type) {
            case 'booking': return <CreditCard size={16} className="text-blue-400" />;
            case 'review': return <Star size={16} className="text-yellow-400" />;
            case 'referral': return <Gift size={16} className="text-purple-400" />;
            case 'manual': return <Award size={16} className="text-green-400" />;
            default: return <Sparkles size={16} className="text-slate-400" />;
        }
    };

    const isStampEarned = (stamp) => {
        if (!passport?.history) return false;
        return passport.history.some(h => {
            if (h.type !== stamp.historyType) return false;
            if (stamp.matchDesc) return h.description?.toLowerCase().includes(stamp.matchDesc);
            return true;
        });
    };

    const referralStats = () => {
        if (!passport?.history) return { count: 0, credits: 0 };
        const refEntries = passport.history.filter(h => h.type === 'referral' && h.credits === 150);
        return { count: refEntries.length, credits: refEntries.length * 150 };
    };

    // ── Loading ──
    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
    );

    // ── Onboarding ──
    if (showOnboarding) return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
            <SEO title="IY Passport — Join" description="Activate your IY Passport and start earning credits" url="/passport" />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="relative bg-[#111118] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
                    {/* Glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-[80px]"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/20 rounded-full blur-[80px]"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
                                <Sparkles size={36} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2">IY Passport</h1>
                            <p className="text-slate-400 text-sm">Earn credits on every booking, review & referral</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-400 mb-2">Do you have a referral code?</label>
                            <input
                                type="text"
                                placeholder="e.g. IY-PARTH23"
                                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white uppercase tracking-wider font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                value={referralInput}
                                onChange={e => setReferralInput(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleApplyCode}
                            disabled={applyingCode || initializingPassport || !referralInput.trim()}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
                        >
                            {applyingCode ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Apply Code & Join <ArrowRight size={18} /></>}
                        </button>

                        <button
                            onClick={() => handleInitPassport(true)}
                            disabled={initializingPassport}
                            className="w-full py-3 text-slate-400 hover:text-white font-medium rounded-xl hover:bg-white/5 transition-all text-sm"
                        >
                            {initializingPassport ? 'Setting up...' : 'Skip — I don\'t have a code'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );

    const stats = referralStats();
    const sortedHistory = [...(passport?.history || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-20 px-4 md:px-8">
            <SEO title="IY Passport" description="Your loyalty passport — earn credits on bookings, reviews & referrals" url="/passport" />
            
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[40%] bg-purple-900/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-8">

                {/* ═══════ HERO CARD ═══════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl overflow-hidden"
                >
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 animate-gradient-x rounded-3xl p-[2px]">
                        <div className="absolute inset-[2px] bg-[#111118] rounded-[22px]"></div>
                    </div>

                    <div className="relative z-10 p-6 md:p-10">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            {/* Left */}
                            <div className="flex-1">
                                <p className="text-xs font-black uppercase tracking-[0.3em] bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
                                    IY Passport
                                </p>
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                                    {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Traveller'}
                                </h1>
                                <div className="space-y-1 text-sm">
                                    <p className="text-slate-400 font-mono">
                                        <span className="text-slate-600">Passport:</span> {passport?.referralCode || '—'}
                                    </p>
                                    <p className="text-slate-500 flex items-center gap-1.5">
                                        <Calendar size={12} />
                                        Member since {passport?.joinedAt ? new Date(passport.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Right — credit counter */}
                            <div className="text-center md:text-right">
                                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent leading-none">
                                    <CreditCounter target={passport?.totalCredits || 0} />
                                </div>
                                <p className="text-slate-400 text-sm font-medium mt-1">Total Credits Earned</p>
                                <p className="text-slate-600 text-xs mt-0.5">Redemption coming soon — keep earning!</p>
                            </div>
                        </div>

                        {/* Bottom strip — earn types */}
                        <div className="mt-8 pt-5 border-t border-white/5 flex flex-wrap gap-4 md:gap-6 justify-center md:justify-start">
                            {EARN_TYPES.map(et => (
                                <div key={et.label} className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="text-base">{et.emoji}</span>
                                    <span>{et.label}</span>
                                    <span className="text-green-400 font-bold">{et.credits}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ═══════ STAMP WALL ═══════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#111118] border border-white/10 rounded-3xl p-6 md:p-8"
                >
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Award size={20} className="text-purple-400" /> Passport Stamps
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 md:gap-6">
                        {STAMPS.map(stamp => {
                            const earned = isStampEarned(stamp);
                            const Icon = stamp.icon;
                            return (
                                <div key={stamp.id} className="group relative flex flex-col items-center gap-2">
                                    <div className={`
                                        relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center
                                        transition-all duration-300
                                        ${earned
                                            ? `bg-gradient-to-br ${stamp.color} shadow-lg shadow-current/20`
                                            : 'bg-slate-800/50 border border-slate-700/50'
                                        }
                                    `}>
                                        {earned ? (
                                            <span className="text-3xl md:text-4xl">{stamp.emoji}</span>
                                        ) : (
                                            <>
                                                <Icon size={28} className="text-slate-600" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                                    <Lock size={14} className="text-slate-500" />
                                                </div>
                                            </>
                                        )}
                                        {earned && (
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-br ${stamp.color} opacity-20 blur-md animate-pulse"></div>
                                        )}
                                    </div>
                                    <p className={`text-xs font-bold text-center ${earned ? 'text-white' : 'text-slate-600'}`}>
                                        {stamp.label}
                                    </p>

                                    {/* Tooltip */}
                                    {!earned && (
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-[#1a1a24] border border-white/10 rounded-lg p-2 text-[10px] text-slate-400 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                            {stamp.historyType === 'booking' && stamp.matchDesc ? `Complete a ${stamp.matchDesc} booking to unlock` :
                                             stamp.historyType === 'review' ? 'Write a review to unlock' :
                                             'Refer a friend to unlock'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ═══════ CREDITS HISTORY TIMELINE ═══════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#111118] border border-white/10 rounded-3xl p-6 md:p-8"
                >
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-blue-400" /> Credits History
                    </h2>

                    {sortedHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
                                <Sparkles size={28} className="text-slate-600" />
                            </div>
                            <p className="text-slate-400 font-medium">Your credit journey starts with your first booking!</p>
                            <p className="text-slate-600 text-sm mt-1">Book a trip, hotel, or transport to earn credits.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute top-0 bottom-0 left-5 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/30 to-transparent"></div>

                            <div className="space-y-0">
                                {sortedHistory.map((entry, i) => (
                                    <motion.div
                                        key={entry.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="relative pl-12 py-4 group"
                                    >
                                        {/* Dot */}
                                        <div className="absolute left-[14px] top-5 w-3 h-3 rounded-full bg-[#111118] border-2 border-purple-500/50 group-hover:border-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all"></div>

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center">
                                                    {getHistoryIcon(entry.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{entry.description}</p>
                                                    <p className="text-slate-600 text-xs mt-0.5">
                                                        {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-green-400 font-bold text-sm whitespace-nowrap shrink-0">
                                                +{entry.credits}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ═══════ REFERRAL SECTION ═══════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative bg-[#111118] border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden"
                >
                    {/* Subtle glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px]"></div>

                    <div className="relative z-10">
                        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Gift size={20} className="text-purple-400" /> Invite friends, earn together
                        </h2>
                        <p className="text-slate-400 text-sm mb-6">Share your code. When a friend joins, you both earn credits!</p>

                        {/* Code box */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 bg-[#1a1a24] border border-white/10 rounded-xl px-5 py-3.5 font-mono text-lg text-white tracking-[0.2em] font-bold text-center select-all">
                                {passport?.referralCode || '—'}
                            </div>
                            <button
                                onClick={handleCopyCode}
                                className={`px-5 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0 ${
                                    copied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                                }`}
                            >
                                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
                            </button>
                        </div>

                        {/* WhatsApp share */}
                        <button
                            onClick={handleShareWhatsApp}
                            className="w-full py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-6"
                        >
                            <ExternalLink size={16} /> Share via WhatsApp
                        </button>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Users size={16} className="text-purple-400" />
                                <span><b className="text-white">{stats.count}</b> friends invited</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Sparkles size={16} className="text-green-400" />
                                <span><b className="text-white">{stats.credits}</b> credits from referrals</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Gradient animation CSS */}
            <style>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 4s ease infinite;
                }
            `}</style>
        </div>
    );
};

export default Passport;
