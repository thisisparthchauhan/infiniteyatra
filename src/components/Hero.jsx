import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, Phone, Send, CheckCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

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
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
                    alt="Mountain Landscape"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center text-white">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
                >
                    Discover Your Next <br />
                    <span className="text-blue-400">Adventure</span>
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-1 bg-white w-32 md:w-48 mx-auto mb-8 rounded-full"
                />

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-2xl md:text-4xl lg:text-5xl text-white font-bold mb-10 max-w-2xl mx-auto tracking-wide"
                >
                    Explore Infinite Yatra
                </motion.p>

                {/* Enquiry Form / Success Message */}
                <div className="max-w-5xl mx-auto min-h-[100px]">
                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-green-500/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center text-white"
                            >
                                <CheckCircle size={64} className="mb-4 text-white" />
                                <h3 className="text-3xl font-bold mb-2">Thank you!</h3>
                                <p className="text-xl font-medium">We will reach you soon to plan your dream trip. 🚀</p>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                onSubmit={handleSubmit}
                                className="bg-white p-2 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row items-center gap-2"
                            >
                                {/* Location */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-slate-100">
                                    <MapPin className="text-blue-500 shrink-0" size={24} />
                                    <div className="text-left w-full">
                                        <label htmlFor="location" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Location</label>
                                        <input
                                            id="location"
                                            name="location"
                                            type="text"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="Where to?"
                                            required
                                            className="w-full outline-none text-slate-900 placeholder:text-slate-300 font-semibold text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Days */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-slate-100">
                                    <Calendar className="text-blue-500 shrink-0" size={24} />
                                    <div className="text-left w-full">
                                        <label htmlFor="days" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Days</label>
                                        <input
                                            id="days"
                                            name="days"
                                            type="number"
                                            min="1"
                                            value={formData.days}
                                            onChange={handleChange}
                                            placeholder="Duration"
                                            className="w-full outline-none text-slate-900 placeholder:text-slate-300 font-semibold text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Persons */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-slate-100">
                                    <Users className="text-blue-500 shrink-0" size={24} />
                                    <div className="text-left w-full">
                                        <label htmlFor="persons" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Travelers</label>
                                        <input
                                            id="persons"
                                            name="persons"
                                            type="number"
                                            min="1"
                                            value={formData.persons}
                                            onChange={handleChange}
                                            placeholder="How many?"
                                            className="w-full outline-none text-slate-900 placeholder:text-slate-300 font-semibold text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full">
                                    <Phone className="text-blue-500 shrink-0" size={24} />
                                    <div className="text-left w-full">
                                        <label htmlFor="phone" className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Phone</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Your number"
                                            required
                                            className="w-full outline-none text-slate-900 placeholder:text-slate-300 font-semibold text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="p-2 w-full lg:w-auto">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-5 rounded-[1.5rem] w-full lg:w-auto transition-all duration-300 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                                    >
                                        {isSubmitting ? (
                                            <Loader size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span className="lg:hidden font-bold text-lg">Send Enquiry</span>
                                                <Send size={24} className="lg:group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Hero;

