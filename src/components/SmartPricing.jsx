import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, Clock, TrendingDown, Sparkles } from 'lucide-react';

const SmartPricing = ({ packageData }) => {
    return (
        <div className="space-y-4">
            {/* Pricing Display */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl text-white shadow-xl">
                <div className="pt-2 mb-4">
                    <p className="text-sm opacity-90 mb-2">Price</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">{packageData.priceDisplay}</span>
                        <span className="text-lg opacity-90">per person</span>
                    </div>
                </div>
            </div>

            {/* Trust Indicators - Removed Free Cancellation */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Best Price Guarantee</span>
                </div>
                <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure Payment</span>
                </div>
            </div>
        </div>
    );
};

export default SmartPricing;
