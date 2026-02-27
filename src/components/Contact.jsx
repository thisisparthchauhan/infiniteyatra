import React, { useState } from 'react';
import { Send, Mail, Phone, User, MessageSquare, AlertCircle } from 'lucide-react';
import { sendContactEmail } from '../services/email';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Message validation
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Save to Firestore
            await addDoc(collection(db, 'enquiries'), {
                ...formData,
                timestamp: serverTimestamp(),
                status: 'new',
                source: 'home_contact_section'
            });

            // 2. Send Email
            const result = await sendContactEmail({
                ...formData,
                subject: `New Contact from ${formData.name} (Home Page)`
            });

            if (result.success) {
                addToast('Message sent successfully! We\'ll get back to you soon.', 'success');
                setFormData({ name: '', email: '', phone: '', message: '' });
            } else {
                addToast('Message saved, but email service reported an issue. We will still contact you.', 'warning');
            }

        } catch (error) {
            console.error('Submission failed:', error);
            addToast(`Error: ${error.message || 'Something went wrong. Please try again later.'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-16 relative overflow-hidden">
            {/* Decorative elements - Subtle for dark mode */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            Get In Touch
                        </h2>
                        <p className="text-white/70 text-base max-w-2xl mx-auto font-light">
                            Have questions about your next adventure? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    {/* Contact Form */}
                    <div className="glass-card p-6 md:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Field */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-white/90 mb-2">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                                            <User size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border ${errors.name
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-white/10 focus:border-blue-400'
                                                } focus:ring-0 outline-none transition-all duration-300 text-white placeholder:text-white/30`}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                                            <Mail size={20} />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border ${errors.email
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-white/10 focus:border-blue-400'
                                                } focus:ring-0 outline-none transition-all duration-300 text-white placeholder:text-white/30`}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Phone Field (Optional) */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-white/90 mb-2">
                                    Phone Number <span className="text-white/40 font-normal">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                                        <Phone size={20} />
                                    </div>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-blue-400 focus:ring-0 outline-none transition-all duration-300 text-white placeholder:text-white/30"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            {/* Message Field */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-semibold text-white/90 mb-2">
                                    Your Message *
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-4 text-white/50">
                                        <MessageSquare size={20} />
                                    </div>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="6"
                                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border ${errors.message
                                            ? 'border-red-400 focus:border-red-500'
                                            : 'border-white/10 focus:border-blue-400'
                                            } focus:ring-0 outline-none transition-all duration-300 resize-none text-white placeholder:text-white/30`}
                                        placeholder="Tell us about your travel plans or any questions you have..."
                                    ></textarea>
                                </div>
                                {errors.message && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {errors.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full glass-btn justify-center bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                            <Send size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
