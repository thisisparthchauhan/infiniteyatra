import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle, Mail, Phone, MapPin, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const HotelPartnerOnboarding = () => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        hotelName: '',
        city: '',
        contactName: '',
        email: '',
        phone: '',
        category: 'Resort'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
        }, 1000);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 max-w-lg w-full rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 text-center shadow-xl">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">Application Received!</h2>
                    <p className="text-slate-500 mb-8">
                        Thank you for your interest in partnering with Infinite Yatra. Our team will review your details and get back to you within 48 hours.
                    </p>
                    <Link to="/" className="text-blue-600 hover:text-blue-500 font-medium">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <span className="text-blue-600 font-bold tracking-wider text-sm uppercase mb-2 block">Partner With Us</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">List Your Property on <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Infinite Yatra</span></h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Join our exclusive network of premium hotels and resorts. Reach high-value travelers and grow your revenue.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* Benefits Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-8">Why Partner with Us?</h2>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Premium Exposure</h3>
                                    <p className="text-slate-500 text-sm">Get featured in front of our curated community of travelers looking for unique experiences.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Verified Standards</h3>
                                    <p className="text-slate-500 text-sm">We maintain high standards, which means high trust from customers and fewer cancellations.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Dedicated Support</h3>
                                    <p className="text-slate-500 text-sm">Our partner success team is here to help you optimize your listings and revenue.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <p className="text-sm text-slate-500 italic">
                                "Since joining Infinite Yatra, our weekend occupancy has increased by 40%. The quality of guests is outstanding."
                            </p>
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div>
                                    <p className="font-bold text-sm">Rajesh Kumar</p>
                                    <p className="text-xs text-slate-500">Owner, Himalayan Heights</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Application Form */}
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                        <h2 className="text-xl font-bold mb-6">Property Application</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Property Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="hotelName"
                                        value={formData.hotelName}
                                        onChange={handleChange}
                                        className="w-full pl-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="e.g. The Grand Palace"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">City / Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full pl-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="e.g. Manali, HP"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Contact Name</label>
                                    <input
                                        type="text"
                                        name="contactName"
                                        value={formData.contactName}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors appearance-none"
                                    >
                                        <option>Resort</option>
                                        <option>Hotel</option>
                                        <option>Homestay</option>
                                        <option>Villa</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="partner@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="+91 98765 00000"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition-colors mt-4"
                            >
                                Submit Application
                            </button>
                            <p className="text-xs text-center text-slate-500">
                                By submitting, you agree to our Partner Terms & Conditions.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelPartnerOnboarding;
