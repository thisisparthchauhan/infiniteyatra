import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Users, TrendingUp } from 'lucide-react';

const LiveActivityFeed = () => {
    const [currentActivity, setCurrentActivity] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Sample activities - In production, fetch from Firebase
    const activities = [
        {
            name: 'Traveler from Mumbai',
            location: 'Mumbai',
            action: 'just booked',
            package: 'Kedarkantha Trek',
            time: '2 hours ago',
            travelers: 2
        },
        {
            name: 'Traveler from Delhi',
            location: 'Delhi',
            action: 'just booked',
            package: 'Tungnath Trek',
            time: '4 hours ago',
            travelers: 1
        },
        {
            name: 'Traveler from Bangalore',
            location: 'Bangalore',
            action: 'just booked',
            package: 'Chardham Yatra 2026',
            time: '6 hours ago',
            travelers: 4
        },
        {
            name: 'Traveler from Pune',
            location: 'Pune',
            action: 'just booked',
            package: 'Soul of Himalayas',
            time: '8 hours ago',
            travelers: 2
        },
        {
            name: 'Traveler from Hyderabad',
            location: 'Hyderabad',
            action: 'just booked',
            package: 'Kedarkantha Trek',
            time: '10 hours ago',
            travelers: 3
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentActivity((prev) => (prev + 1) % activities.length);
                setIsVisible(true);
            }, 500);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [activities.length]);

    const activity = activities[currentActivity];

    return (
        <section className="py-16 bg-white/5 border-t border-b border-white/5">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-green-500/20">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Live Bookings
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            Join Thousands of Happy Travelers
                        </h2>
                        <p className="text-slate-400 text-lg">
                            See what others are booking right now
                        </p>
                        <p className="text-xs text-slate-500 mt-2 italic">
                            *Live activity is shown for demo purposes
                        </p>
                    </motion.div>

                    {/* Live Activity Card */}
                    <AnimatePresence mode="wait">
                        {isVisible && (
                            <motion.div
                                key={currentActivity}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ duration: 0.5 }}
                                className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 md:p-8 shadow-lg border border-white/10 backdrop-blur-md"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                                            <Users size={20} />
                                        </div>

                                        {/* Activity Details */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="font-bold text-white text-lg">
                                                    {activity.name}
                                                </span>
                                                <span className="text-slate-400">from</span>
                                                <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                                                    <MapPin size={14} className="text-blue-400" />
                                                    {activity.location}
                                                </span>
                                            </div>
                                            <div className="text-slate-300 mb-2">
                                                <span className="text-green-400 font-semibold">{activity.action}</span>
                                                {' '}
                                                <span className="font-bold text-white">{activity.package}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {activity.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users size={14} />
                                                    {activity.travelers} {activity.travelers === 1 ? 'traveler' : 'travelers'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verified Badge */}
                                    <div className="bg-white/5 rounded-xl px-4 py-2 shadow-sm border border-green-500/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                            <span className="text-sm font-semibold text-green-400">Verified Booking</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div className="glass-card p-6 text-center hover:bg-white/10 transition-colors">
                            <div className="text-3xl font-bold text-blue-400 mb-1">Growing</div>
                            <div className="text-sm text-slate-400">Community of Travelers</div>
                        </div>
                        <div className="glass-card p-6 text-center hover:bg-white/10 transition-colors">
                            <div className="text-3xl font-bold text-green-400 mb-1">Active</div>
                            <div className="text-sm text-slate-400">Bookings this week</div>
                        </div>
                        <div className="glass-card p-6 text-center hover:bg-white/10 transition-colors">
                            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-purple-400 mb-1">
                                <TrendingUp size={28} />
                                <span>+45%</span>
                            </div>
                            <div className="text-sm text-slate-400">Growth this year</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default LiveActivityFeed;
