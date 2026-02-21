'use client';
// EnquiryPopup — client-only (uses timer, form state, Firebase write)
import { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export function EnquiryPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', destination: '' });

    useEffect(() => {
        // Show popup after 30 seconds if not dismissed
        const dismissed = sessionStorage.getItem('iy_enquiry_dismissed');
        if (dismissed) return;
        const timer = setTimeout(() => setIsOpen(true), 30000);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
        sessionStorage.setItem('iy_enquiry_dismissed', 'true');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'enquiries'), {
                ...form,
                source: 'popup',
                timestamp: serverTimestamp(),
            });
            setSubmitted(true);
            toast.success('Thanks! We\'ll call you back soon 🙏');
            setTimeout(handleDismiss, 2000);
        } catch {
            toast.error('Failed to submit. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6 rounded-2xl relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                    <X size={16} />
                </button>

                {submitted ? (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Phone size={28} className="text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">We&apos;ll call you back!</h3>
                        <p className="text-white/60 text-sm">Our travel expert will reach out within 24 hours.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-5">
                            <h3 className="text-xl font-bold text-white mb-1">Plan Your Dream Trip 🌏</h3>
                            <p className="text-white/60 text-sm">Get a free consultation with our travel expert</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Your name"
                                value={form.name}
                                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <input
                                type="tel"
                                placeholder="Phone number"
                                value={form.phone}
                                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Dream destination (e.g. Goa, Manali)"
                                value={form.destination}
                                onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]"
                            >
                                Get Free Callback
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
