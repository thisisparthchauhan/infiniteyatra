import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Phone, Send, CheckCircle, Loader, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import BackgroundSlider from './BackgroundSlider';

const Hero = () => {
    const [formData, setFormData] = useState({
        location: '',
        days: '',
        persons: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
    const { addToast } = useToast();

    const words = ["Journey", "Adventure", "Escape", "Experience", "Odyssey"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.location || !formData.phone) {
            addToast("Location and Phone number are required", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "enquiries"), {
                ...formData,
                days: Number(formData.days) || 0,
                persons: Number(formData.persons) || 0,
                status: 'new', // For admin to track
                createdAt: serverTimestamp(),
                source: 'homepage_hero'
            });

            setIsSubmitted(true);
            addToast("Enquiry sent successfully!", "success");

            // Reset form after 5 seconds to allow sending another
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({ location: '', days: '', persons: '', phone: '' });
            }, 5000);

        } catch (error) {
            console.error("Error submitting enquiry:", error);
            addToast("Failed to send enquiry. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Slider */}
            <BackgroundSlider />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 z-[1] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center text-white">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 drop-shadow-lg"
                >
                    Discover Your Next <br />
                    <span className="text-blue-400 inline-block min-w-[280px]">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={words[index]}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="inline-block"
                            >
                                {words[index].split('').map((char, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.1, delay: i * 0.05 }}
                                    >
                                        {char}
                                    </motion.span>
                                ))}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="h-1 bg-white w-32 md:w-48 mx-auto mb-6 md:mb-8 rounded-full shadow-lg"
                />

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-2xl md:text-4xl lg:text-5xl text-white font-bold mb-8 md:mb-10 max-w-2xl mx-auto tracking-wide drop-shadow-md"
                >
                    Explore Infinite Yatra
                </motion.p>

                {/* Mobile: Plan Trip Button (Expands Form) */}
                {/* Mobile: Plan Trip Button (Expands Form) */}
                <div className="lg:hidden mb-8 relative z-20">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: [1, 1.05, 1],
                            boxShadow: [
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                "0 0 20px rgba(59, 130, 246, 0.5)",
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                            ]
                        }}
                        transition={{
                            delay: 1,
                            scale: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            },
                            boxShadow: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="glass text-blue-300 px-8 py-4 rounded-full font-bold text-lg border border-white/20 flex items-center gap-3 mx-auto"
                        onClick={() => setIsMobileFormOpen(!isMobileFormOpen)}
                    >
                        {isMobileFormOpen ? 'Close Planner' : 'Plan Your Trip'}
                        <Send size={20} className={isMobileFormOpen ? 'rotate-180 transition-transform text-red-400' : 'text-blue-400'} />
                    </motion.button>
                </div>

                {/* Enquiry Form / Success Message */}
                <div className="max-w-5xl mx-auto min-h-[20px] lg:min-h-[100px]">
                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-green-500/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white border border-white/20"
                            >
                                <CheckCircle size={64} className="mb-4 text-white drop-shadow-md" />
                                <h3 className="text-3xl font-bold mb-2">Thank you!</h3>
                                <p className="text-xl font-medium">We will reach you soon to plan your dream trip. 🚀</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form-container"
                                initial={false}
                                animate={{
                                    height: isMobileFormOpen || window.innerWidth >= 1024 ? 'auto' : 0,
                                    opacity: isMobileFormOpen || window.innerWidth >= 1024 ? 1 : 0
                                }}
                                className="overflow-hidden"
                            >
                                <motion.form
                                    id="enquiry-form"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    onSubmit={handleSubmit}
                                    className={`
                                        p-3 rounded-[2.5rem] flex flex-col lg:flex-row items-center gap-4 border border-white/20 transition-all duration-500
                                        ${isMobileFormOpen ? 'glass mt-4' : 'glass lg:glass-card'}
                                    `}
                                >
                                    {/* Location */}
                                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-slate-200/50">
                                        <MapPin className="text-blue-500 shrink-0" size={24} />
                                        <div className="text-left w-full">
                                            <label htmlFor="location" className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Location</label>
                                            <input
                                                id="location"
                                                name="location"
                                                type="text"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="Where to?"
                                                required
                                                className="w-full outline-none text-white placeholder:text-white/50 font-medium text-lg bg-transparent border-b border-transparent focus:border-blue-400 transition-colors py-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Days */}
                                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-slate-200/50">
                                        <Calendar className="text-blue-500 shrink-0" size={24} />
                                        <div className="text-left w-full">
                                            <label htmlFor="days" className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Days</label>
                                            <input
                                                id="days"
                                                name="days"
                                                type="number"
                                                min="1"
                                                value={formData.days}
                                                onChange={handleChange}
                                                placeholder="Duration"
                                                className="w-full outline-none text-white placeholder:text-white/50 font-medium text-lg bg-transparent border-b border-transparent focus:border-blue-400 transition-colors py-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Persons */}
                                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-slate-200/50">
                                        <Users className="text-blue-500 shrink-0" size={24} />
                                        <div className="text-left w-full">
                                            <label htmlFor="persons" className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Travelers</label>
                                            <input
                                                id="persons"
                                                name="persons"
                                                type="number"
                                                min="1"
                                                value={formData.persons}
                                                onChange={handleChange}
                                                placeholder="How many?"
                                                className="w-full outline-none text-white placeholder:text-white/50 font-medium text-lg bg-transparent border-b border-transparent focus:border-blue-400 transition-colors py-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full">
                                        <Phone className="text-blue-500 shrink-0" size={24} />
                                        <div className="text-left w-full">
                                            <label htmlFor="phone" className="block text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Phone</label>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Your number"
                                                required
                                                className="w-full outline-none text-white placeholder:text-white/50 font-medium text-lg bg-transparent border-b border-transparent focus:border-blue-400 transition-colors py-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="p-2 w-full lg:w-auto">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-5 rounded-[1.5rem] w-full lg:w-auto transition-all duration-300 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer min-w-[60px] lg:min-w-[170px]"
                                        >
                                            {isSubmitting ? (
                                                <Loader size={24} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="font-bold text-lg lg:hidden lg:group-hover:inline-block transition-all duration-300 whitespace-nowrap">Plan My Trip</span>
                                                    <Send size={24} className="lg:group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scroll Cue */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer text-white/80 hover:text-white transition-colors"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 1 }}
                onClick={() => {
                    const destinations = document.getElementById('destinations');
                    if (destinations) destinations.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                <span className="text-sm font-medium tracking-widest uppercase">Explore Trips</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                    <ArrowDown size={24} />
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Hero;


