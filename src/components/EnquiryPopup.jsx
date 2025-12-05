import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const EnquiryPopup = () => {
    const { currentUser } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        mobile: '',
        email: ''
    });

    // Configuration
    const POPUP_DELAY = 10000; // 10 seconds
    const SCROLL_THRESHOLD = 0.3; // 30% scroll
    const RETRY_DELAY = 2 * 60 * 1000; // 2 minutes

    useEffect(() => {
        // Don't show if user is logged in
        if (currentUser) return;

        // Check localStorage for last closed time
        const lastClosed = localStorage.getItem('enquiryPopupClosed');
        if (lastClosed) {
            const timeSinceClosed = Date.now() - parseInt(lastClosed);
            if (timeSinceClosed < RETRY_DELAY) {
                // If closed less than 2 mins ago, schedule check for when 2 mins is up
                const remainingTime = RETRY_DELAY - timeSinceClosed;
                const timer = setTimeout(() => checkTriggers(), remainingTime);
                return () => clearTimeout(timer);
            }
        }

        checkTriggers();

        // Scroll listener
        const handleScroll = () => {
            if (isVisible || isSubmitted) return;

            const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            if (scrollPercent > SCROLL_THRESHOLD) {
                showPopup();
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Time trigger
        const timer = setTimeout(() => {
            if (!isVisible && !isSubmitted) {
                showPopup();
            }
        }, POPUP_DELAY);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, [currentUser, isVisible, isSubmitted]);

    const checkTriggers = () => {
        // This function is called when we're allowed to show the popup again
        // We re-attach listeners or set timers here if needed
        // For simplicity, the main useEffect handles the initial setup
    };

    const showPopup = () => {
        // Double check login status and cooldown
        if (currentUser) return;

        const lastClosed = localStorage.getItem('enquiryPopupClosed');
        if (lastClosed && (Date.now() - parseInt(lastClosed) < RETRY_DELAY)) return;

        setIsVisible(true);
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('enquiryPopupClosed', Date.now().toString());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await addDoc(collection(db, 'enquiries'), {
                ...formData,
                createdAt: serverTimestamp(),
                source: window.location.pathname
            });
            setIsSubmitted(true);
            setTimeout(() => {
                setIsVisible(false);
                // Don't show again for a long time if submitted? Or standard 2 mins?
                // Let's assume standard behavior or maybe longer.
                // For now, standard behavior logic applies on next reload/check.
                localStorage.setItem('enquiryPopupClosed', Date.now().toString());
            }, 3000);
        } catch (error) {
            console.error("Error submitting enquiry:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-slate-100 rounded-full z-10 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Image Side */}
                        <div className="md:w-5/12 bg-blue-600 relative min-h-[200px] md:min-h-full">
                            <img
                                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop"
                                alt="Travel"
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                <div className="text-white">
                                    <h3 className="text-2xl font-bold mb-2">Plan Your Dream Trip</h3>
                                    <p className="text-white/90 text-sm">Get exclusive deals and personalized itineraries delivered to your inbox.</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="md:w-7/12 p-8 md:p-12 bg-white">
                            {isSubmitted ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <Send className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h3>
                                    <p className="text-slate-600">We'll be in touch with you shortly.</p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Enquire Now</h2>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">First Name*</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder="First Name"
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name*</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    placeholder="Last Name"
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile No*</label>
                                            <input
                                                type="tel"
                                                name="mobile"
                                                required
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                placeholder="Your mobile no"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email*</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Your mail id"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EnquiryPopup;
