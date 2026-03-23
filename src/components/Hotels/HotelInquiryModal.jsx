import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, MessageCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { notifyAdminNewInquiry } from '../../services/whatsappService';

const HotelInquiryModal = ({
    isOpen,
    onClose,
    hotel,
    selectedRoom,
    checkIn,
    checkOut,
    guests,
    nights,
    totalStayPrice,
    avgNightlyPrice
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        specialRequests: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const cleaningFee = 850;
    const serviceFee = 450;
    const baseTotal = totalStayPrice || (avgNightlyPrice * nights);
    const totalAmount = baseTotal + cleaningFee + serviceFee;

    const roomName = selectedRoom?.name || hotel?.rooms?.[0]?.name || 'Standard Room';

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Please enter your full name.');
            return;
        }
        if (!formData.phone.trim() || formData.phone.trim().length < 10) {
            setError('Please enter a valid phone number.');
            return;
        }

        setSubmitting(true);

        try {
            const refId = `IY-HTL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

            const inquiryData = {
                hotelId: hotel.id,
                hotelName: hotel.name,
                hotelCity: hotel.location || hotel.city || '',
                roomType: roomName,
                checkIn: checkIn,
                checkOut: checkOut,
                nights: nights,
                guests: guests,
                basePrice: avgNightlyPrice,
                cleaningFee: cleaningFee,
                serviceFee: serviceFee,
                totalAmount: totalAmount,
                clientName: formData.name.trim(),
                clientPhone: formData.phone.trim(),
                clientEmail: formData.email.trim(),
                specialRequests: formData.specialRequests.trim(),
                userId: user?.uid || null,
                refId: refId,
                status: 'pending',
                createdAt: serverTimestamp(),
                source: 'website'
            };

            const docRef = await addDoc(collection(db, 'hotel_inquiries'), inquiryData);

            // Auto-notify admin on WhatsApp
            notifyAdminNewInquiry({ ...inquiryData, id: docRef.id });

            // Navigate to confirmation page
            onClose();
            navigate(`/hotels/booking-confirmation?ref=${docRef.id}`);
        } catch (err) {
            console.error('Error saving inquiry:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#0f172a] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-blue-900/30 to-purple-900/20">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🏨 Request to Book
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">{hotel.name} • {hotel.location || hotel.city}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="text-zinc-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Booking Summary */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                            <div className="flex justify-between text-zinc-300">
                                <span>Check-in</span>
                                <span className="font-medium text-white">{formatDate(checkIn)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-300">
                                <span>Check-out</span>
                                <span className="font-medium text-white">{formatDate(checkOut)} ({nights} Night{nights > 1 ? 's' : ''})</span>
                            </div>
                            <div className="flex justify-between text-zinc-300">
                                <span>Room</span>
                                <span className="font-medium text-white text-right max-w-[200px] truncate">{roomName}</span>
                            </div>
                            <div className="flex justify-between text-zinc-300">
                                <span>Guests</span>
                                <span className="font-medium text-white">{guests}</span>
                            </div>
                        </div>

                        {/* Guest Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Your Details</h3>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Full Name *</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                                    placeholder="e.g. Parth Chauhan"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Phone Number *</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                                    placeholder="+91 98765 43210"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Email (optional)</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Special Requests (optional)</label>
                                <textarea
                                    name="specialRequests"
                                    value={formData.specialRequests}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all resize-none h-20"
                                    placeholder="Early check-in, extra bed, dietary needs..."
                                />
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-300">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Price Summary</h3>
                            <div className="flex justify-between">
                                <span>₹{avgNightlyPrice.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
                                <span>₹{baseTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cleaning fee</span>
                                <span>₹{cleaningFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Service fee</span>
                                <span>₹{serviceFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-white/10 font-bold text-white text-lg">
                                <span>Total before taxes</span>
                                <span>₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Notice */}
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
                            <p className="text-xs text-green-400">
                                ⚡ You won't be charged now. We'll confirm availability on WhatsApp.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors border border-white/10">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
                                {submitting ? (
                                    <><Loader2 size={18} className="animate-spin" /> Sending...</>
                                ) : (
                                    <><MessageCircle size={18} /> Send Inquiry on WhatsApp</>
                                )}
                            </button>
                        </div>
                    </form>
            </div>
        </div>
    );
};

export default HotelInquiryModal;
