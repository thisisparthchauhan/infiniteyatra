import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Users, TrendingUp, Award, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ReferralDashboard = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [referralCode, setReferralCode] = useState('');
    const [referralStats, setReferralStats] = useState({
        totalReferrals: 0,
        successfulBookings: 0,
        totalSavings: 0,
        pendingReferrals: 0
    });
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadReferralData();
        }
    }, [currentUser]);

    const generateReferralCode = (email, uid) => {
        // Generate code from email or name
        const emailPrefix = email.split('@')[0].toUpperCase().replace(/[^A-Z]/g, '');
        const shortUid = uid.substring(0, 4).toUpperCase();
        return `${emailPrefix}${shortUid}`;
    };

    const loadReferralData = async () => {
        try {
            setLoading(true);

            // Get or create referral code
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);

            let code = '';
            if (userDoc.exists() && userDoc.data().referralCode) {
                code = userDoc.data().referralCode;
            } else {
                // Generate new code
                code = generateReferralCode(currentUser.email, currentUser.uid);
                await setDoc(userRef, {
                    referralCode: code,
                    email: currentUser.email,
                    createdAt: new Date()
                }, { merge: true });
            }
            setReferralCode(code);

            // Get referral stats
            const referralsRef = collection(db, 'referrals');
            const q = query(referralsRef, where('referrerId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            let stats = {
                totalReferrals: 0,
                successfulBookings: 0,
                totalSavings: 0,
                pendingReferrals: 0
            };

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                stats.totalReferrals++;
                if (data.bookingCompleted) {
                    stats.successfulBookings++;
                    stats.totalSavings += 1000; // ₹1,000 per successful referral
                } else {
                    stats.pendingReferrals++;
                }
            });

            setReferralStats(stats);
        } catch (error) {
            console.error('Error loading referral data:', error);
            addToast('Error loading referral data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        addToast('Referral code copied!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareViaWhatsApp = () => {
        const message = `Hey! 🎉 I'm using Infinite Yatra for amazing Himalayan treks. Use my referral code "${referralCode}" and we both get ₹1,000 OFF! 🏔️\n\nCheck it out: ${window.location.origin}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = 'Get ₹1,000 OFF on Infinite Yatra!';
        const body = `Hey!\n\nI'm using Infinite Yatra for amazing Himalayan treks and thought you'd love it too!\n\nUse my referral code "${referralCode}" when booking and we'll both get ₹1,000 OFF! 🎉\n\nCheck out their treks: ${window.location.origin}\n\nHappy travels! 🏔️`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const copyReferralLink = () => {
        const link = `${window.location.origin}?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        addToast('Referral link copied!', 'success');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Gift size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold">Refer & Earn</h2>
                        <p className="text-white/90">Share the adventure, earn rewards!</p>
                    </div>
                </div>

                {/* Referral Code */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <p className="text-sm text-white/80 mb-2">Your Referral Code</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/20 rounded-lg px-4 py-3 font-mono text-2xl font-bold tracking-wider">
                            {referralCode}
                        </div>
                        <button
                            onClick={copyReferralCode}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        >
                            {copied ? <Check size={24} /> : <Copy size={24} />}
                        </button>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <button
                        onClick={shareViaWhatsApp}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <MessageCircle size={20} />
                        WhatsApp
                    </button>
                    <button
                        onClick={shareViaEmail}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Mail size={20} />
                        Email
                    </button>
                    <button
                        onClick={copyReferralLink}
                        className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Share2 size={20} />
                        Copy Link
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total Referrals</p>
                            <p className="text-3xl font-bold text-slate-900">{referralStats.totalReferrals}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Friends you've invited</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Successful Bookings</p>
                            <p className="text-3xl font-bold text-slate-900">{referralStats.successfulBookings}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Referrals who booked</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Gift size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total Savings</p>
                            <p className="text-3xl font-bold text-slate-900">₹{referralStats.totalSavings.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Money you've earned</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-slate-200"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Award size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Pending</p>
                            <p className="text-3xl font-bold text-slate-900">{referralStats.pendingReferrals}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">Awaiting booking</p>
                </motion.div>
            </div>

            {/* How it Works */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                            1
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Share Your Code</h4>
                        <p className="text-sm text-slate-600">Send your unique referral code to friends via WhatsApp, email, or social media</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                            2
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">They Book a Trek</h4>
                        <p className="text-sm text-slate-600">Your friend uses your code and gets ₹1,000 OFF on their first booking</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                            3
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">You Both Win!</h4>
                        <p className="text-sm text-slate-600">You get ₹1,000 OFF on your next booking. Unlimited referrals!</p>
                    </div>
                </div>
            </div>

            {/* Terms */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3">Terms & Conditions</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Both referrer and referee get ₹1,000 discount on their booking</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Discount is applied automatically when referral code is used</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Unlimited referrals - refer as many friends as you want!</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Referral discount cannot be combined with other promotional offers</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Minimum booking value of ₹5,000 required to use referral discount</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ReferralDashboard;
