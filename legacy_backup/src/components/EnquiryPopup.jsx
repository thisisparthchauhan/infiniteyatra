import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { X, Send, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const EnquiryPopup = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCoolingDown, setIsCoolingDown] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        mobile: '',
        email: ''
    });

    // Configuration
    const SCROLL_THRESHOLD = 0.5; // 50% scroll
    const RETRY_DELAY = 150 * 1000; // 150 seconds

    useEffect(() => {
        // Don't setup listeners if user logged in or on auth pages
        const isAuthPage = ['/login', '/signup'].includes(location.pathname);
        if (currentUser || isAuthPage) {
            setIsVisible(false);
            return;
        }

        const handleScroll = () => {
            // If already visible, submitted, or in cooling down period, do nothing
            if (isVisible || isSubmitted || isCoolingDown) return;

            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) return;

            const scrollPercent = window.scrollY / scrollHeight;
            if (scrollPercent > SCROLL_THRESHOLD) {
                setIsVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [currentUser, location.pathname, isVisible, isSubmitted, isCoolingDown]);

    const handleClose = () => {
        setIsVisible(false);
        setIsCoolingDown(true);

        // Re-show after RETRY_DELAY (150s)
        setTimeout(() => {
            if (!currentUser && !isSubmitted) {
                setIsCoolingDown(false);
                setIsVisible(true);
            }
        }, RETRY_DELAY);
    };

    // Original submit logic remains, but we need to update to use handleClose logic or similar for post-submit behavior if needed.
    // However, usually after submit we might not want to show it again immediately.
    // User didn't specify post-submit behavior, assuming standard "don't show".
    // But for handleSubmit success, we modify it slightly to not trigger the loop if we don't want to.

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Strict Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
            alert("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);

        try {
            await addDoc(collection(db, 'enquiries'), {
                ...formData,
                fullMobile: `+${formData.mobile}`,
                createdAt: serverTimestamp(),
                source: window.location.pathname
            });
            setIsSubmitted(true);
            setTimeout(() => {
                setIsVisible(false);
                // We do NOT set isCoolingDown here because we presumably don't want to spam them after they submitted.
                // Or if we do, we'd add the timeout logic here too. Assuming staying silent after success.
            }, 3000);
        } catch (error) {
            console.error("Error submitting enquiry:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Name Validation: Allow only letters and spaces, Title Case
        if (name === 'firstName' || name === 'lastName') {
            const onlyLetters = /^[A-Za-z\s]*$/;
            if (!onlyLetters.test(value)) return;

            // Capitalize first letter, rest lowercase
            const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value) => {
        setFormData(prev => ({ ...prev, mobile: value }));
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
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 text-slate-900"
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
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 text-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile No*</label>
                                            <PhoneInput
                                                country={'in'}
                                                value={formData.mobile}
                                                onChange={handlePhoneChange}
                                                inputStyle={{
                                                    width: '100%',
                                                    height: '42px',
                                                    fontSize: '16px',
                                                    paddingLeft: '48px',
                                                    borderRadius: '0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    backgroundColor: '#f8fafc',
                                                    color: '#0f172a'
                                                }}
                                                containerStyle={{
                                                    width: '100%'
                                                }}
                                                buttonStyle={{
                                                    borderRadius: '0.75rem 0 0 0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    backgroundColor: '#f8fafc',
                                                    color: '#0f172a'
                                                }}
                                                dropdownStyle={{
                                                    color: '#0f172a'
                                                }}
                                                enableSearch={true}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email*</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                                title="Please enter a valid email address (e.g., user@example.com)"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Enter your email"
                                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50 text-slate-900"
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
