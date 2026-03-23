import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Clock, CreditCard, MessageCircle, Home, Phone, Loader2, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending Confirmation', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20', icon: Clock, emoji: '🟡' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: CreditCard, emoji: '🔵' },
    paid: { label: 'Confirmed & Paid', color: 'bg-green-500/20 text-green-400 border-green-500/20', icon: CheckCircle2, emoji: '✅' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/20', icon: AlertTriangle, emoji: '❌' }
};

const HotelBookingConfirmation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const ref = searchParams.get('ref');
    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!ref) { setLoading(false); setError('No booking reference found.'); return; }

        // Real-time listener for status updates
        const unsub = onSnapshot(doc(db, 'hotel_inquiries', ref), (snap) => {
            if (snap.exists()) {
                setInquiry({ id: snap.id, ...snap.data() });
            } else {
                setError('Booking not found.');
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError('Failed to load booking details.');
            setLoading(false);
        });

        return () => unsub();
    }, [ref]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md text-center">
                    <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
                    <p className="text-zinc-400 mb-6">{error}</p>
                    <Link to="/" className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors">Back to Home</Link>
                </div>
            </div>
        );
    }

    const status = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
            <div className="max-w-xl mx-auto">
                {/* Animated Checkmark */}
                <div className="text-center mb-8">
                    <div className="relative inline-flex">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-[scaleIn_0.5s_ease-out]">
                            <CheckCircle2 size={40} className="text-green-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mt-6 mb-2">
                        {inquiry.status === 'paid' ? 'Booking Confirmed!' : 'Inquiry Sent Successfully!'}
                    </h1>
                    <p className="text-zinc-400">
                        {inquiry.status === 'paid'
                            ? 'Your booking is fully confirmed. Show this page at check-in.'
                            : "Your booking request has been received. We'll confirm availability within 2 hours."}
                    </p>
                </div>

                {/* Booking Summary Card */}
                <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden mb-6">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Booking Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Reference ID</span>
                                <span className="font-mono font-bold text-blue-400">{inquiry.refId || inquiry.id?.slice(0, 12)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Hotel</span>
                                <span className="font-medium text-white text-right max-w-[240px]">{inquiry.hotelName}{inquiry.hotelCity ? `, ${inquiry.hotelCity}` : ''}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Room</span>
                                <span className="font-medium text-white text-right max-w-[240px]">{inquiry.roomType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Check-in</span>
                                <span className="font-medium text-white">{formatDate(inquiry.checkIn)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Check-out</span>
                                <span className="font-medium text-white">{formatDate(inquiry.checkOut)} ({inquiry.nights} Night{inquiry.nights > 1 ? 's' : ''})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Guests</span>
                                <span className="font-medium text-white">{inquiry.guests}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-white/10">
                                <span className="text-zinc-500">Amount</span>
                                <span className="font-bold text-white text-lg">₹{(inquiry.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-500">Status</span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                    <StatusIcon size={12} /> {status.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Link (if available) */}
                    {inquiry.paymentLink && inquiry.status === 'confirmed' && (
                        <div className="p-6 border-b border-white/10 bg-blue-500/5">
                            <p className="text-sm text-zinc-400 mb-3">💳 Complete your payment to secure this booking:</p>
                            <a href={inquiry.paymentLink} target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-center hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25">
                                Pay Now →
                            </a>
                        </div>
                    )}

                    {/* What Happens Next */}
                    {inquiry.status === 'pending' && (
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">What Happens Next?</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: '📲', title: 'Team Contact', desc: 'Our team will contact you on WhatsApp within 2 hours to confirm availability' },
                                    { icon: '💳', title: 'Payment Link', desc: "Once confirmed, we'll send you a secure payment link via WhatsApp" },
                                    { icon: '✅', title: 'Booking Voucher', desc: "After payment, you'll receive your booking voucher on WhatsApp & Email" }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg shrink-0">{step.icon}</div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{step.title}</p>
                                            <p className="text-xs text-zinc-500">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {inquiry.status === 'paid' && (
                        <div className="p-6 bg-green-500/5 text-center">
                            <p className="text-green-400 font-bold">🎫 Show this page at hotel check-in</p>
                            <p className="text-xs text-zinc-500 mt-1">Check-in: 2:00 PM | Check-out: 12:00 PM</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                    <a href="https://wa.me/919265799325" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-green-600/20 text-green-400 rounded-xl font-bold text-center flex items-center justify-center gap-2 border border-green-600/20 hover:bg-green-600/30 transition-colors text-sm">
                        <MessageCircle size={16} /> Chat on WhatsApp
                    </a>
                    <Link to="/" className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-colors text-sm">
                        <Home size={16} /> Back to Home
                    </Link>
                </div>

                <p className="text-center text-xs text-zinc-600">
                    Questions? Call us: <a href="tel:+919265799325" className="text-blue-400 hover:underline">+91 92657 99325</a>
                </p>
            </div>

            {/* CSS animation */}
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default HotelBookingConfirmation;
