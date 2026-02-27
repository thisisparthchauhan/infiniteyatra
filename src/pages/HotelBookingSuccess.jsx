import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, MessageCircle, Calendar, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

const HotelBookingSuccess = () => {
    const location = useLocation();
    const { booking } = location.state || {
        booking: {
            id: 'BK99999',
            hotelName: 'The Grand IY Resort',
            date: new Date().toISOString()
        }
    };

    useEffect(() => {
        // Trigger Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: random(0.1, 0.3) } });
            confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: random(0.1, 0.3) } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 max-w-lg w-full rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={40} />
                </div>

                <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
                <p className="text-slate-500 mb-8">Your trip to <strong className="text-white">{booking.hotelName}</strong> is all set.</p>

                <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl mb-8 text-left space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-700">
                        <span className="text-slate-500 text-sm">Booking ID</span>
                        <span className="font-mono font-bold text-lg">{booking.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm flex items-center gap-2"><Calendar size={14} /> Check-in</span>
                        <span className="font-medium">Feb 15, 2026</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm flex items-center gap-2"><MapPin size={14} /> Location</span>
                        <span className="font-medium">Goa, India</span>
                    </div>
                </div>

                <div className="flex gap-3 justify-center text-sm text-slate-500 mb-8">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full text-green-500">
                        <Mail size={14} /> Sent to email
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full text-green-500">
                        <MessageCircle size={14} /> Sent to WhatsApp
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Link to="/hotels" className="px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        Book Another
                    </Link>
                    <Link to="/my-bookings" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors">
                        View Bookings
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default HotelBookingSuccess;
