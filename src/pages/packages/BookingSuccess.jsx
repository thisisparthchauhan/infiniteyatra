import React, { useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, MessageCircle, Mail, ArrowRight, Home, Smartphone, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, packageTitle, totalAmount, date, isRequest } = location.state || {};
    const amountPaid = location.state?.amountPaid || 0;
    const hasDownloaded = useRef(false);

    const balanceDue = (totalAmount || 0) - (amountPaid || 0);

    const handleDownloadInvoice = () => {
        try {
            const doc = new jsPDF();

            // Brand Colors
            const primaryColor = [30, 41, 59]; // Slate 900
            const accentColor = [22, 163, 74]; // Green 600

            // Header Background
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 40, 'F');

            // Header Text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('INFINITE YATRA', 20, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Invoice & Booking Receipt', 190, 25, { align: 'right' });

            // Booking Details Section
            let yPos = 60;
            doc.setTextColor(30, 41, 59);

            // Left Column
            doc.setFontSize(10);
            doc.text('Booking Reference:', 20, yPos);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(bookingId || 'N/A', 20, yPos + 7);

            // Right Column
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Date Issued:', 190, yPos, { align: 'right' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(new Date().toLocaleDateString(), 190, yPos + 7, { align: 'right' });

            yPos += 25;

            // Trip Details
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.text(`Trip: ${packageTitle}`, 20, yPos);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Travel Date: ${date ? new Date(date).toLocaleDateString() : 'TBD'}`, 20, yPos + 7);

            // Financial Table
            const tableData = [
                ['Description', 'Amount (INR)'],
                ['Total Package Cost', totalAmount?.toLocaleString()],
                ['Amount Paid', amountPaid?.toLocaleString()],
                ['Balance Due', balanceDue?.toLocaleString()]
            ];

            autoTable(doc, {
                startY: yPos + 20,
                head: [tableData[0]],
                body: tableData.slice(1),
                theme: 'grid',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { halign: 'right', fontStyle: 'bold' }
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 6
                }
            });

            // Footer
            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('Thank you for choosing Infinite Yatra!', 105, finalY, { align: 'center' });
            doc.text('Need help? Contact us at info@infiniteyatra.com', 105, finalY + 7, { align: 'center' });

            doc.save(`Invoice_${bookingId}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF:", err);
            // Optionally alert user, but since this is auto-triggered, maybe silent fail or specific UI feedback
        }
    };

    // Auto-generate invoice on mount
    useEffect(() => {
        if (bookingId && !hasDownloaded.current) {
            handleDownloadInvoice();
            hasDownloaded.current = true;
        }
    }, [bookingId]);

    if (!bookingId) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">No booking found</h2>
                <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
            </div>
        );
    }

    const whatsappLink = `https://wa.me/919265799325?text=Hello%20Infinite%20Yatra%2C%20I%20have%20booked%20${encodeURIComponent(packageTitle)}%20(ID%3A%20${bookingId}).`;

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

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Request Received! 🎉</h1>
                    <p className="text-slate-600 mb-6">
                        Your request for <strong className="text-slate-900">{packageTitle}</strong> has been received. Our team will contact you shortly on WhatsApp/phone to confirm details and arrange payment.
                    </p>

                    {/* Pending status banner */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-left flex items-start gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0 animate-pulse" />
                        <p className="text-sm text-yellow-800">
                            <strong>Status: Pending Confirmation.</strong> No payment has been taken yet. You only pay once our team confirms your booking.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-200">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Booking ID</span>
                            <span className="font-mono font-bold text-slate-900">{bookingId}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Estimated Total</span>
                            <span className="font-bold text-slate-900">₹{totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Trip Date</span>
                            <span className="font-bold text-slate-900">{date ? new Date(date).toLocaleDateString() : 'TBD'}</span>
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
                                <p className="font-bold text-purple-900">Email Updates</p>
                                <p className="text-sm text-purple-700">Confirmation will be emailed once approved</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-left">
                        <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Smartphone size={20} />
                            What happens next?
                        </h3>
                        <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
                            <li>Our team reviews your booking request.</li>
                            <li>We contact you on WhatsApp/phone to confirm availability & details.</li>
                            <li>Once confirmed, we share secure payment options.</li>
                            <li>Your trip is booked — get ready for the adventure! 🏔️</li>
                        </ol>
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
