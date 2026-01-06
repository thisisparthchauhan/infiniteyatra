import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, MessageCircle, Mail, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, packageTitle, amount, date } = location.state || {};

    if (!bookingId) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">No booking found</h2>
                <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
            </div>
        );
    }

    const handleDownloadInvoice = () => {
        // Placeholder for invoice download
        alert("Invoice download feature coming soon!");
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
            <div className="max-w-xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden"
                >
                    {/* Background confetti decoration (CSS/SVG could optionally be added here) */}

                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
                    <p className="text-slate-600 mb-8">
                        Your trip to <strong className="text-slate-900">{packageTitle}</strong> is successfully booked.
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-200">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Booking ID</span>
                            <span className="font-mono font-bold text-slate-900">{bookingId}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 text-sm">Amount Paid</span>
                            <span className="font-bold text-green-600">₹{amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Trip Date</span>
                            <span className="font-bold text-slate-900">{new Date(date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-left p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                <MessageCircle size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-blue-900">WhatsApp Confirmation</p>
                                <p className="text-sm text-blue-700">Sent to your registered number</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-left p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                <Mail size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="font-bold text-purple-900">Email Confirmation</p>
                                <p className="text-sm text-purple-700">Ticket sent to your inbox</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleDownloadInvoice}
                            className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            <Download size={20} />
                            Invoice
                        </button>
                        <Link
                            to="/"
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                        >
                            <Home size={20} />
                            Go Home
                        </Link>
                    </div>
                </motion.div>

                <p className="text-center text-slate-500 text-sm mt-8">
                    Need help? <a href="/contact" className="text-blue-600 hover:underline">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default BookingSuccess;
