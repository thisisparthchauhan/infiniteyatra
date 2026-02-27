import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ReferralWidget = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [referralCode, setReferralCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [hasReferrals, setHasReferrals] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadReferralCode();
        }
    }, [currentUser]);

    const loadReferralCode = async () => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists() && userDoc.data().referralCode) {
                setReferralCode(userDoc.data().referralCode);
                // Check if user has made referrals
                const stats = userDoc.data().referralStats;
                if (stats && stats.totalReferrals > 0) {
                    setHasReferrals(true);
                }
            }
        } catch (error) {
            console.error('Error loading referral code:', error);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        addToast('Referral code copied! Share with friends 🎉', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const goToReferralDashboard = () => {
        navigate('/dashboard?tab=referrals');
    };

    const hiddenRoutes = ['/login', '/signup', '/booking-success', '/booking'];
    const shouldShow = !hiddenRoutes.some(route => location.pathname.startsWith(route));

    if (!currentUser || !isVisible || !shouldShow) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-24 right-6 z-40 max-w-sm"
        >
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-6 text-white border-2 border-white/20">
                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Icon */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Gift size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Refer & Earn!</h3>
                        <p className="text-xs text-white/80">Get ₹1,000 OFF per referral</p>
                    </div>
                </div>

                {/* Referral Code */}
                {referralCode && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
                        <p className="text-xs text-white/70 mb-1">Your Code:</p>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-lg tracking-wider flex-1">
                                {referralCode}
                            </span>
                            <button
                                onClick={copyCode}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={goToReferralDashboard}
                    className="w-full bg-white text-purple-600 hover:bg-white/90 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                    {hasReferrals ? 'View Referral Stats' : 'Start Referring'}
                </button>

                {/* Info */}
                <p className="text-xs text-white/70 mt-3 text-center">
                    Share your code, both get ₹1,000 OFF! 🎉
                </p>
            </div>
        </motion.div>
    );
};

export default ReferralWidget;
