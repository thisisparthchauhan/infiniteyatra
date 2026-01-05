import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Clock, TrendingDown, Sparkles } from 'lucide-react';

const SmartPricing = ({ packageData }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // Calculate discount percentage
    const originalPrice = packageData.price * 1.33; // 33% markup for discount display
    const discountPercentage = Math.round(((originalPrice - packageData.price) / originalPrice) * 100);
    const savings = originalPrice - packageData.price;

    // Countdown timer (example: 7 days from now)
    useEffect(() => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7); // 7 days from now

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-4">
            {/* Early Bird Badge */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
            >
                <Sparkles size={16} className="animate-pulse" />
                Early Bird Special
            </motion.div>

            {/* Pricing Display */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm opacity-90 mb-1">Original Price</p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl line-through opacity-75">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                            <div className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                {discountPercentage}% OFF
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/20 pt-4 mb-4">
                    <p className="text-sm opacity-90 mb-2">Your Price</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">{packageData.priceDisplay}</span>
                        <span className="text-lg opacity-90">per person</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-green-300">
                        <TrendingDown size={18} />
                        <span className="font-semibold">
                            You save ₹{savings.toLocaleString('en-IN')}!
                        </span>
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={18} className="text-yellow-300" />
                        <span className="text-sm font-semibold">Offer ends in:</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'Days', value: timeLeft.days },
                            { label: 'Hours', value: timeLeft.hours },
                            { label: 'Mins', value: timeLeft.minutes },
                            { label: 'Secs', value: timeLeft.seconds }
                        ].map((item, index) => (
                            <div key={index} className="bg-white/20 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold tabular-nums">
                                    {String(item.value).padStart(2, '0')}
                                </div>
                                <div className="text-xs opacity-75 mt-1">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Offers */}
            <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Tag size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold text-green-900">Group Discount Available</p>
                        <p className="text-green-700">Book for 4+ people and get additional 10% off</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Tag size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900">Referral Bonus</p>
                        <p className="text-blue-700">Refer a friend and both get ₹1,000 off</p>
                    </div>
                </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Best Price Guarantee</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Free Cancellation</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure Payment</span>
                </div>
            </div>
        </div>
    );
};

export default SmartPricing;
