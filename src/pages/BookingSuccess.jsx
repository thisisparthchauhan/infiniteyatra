import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, MessageCircle, Mail, ArrowRight, Home, Smartphone, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, packageTitle, amountPaid, totalAmount, date } = location.state || {};

    if (!bookingId) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">No booking found</h2>
                <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
            </div>
        );
    }

    const handleDownloadInvoice = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(30, 41, 59); // Slate 900
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('INFINITE YATRA', 20, 25);

        doc.setFontSize(10);
        doc.text('Invoice & Booking Receipt', 150, 25);

        // Booking Info
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text(`Booking ID: ${bookingId}`, 20, 60);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 60);

        doc.setFontSize(16);
        doc.text(`Trip: ${packageTitle}`, 20, 80);

        doc.setFontSize(12);
        doc.text(`Travel Date: ${new Date(date).toLocaleDateString()}`, 20, 90);

        // Payment Details Table
        const tableData = [
            ['Description', 'Amount'],
            ['Package Cost', `INR ${totalAmount?.toLocaleString()}`],
            ['Total Amount', `INR ${totalAmount?.toLocaleString()}`],
            ['Amount Paid', `INR ${amountPaid?.toLocaleString()}`],
            ['Balance Due', `INR ${balanceDue?.toLocaleString()}`]
        ];

        doc.autoTable({
            startY: 110,
            head: [['Description', 'Amount']],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 150;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Thank you for choosing Infinite Yatra!', 20, finalY + 20);
        doc.text('For support: infiniteyatra@gmail.com', 20, finalY + 30);

        doc.save(`Invoice_${bookingId}.pdf`);
    };

    const whatsappLink = `https://wa.me/919265799325?text=Hello%20Infinite%20Yatra%2C%20I%20have%20booked%20${encodeURIComponent(packageTitle)}%20(ID%3A%20${bookingId}).`;

    const balanceDue = totalAmount - amountPaid;

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
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 text-sm">Amount Paid</span>
                            <span className="font-bold text-green-600">₹{amountPaid?.toLocaleString()}</span>
                        </div>
                        {balanceDue > 0 && (
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-500 text-sm">Balance Due</span>
                                <span className="font-bold text-orange-600">₹{balanceDue?.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Total Amount</span>
                            <span className="font-bold text-slate-900">₹{totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Trip Date</span>
                            <span className="font-bold text-slate-900">{new Date(date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 text-left p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors cursor-pointer group"
                        >
                            <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                <MessageCircle size={24} className="text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold text-green-900">WhatsApp Confirmation</p>
                                <p className="text-sm text-green-700">Click to chat with us</p>
                            </div>
                        </a>

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

                    {balanceDue > 0 && (
                        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-6 text-left">
                            <h3 className="text-lg font-bold text-orange-800 mb-2 flex items-center gap-2">
                                <Smartphone size={20} />
                                Payment Instructions
                            </h3>
                            <p className="text-sm text-orange-700 mb-4">
                                To complete your payment of <strong>₹{balanceDue?.toLocaleString()}</strong>, please use the details below.
                            </p>
                            <div className="bg-white p-4 rounded-lg border border-orange-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-500 text-sm">UPI ID</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-800">infiniteyatra@upi</span>
                                        <button onClick={() => navigator.clipboard.writeText('infiniteyatra@upi')} className="text-blue-600 hover:text-blue-800"><Copy size={14} /></button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 text-center mt-2">
                                    Include your Booking ID ({bookingId}) in remarks.
                                </div>
                            </div>
                        </div>
                    )}

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
