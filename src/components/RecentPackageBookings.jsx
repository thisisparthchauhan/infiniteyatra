import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle } from 'lucide-react';

const RecentPackageBookings = ({ packageTitle }) => {
    const [currentBooking, setCurrentBooking] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Sample recent bookings - In production, fetch from Firebase filtered by packageId
    const recentBookings = [
        {
            name: 'Amit K.',
            location: 'Delhi',
            time: '2 hours ago',
            travelers: 2
        },
        {
            name: 'Sneha R.',
            location: 'Mumbai',
            time: '5 hours ago',
            travelers: 1
        },
        {
            name: 'Rajesh M.',
            location: 'Bangalore',
            time: '8 hours ago',
            travelers: 4
        },
        {
            name: 'Priya S.',
            location: 'Pune',
            time: '12 hours ago',
            travelers: 2
        },
        {
            name: 'Vikram P.',
            location: 'Hyderabad',
            time: '1 day ago',
            travelers: 3
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentBooking((prev) => (prev + 1) % recentBookings.length);
                setIsVisible(true);
            }, 400);
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, [recentBookings.length]);

    const booking = recentBookings[currentBooking];

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Recent Booking
                </span>
            </div>

            <AnimatePresence mode="wait">
                {isVisible && (
                    <motion.div
                        key={currentBooking}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                    >
                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {booking.name.charAt(0)}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 text-sm">
                                        {booking.name}
                                    </span>
                                    <CheckCircle size={14} className="text-green-600" />
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                                    <MapPin size={12} className="text-green-600" />
                                    <span>{booking.location}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {booking.time}
                                    </span>
                                    <span>•</span>
                                    <span>{booking.travelers} {booking.travelers === 1 ? 'traveler' : 'travelers'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-green-200">
                            <p className="text-xs text-green-700 font-medium">
                                ✓ Booked {packageTitle}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-1 mt-3">
                {recentBookings.map((_, index) => (
                    <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-300 ${index === currentBooking
                                ? 'w-6 bg-green-600'
                                : 'w-1 bg-green-300'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecentPackageBookings;
