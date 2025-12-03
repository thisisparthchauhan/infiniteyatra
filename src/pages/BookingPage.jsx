import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, User, Mail, Phone, CheckCircle, ArrowRight, ArrowLeft, Loader } from 'lucide-react';
import { getPackageById } from '../data/packages';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [pkg, setPkg] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmedBookingId, setConfirmedBookingId] = useState(null);
    const [error, setError] = useState('');

    const [bookingData, setBookingData] = useState({
        date: '',

        travelers: 2,
        name: '',
        email: '',
        phone: '',
        specialRequests: ''
    });

    useEffect(() => {
        const packageData = getPackageById(id);
        if (packageData) {
            setPkg(packageData);
            setLoading(false);
            // Pre-fill user data if available
            if (currentUser) {
                setBookingData(prev => ({
                    ...prev,
                    email: currentUser.email || '',
                    name: currentUser.displayName || ''
                }));
            }
        } else {
            navigate('/');
        }
    }, [id, navigate, currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleConfirm = async () => {
        if (!currentUser) return;

        setSubmitting(true);
        try {
            const bookingRef = await addDoc(collection(db, 'bookings'), {
                userId: currentUser.uid,
                packageId: pkg.id,
                packageTitle: pkg.title,
                bookingDate: bookingData.date,

                travelers: Number(bookingData.travelers),
                contactName: bookingData.name,
                contactEmail: bookingData.email,
                contactPhone: bookingData.phone,
                specialRequests: bookingData.specialRequests,
                totalPrice: pkg.price * Number(bookingData.travelers),
                status: 'pending',
                createdAt: serverTimestamp()
            });

            setConfirmedBookingId(bookingRef.id);

            // Redirect to WhatsApp
            const message = `*Booking Confirmation*\n\n*Booking ID:* ${bookingRef.id}\n*Package:* ${pkg.title}\n*Date:* ${bookingData.date}\n*Travelers:* ${bookingData.travelers}\n*Name:* ${bookingData.name}\n\n--------------------------------\nSent via Infinite Yatra Website`;
            const whatsappUrl = `https://wa.me/919265799325?text=${encodeURIComponent(message)}`;

            // Try to open in new tab, if blocked, the user can click the button in the next step
            const newWindow = window.open(whatsappUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                console.log("Popup blocked, user needs to click manually");
            }

            nextStep();
        } catch (error) {
            console.error("Error saving booking:", error);
            setError("Failed to save booking. Please try again or contact support.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWhatsAppShare = () => {
        const message = `*Booking Confirmation*\n\n*Booking ID:* ${confirmedBookingId}\n*Package:* ${pkg.title}\n*Date:* ${bookingData.date}\n*Travelers:* ${bookingData.travelers}\n*Name:* ${bookingData.name}\n\n--------------------------------\nSent via Infinite Yatra Website`;
        const whatsappUrl = `https://wa.me/919265799325?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-24 px-6">
            <div className="max-w-3xl mx-auto">
                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-200 -z-10"></div>
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {s}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm font-medium text-slate-600">
                        <span>Selection</span>
                        <span>Details</span>
                        <span>Confirmation</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{pkg.title}</h1>
                        <p className="text-slate-500 mb-8">Complete your booking details below</p>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                                                {pkg.type === 'fixed' ? (
                                                    <select
                                                        name="date"
                                                        value={bookingData.date}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                                    >
                                                        <option value="">Select a departure date</option>
                                                        {pkg.availableDates?.map((date) => (
                                                            <option key={date} value={date}>
                                                                {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : pkg.type === 'mixed' ? (
                                                    <div className="space-y-3">
                                                        <select
                                                            name="date"
                                                            value={bookingData.date}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                                                        >
                                                            <option value="">Select a Group Departure</option>
                                                            {pkg.availableDates?.map((date) => (
                                                                <option key={date} value={date}>
                                                                    {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="text-center text-sm text-slate-500">- OR -</div>
                                                        <input
                                                            type="date"
                                                            name="date"
                                                            value={bookingData.date}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                            placeholder="Choose Custom Date"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={bookingData.date}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                )}
                                            </div>
                                            {pkg.type === 'fixed' && (
                                                <p className="text-xs text-blue-600 mt-2 font-medium">
                                                    * This is a fixed departure group tour
                                                </p>
                                            )}
                                            {pkg.type === 'mixed' && (
                                                <p className="text-xs text-blue-600 mt-2 font-medium">
                                                    * Choose a group departure or your own custom date
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Travelers</label>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-3 text-slate-400" size={18} />
                                                <input
                                                    type="number"
                                                    name="travelers"
                                                    min="1"
                                                    value={bookingData.travelers}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>



                                    <div className="flex justify-end pt-6">
                                        <button
                                            onClick={nextStep}
                                            disabled={!bookingData.date}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            Next Step <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Full Name"
                                                value={bookingData.name}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Email Address"
                                                value={bookingData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="Phone Number"
                                                value={bookingData.phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                name="specialRequests"
                                                placeholder="Any special requests? (Dietary, accessibility, etc.)"
                                                value={bookingData.specialRequests}
                                                onChange={handleInputChange}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-6">
                                        <button
                                            onClick={prevStep}
                                            className="text-slate-600 font-semibold hover:text-slate-900 flex items-center gap-2"
                                        >
                                            <ArrowLeft size={20} /> Back
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={!bookingData.name || !bookingData.email || !bookingData.phone || submitting}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader className="animate-spin" size={20} /> Processing...
                                                </>
                                            ) : (
                                                'Confirm Booking'
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="text-green-600" size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                                    <p className="text-slate-500 mb-8">Your trip to {pkg.title} has been successfully booked.</p>

                                    <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left max-w-md mx-auto border border-slate-200">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-500">Booking ID</span>
                                            <span className="font-mono font-bold text-slate-900">{confirmedBookingId}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-500">Date</span>
                                            <span className="font-medium text-slate-900">{bookingData.date}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-500">Travelers</span>
                                            <span className="font-medium text-slate-900">{bookingData.travelers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Amount Due</span>
                                            <span className="font-bold text-blue-600">₹{(pkg.price * Number(bookingData.travelers)).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleWhatsAppShare}
                                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
                                    >
                                        Get Ticket on WhatsApp
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
