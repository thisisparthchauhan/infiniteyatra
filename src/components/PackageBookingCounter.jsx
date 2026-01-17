import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Flame } from 'lucide-react';

const PackageBookingCounter = ({ packageId, packageTitle }) => {
    const [stats, setStats] = useState({
        last7Days: 0,
        last24Hours: 0,
        totalBookings: 0,
        spotsLeft: 0
    });

    useEffect(() => {
        // In production, fetch from Firebase
        // For now, using sample data based on package
        const sampleStats = {
            'kedarkantha': { last7Days: 23, last24Hours: 5, totalBookings: 127, spotsLeft: 3 },
            'tungnath': { last7Days: 18, last24Hours: 3, totalBookings: 89, spotsLeft: 5 },
            'chardham-2026': { last7Days: 31, last24Hours: 7, totalBookings: 156, spotsLeft: 2 },
            'soul-of-himalayas': { last7Days: 15, last24Hours: 2, totalBookings: 67, spotsLeft: 4 }
        };

        setStats(sampleStats[packageId] || { last7Days: 20, last24Hours: 4, totalBookings: 100, spotsLeft: 5 });
    }, [packageId]);

    const isLowAvailability = stats.spotsLeft <= 3;

    return (
        <div className="space-y-4">
            {/* Main Counter Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg"
            >
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-orange-500 rounded-lg">
                        <Flame size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-orange-900 text-lg mb-1">
                            🔥 Trending Now!
                        </h3>
                        <p className="text-orange-700 text-sm">
                            High demand for this trek
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* 7 Days Bookings */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Last 7 days</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    {stats.last7Days} bookings
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                <TrendingUp size={12} />
                                +45%
                            </div>
                        </div>
                    </div>

                    {/* 24 Hours Bookings */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Last 24 hours</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    {stats.last24Hours} bookings
                                </p>
                            </div>
                        </div>
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </div>
                    </div>

                    {/* Total Bookings */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Total travelers</p>
                                <p className="font-bold text-slate-900 text-lg">
                                    {stats.totalBookings}+ happy customers
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Spots Left Alert */}
            {isLowAvailability && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping bg-white rounded-full opacity-75"></div>
                            <div className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <span className="text-red-600 font-bold text-lg">!</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg mb-1">
                                ⚡ Limited slots per batch!
                            </p>
                            <p className="text-sm text-white/90">
                                High demand season - Book early
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Social Proof Message */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-blue-50 rounded-xl p-4 border border-blue-200"
            >
                <p className="text-sm text-blue-900 text-center">
                    <span className="font-semibold">Join {stats.totalBookings}+ travelers</span> who have already experienced this amazing trek!
                </p>
            </motion.div>
        </div>
    );
};

export default PackageBookingCounter;
