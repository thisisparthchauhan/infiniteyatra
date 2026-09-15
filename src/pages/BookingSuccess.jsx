import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, MessageCircle, Mail, ArrowRight, Home, Smartphone, Copy, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMyBooking } from '../services/packageBookingApi';
import {
    ensureBookingSummary,
    downloadBookingSummary,
    toSummaryMessage,
} from '../services/packageBookingSummaryApi';
import BookingDocumentsUpload from '../components/booking/BookingDocumentsUpload';

const BookingSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // PB-2: the booking arrives in router state on the happy path, but that is
    // lost on refresh or a revisit. The id is also carried in the URL so the
    // page can re-fetch the booking through the authenticated own-booking API.
    const idFromUrl = searchParams.get('id');

    const [booking, setBooking] = useState(location.state?.booking || null);
    // Derived at mount rather than set inside the effect, so the first render
    // already shows the loading state instead of flashing "no booking found".
    const [loadingBooking, setLoadingBooking] = useState(
        () => !location.state?.booking && !!idFromUrl,
    );
    const [loadError, setLoadError] = useState('');

    const bookingIdToLoad = booking?.id || idFromUrl || location.state?.bookingId || null;

    useEffect(() => {
        if (booking || !idFromUrl) return;
        let cancelled = false;
        getMyBooking(idFromUrl)
            .then(({ booking: fetched }) => { if (!cancelled) setBooking(fetched); })
            .catch(() => { if (!cancelled) setLoadError('We could not load this booking. Please sign in and try again.'); })
            .finally(() => { if (!cancelled) setLoadingBooking(false); });
        return () => { cancelled = true; };
    }, [idFromUrl, booking]);

    const minor = booking?.pricing?.minorUnitsPerMajor || 100;
    const bookingId = booking?.id || bookingIdToLoad;
    const bookingReference = booking?.bookingReference || null;
    const packageTitle = booking?.package?.title ?? location.state?.packageTitle;
    const totalAmount = booking ? booking.pricing.grossAmountMinor / minor : location.state?.totalAmount;
    const date = booking?.departureDate ?? location.state?.date;
    const paymentStatus = booking?.payment?.paymentStatus || 'UNPAID';
    const [documentStatus, setDocumentStatus] = useState(booking?.documentStatus || 'PENDING');


    // PB-4: the Booking Summary is generated and stored server-side from the
    // canonical booking record. The browser no longer composes a financial
    // document from whatever happens to be in memory.
    const [summary, setSummary] = useState(null);
    const [summaryError, setSummaryError] = useState('');
    const [downloading, setDownloading] = useState(false);

    // CUTOVER - the server states what this booking can do. Storage-backed
    // features are off until the production bucket exists, and a legacy booking
    // can never have them. Defaulting to `true` here would mean asking for a
    // summary that cannot be produced and offering an upload that cannot work.
    // Absent capabilities are treated as OFF, so an older API response degrades
    // to "unavailable" rather than to a broken control.
    const canBookingSummary = booking?.capabilities?.bookingSummary === true;
    const canDocumentUpload = booking?.capabilities?.documentUpload === true;
    const isLegacyBooking = booking?.legacy === true;

    useEffect(() => {
        if (!booking?.id || !canBookingSummary) return;
        let cancelled = false;
        // Safe to call on every view: an unchanged booking reuses its existing
        // summary and consumes no new number.
        ensureBookingSummary(booking.id)
            .then(({ summary: s }) => { if (!cancelled) { setSummary(s); setSummaryError(''); } })
            .catch((err) => { if (!cancelled) setSummaryError(toSummaryMessage(err)); });
        return () => { cancelled = true; };
    }, [booking?.id, canBookingSummary]);

    const handleDownloadSummary = async () => {
        if (!booking?.id) return;
        setDownloading(true);
        setSummaryError('');
        try {
            await downloadBookingSummary(booking.id, summary?.summaryNumber);
        } catch (err) {
            setSummaryError(toSummaryMessage(err));
        } finally {
            setDownloading(false);
        }
    };

    // The summary is downloaded on request, not forced on the customer.
    // PB-4 replaces this with the formal Booking Summary / Provisional Invoice.

    if (loadingBooking) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <Loader className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-600">Loading your booking…</p>
            </div>
        );
    }

    if (!bookingId || loadError) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">
                    {loadError ? 'Booking unavailable' : 'No booking found'}
                </h2>
                {loadError && <p className="text-slate-600 mb-4 max-w-md">{loadError}</p>}
                <div className="flex gap-4">
                    <Link to="/my-bookings" className="text-blue-600 hover:underline">My Bookings</Link>
                    <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
                </div>
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
                        {bookingReference && (
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                                <span className="text-slate-500 text-sm">Booking Reference</span>
                                <span className="font-mono font-bold text-slate-900 text-lg">{bookingReference}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Booking ID</span>
                            <span className="font-mono text-xs text-slate-600">{bookingId}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Total Amount</span>
                            <span className="font-bold text-slate-900">₹{totalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Documents</span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {documentStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm">Payment Status</span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                {paymentStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 text-sm">Trip Date</span>
                            <span className="font-bold text-slate-900">{date ? new Date(date).toLocaleDateString() : 'TBD'}</span>
                        </div>
                    </div>

                    {booking?.id && canDocumentUpload && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 text-left">
                            <BookingDocumentsUpload
                                bookingId={booking.id}
                                travellers={booking.travellers || []}
                                onStatusChange={setDocumentStatus}
                            />
                        </div>
                    )}

                    {/* CUTOVER - no upload control is rendered at all when the
                        capability is off. A disabled passport/Aadhaar field would
                        read as a fault, and worse, would invite someone to try. */}
                    {booking?.id && !canDocumentUpload && !isLegacyBooking && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left">
                            <p className="text-sm text-slate-600">
                                Traveller document upload isn&apos;t available yet. Our team will collect
                                any documents you need to provide when they confirm your trip.
                            </p>
                        </div>
                    )}

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

                    {summaryError && (
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-sm text-amber-800">
                            {summaryError}
                        </div>
                    )}

                    {summary?.summaryNumber && (
                        <p className="mt-6 text-xs text-slate-500 text-left">
                            Summary Number <span className="font-mono font-bold text-slate-700">{summary.summaryNumber}</span>
                            {summary.version > 1 && <span> · version {summary.version}</span>}
                        </p>
                    )}

                    <div className="mt-4 flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleDownloadSummary}
                            disabled={downloading || !summary}
                            className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading
                                ? <><Loader size={20} className="animate-spin" /> Preparing…</>
                                : <><Download size={20} /> Download Booking Summary</>}
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
