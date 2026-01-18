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
        <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
            {/* Background Slider - keeping it but overlay will be cleaner */}
            <BackgroundSlider />

            {/* Premium Vignette Overlay (No heavy gradients) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-[1] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center text-white flex flex-col items-center">

                {/* Glass Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="glass-card px-6 py-2 rounded-full mb-8 flex items-center gap-2 inline-flex"
                    style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
                >
                    <span className="text-sm font-medium tracking-wider uppercase text-white/90">Follow Your</span>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ff4d4d" stroke="none" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </motion.div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 drop-shadow-2xl"
                >
                    Discover Your Next <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 inline-block min-w-[280px]">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={words[index]}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="inline-block"
                            >
                                {words[index]}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-xl md:text-2xl text-white/80 font-normal mb-12 max-w-2xl mx-auto tracking-wide"
                >
                    Explore the world with Infinite Yatra.
                </motion.p>

                {/* Glass Enquiry Form */}
                <div className="w-full max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-8 flex flex-col items-center justify-center text-white"
                            >
                                <CheckCircle size={48} className="mb-4 text-green-400" />
                                <h3 className="text-2xl font-bold mb-2">Thank you!</h3>
                                <p className="text-lg text-white/80">We'll be in touch shortly.</p>
                            </motion.div>
                        ) : (
                            <motion.form
                                id="enquiry-form"
                                key="form"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                onSubmit={handleSubmit}
                                className="glass-card p-2 rounded-[2rem] flex flex-col lg:flex-row items-center gap-2"
                            >
                                {/* Location */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/10">
                                    <MapPin className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="location" className="block text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Location</label>
                                        <input
                                            id="location"
                                            name="location"
                                            type="text"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="Where to?"
                                            required
                                            className="w-full outline-none text-white placeholder:text-white/30 font-medium text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Days */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/10">
                                    <Calendar className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="days" className="block text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Duration</label>
                                        <input
                                            id="days"
                                            name="days"
                                            type="number"
                                            min="1"
                                            value={formData.days}
                                            onChange={handleChange}
                                            placeholder="Days"
                                            className="w-full outline-none text-white placeholder:text-white/30 font-medium text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Travelers */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/10">
                                    <Users className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="persons" className="block text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Travelers</label>
                                        <input
                                            id="persons"
                                            name="persons"
                                            type="number"
                                            min="1"
                                            value={formData.persons}
                                            onChange={handleChange}
                                            placeholder="Guests"
                                            className="w-full outline-none text-white placeholder:text-white/30 font-medium text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full">
                                    <Phone className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="phone" className="block text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Phone</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Number"
                                            required
                                            className="w-full outline-none text-white placeholder:text-white/30 font-medium text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="p-1 w-full lg:w-auto">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-white text-black hover:bg-white/90 px-8 py-5 rounded-[1.7rem] w-full lg:w-auto transition-all duration-300 font-bold text-lg shadow-lg flex items-center justify-center gap-2 min-w-[160px]"
                                    >
                                        {isSubmitting ? (
                                            <Loader size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Plan Trip</span>
                                                <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scroll Cue */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 opacity-50 hover:opacity-100 transition-opacity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                    const destinations = document.getElementById('destinations');
                    if (destinations) destinations.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                <ArrowDown size={32} className="text-white animate-bounce" />
            </motion.div>
        </div>
    );
};

export default Hero;


