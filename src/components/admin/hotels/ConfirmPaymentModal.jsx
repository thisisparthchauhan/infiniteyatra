import React, { useState } from 'react';
import { X, MessageCircle, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { addCredits } from '../../../services/passportService';
import { sendWhatsAppNotification, buildConfirmationMessage, buildVoucherMessage, buildCancellationMessage } from '../../../services/whatsappService';

// Credits per night based on hotel category
const CREDIT_MAP = {
    'Budget': 50, '3 Star': 50, '4 Star': 100, '5 Star': 150, 'Luxury': 150
};

const ConfirmPaymentModal = ({ isOpen, onClose, inquiry, mode = 'confirm' }) => {
    const [paymentLink, setPaymentLink] = useState('');
    const [sendWhatsApp, setSendWhatsApp] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen || !inquiry) return null;

    // Mark dates as booked in hotel_availability
    const markDatesBooked = async () => {
        if (!inquiry.hotelId || !inquiry.checkIn || !inquiry.checkOut) return;
        try {
            const start = new Date(inquiry.checkIn);
            const end = new Date(inquiry.checkOut);
            const months = new Set();
            const dateEntries = {};

            for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const monthStr = dateStr.substring(0, 7);
                months.add(monthStr);
                if (!dateEntries[monthStr]) dateEntries[monthStr] = {};
                dateEntries[monthStr][dateStr] = 'booked';
            }

            for (const month of months) {
                const docId = `${inquiry.hotelId}_${inquiry.roomType?.replace(/\s+/g, '_') || 'default'}_${month}`;
                const ref = doc(db, 'hotel_availability', docId);
                const existing = await getDoc(ref);

                if (existing.exists()) {
                    const existingDates = existing.data().dates || {};
                    await updateDoc(ref, {
                        dates: { ...existingDates, ...dateEntries[month] },
                        updatedAt: serverTimestamp()
                    });
                } else {
                    await setDoc(ref, {
                        hotelId: inquiry.hotelId,
                        hotelName: inquiry.hotelName,
                        roomType: inquiry.roomType,
                        month: month,
                        dates: dateEntries[month],
                        updatedAt: serverTimestamp()
                    });
                }
            }
        } catch (err) {
            console.warn('Could not update availability:', err);
        }
    };

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            // 1. Update inquiry status
            await updateDoc(doc(db, 'hotel_inquiries', inquiry.id), {
                status: 'confirmed',
                confirmedAt: serverTimestamp(),
                paymentLink: paymentLink || null,
                confirmedBy: 'admin'
            });

            // 2. Mark dates as booked
            await markDatesBooked();

            // 3. Award passport credits
            if (inquiry.userId) {
                try {
                    let category = '3 Star';
                    if (inquiry.hotelId) {
                        const hotelSnap = await getDoc(doc(db, 'hotels', inquiry.hotelId));
                        if (hotelSnap.exists()) category = hotelSnap.data().category || '3 Star';
                    }
                    const creditsPerNight = CREDIT_MAP[category] || 50;
                    const totalCredits = creditsPerNight * (inquiry.nights || 1);
                    await addCredits(inquiry.userId, 'hotel_booking', `Hotel booking confirmed: ${inquiry.hotelName} (${inquiry.nights} nights)`, totalCredits, inquiry.id);
                } catch (e) { console.warn('Credits error:', e); }
            }

            // 4. Send WhatsApp
            if (sendWhatsApp) {
                const msg = buildConfirmationMessage(inquiry, paymentLink);
                sendWhatsAppNotification(inquiry.clientPhone, msg);
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Failed to confirm booking');
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkPaid = async () => {
        setProcessing(true);
        try {
            await updateDoc(doc(db, 'hotel_inquiries', inquiry.id), {
                status: 'paid',
                paidAt: serverTimestamp()
            });

            if (sendWhatsApp) {
                const msg = buildVoucherMessage(inquiry);
                sendWhatsAppNotification(inquiry.clientPhone, msg);
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Failed to update payment status');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        setProcessing(true);
        try {
            await updateDoc(doc(db, 'hotel_inquiries', inquiry.id), {
                status: 'cancelled',
                cancelledAt: serverTimestamp()
            });

            if (sendWhatsApp) {
                const msg = buildCancellationMessage(inquiry);
                sendWhatsAppNotification(inquiry.clientPhone, msg);
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Failed to cancel booking');
        } finally {
            setProcessing(false);
        }
    };

    const isConfirm = mode === 'confirm';
    const isPaid = mode === 'paid';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => onClose()}>
            <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
                {success ? (
                    <div className="text-center py-6 space-y-3">
                        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={28} className="text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            {isConfirm ? 'Booking Confirmed!' : isPaid ? 'Payment Recorded!' : 'Booking Cancelled'}
                        </h3>
                        <p className="text-sm text-zinc-400">
                            {sendWhatsApp ? 'WhatsApp notification sent to guest.' : 'Status updated.'}
                        </p>
                        <button onClick={onClose} className="px-6 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20">Close</button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-white">
                                {isConfirm ? 'Confirm Booking & Send Payment Link' : isPaid ? 'Mark as Paid' : 'Cancel Booking'}
                            </h3>
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={18} className="text-slate-400" /></button>
                        </div>

                        {/* Guest Info */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Guest</span>
                                <span className="text-white font-medium">{inquiry.clientName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Hotel</span>
                                <span className="text-white font-medium">{inquiry.hotelName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Dates</span>
                                <span className="text-white">{inquiry.checkIn} → {inquiry.checkOut} ({inquiry.nights}N)</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-white/5">
                                <span className="text-zinc-500">Amount</span>
                                <span className="text-white font-bold text-lg">₹{(inquiry.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            {inquiry.refId && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Ref</span>
                                    <span className="text-blue-400 font-mono text-xs">{inquiry.refId}</span>
                                </div>
                            )}
                        </div>

                        {/* Payment Link (only for confirm mode) */}
                        {isConfirm && (
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 block">Payment Link (optional)</label>
                                <input
                                    value={paymentLink}
                                    onChange={e => setPaymentLink(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="https://rzp.io/l/... or leave blank for UPI"
                                />
                                <p className="text-xs text-zinc-600">Paste a Razorpay link, or leave blank to include UPI details in WhatsApp.</p>
                            </div>
                        )}

                        {/* WhatsApp Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sendWhatsApp}
                                onChange={e => setSendWhatsApp(e.target.checked)}
                                className="w-4 h-4 rounded bg-black/40 border-white/20 text-blue-500"
                            />
                            <span className="text-sm text-zinc-300">Send WhatsApp notification to guest</span>
                        </label>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-zinc-400 rounded-xl font-medium text-sm hover:bg-white/10">
                                Cancel
                            </button>
                            <button
                                onClick={isConfirm ? handleConfirm : isPaid ? handleMarkPaid : handleCancel}
                                disabled={processing}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all ${
                                    isConfirm ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'
                                    : isPaid ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                                {processing ? <Loader2 size={16} className="animate-spin" /> : (
                                    isConfirm ? <><MessageCircle size={14} /> Confirm & Notify</> :
                                    isPaid ? <><CreditCard size={14} /> Mark Paid & Send Voucher</> :
                                    <><X size={14} /> Cancel Booking</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmPaymentModal;
