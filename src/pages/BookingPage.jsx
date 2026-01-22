import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, User, Mail, Phone, CheckCircle, ArrowRight, ArrowLeft, Loader, CreditCard, Lock, Gift } from 'lucide-react';
import { getPackageById } from '../data/packages';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { sendBookingEmails } from '../services/email';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

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
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [paymentOption, setPaymentOption] = useState('token'); // 'token' or 'full'

    const [bookingData, setBookingData] = useState({
        date: '',

        travelers: 2,
        name: '',
        email: '',
        phone: '',
        specialRequests: '',
        travelersList: [],
        referralCode: '',
        discount: 0
    });

    useEffect(() => {
        setBookingData(prev => {
            const count = Number(prev.travelers) || 1;
            const currentList = prev.travelersList || [];

            if (currentList.length === count) return prev;

            // Resize array while preserving existing data
            const newList = Array(count).fill(null).map((_, i) =>
                currentList[i] || { name: '', age: '', gender: '', mobile: '' }
            );

            return { ...prev, travelersList: newList };
        });
    }, [bookingData.travelers]);

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

    const handlePhoneChange = (value) => {
        setBookingData(prev => ({
            ...prev,
            phone: value
        }));
    };

    const handleTravelerChange = (index, field, value) => {
        setBookingData(prev => {
            const newList = [...prev.travelersList];
            if (field === 'mobile') {
                newList[index] = { ...newList[index], mobile: value };
            } else {
                newList[index] = { ...newList[index], [field]: value };
            }
            return { ...prev, travelersList: newList };
        });
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const checkAvailability = async (packageId, date, requestedSlots) => {
        try {
            const q = query(
                collection(db, 'bookings'),
                where('packageId', '==', packageId),
                where('bookingDate', '==', date)
            );
            const querySnapshot = await getDocs(q);
            let totalBooked = 0;
            querySnapshot.docs
                .filter(doc => doc.data().status !== 'cancelled')
                .forEach((doc) => {
                    totalBooked += doc.data().travelers || 0;
                });

            const maxSlots = pkg.maxGroupSize || 12; // Default to 12 if not set
            const remainingSlots = maxSlots - totalBooked;

            if (requestedSlots > remainingSlots) {
                return {
                    available: false,
                    remaining: remainingSlots,
                    message: remainingSlots <= 0
                        ? "Sorry, this date is fully booked."
                        : `Only ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left for this date.`
                };
            }
            return { available: true };
        } catch (error) {
            console.error("Error checking availability:", error);
            // In case of error, you might want to allow or block. 
            // Blocking is safer to prevent overbooking.
            return { available: false, message: "Unable to verify availability. Please try again." };
        }
    };

    const handleConfirm = async () => {
        if (!currentUser) return;

        setSubmitting(true);
        setError(''); // Clear previous errors

        try {
            // 1. Check availability
            const availability = await checkAvailability(pkg.id, bookingData.date, Number(bookingData.travelers));

            if (!availability.available) {
                setError(availability.message);
                setSubmitting(false);
                return;
            }

            // 2. Calculate Amount (in paise for Razorpay)
            // If token payment: 1000 * travelers
            // If full payment: (price * travelers) - discount
            const tokenAmount = pkg.tokenPrice || 1000;
            const amountToPay = paymentOption === 'token'
                ? (tokenAmount * Number(bookingData.travelers))
                : (pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0));

            const totalAmount = pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0);

            // 3. Create "Pending" Booking in Firestore first
            const bookingRef = await addDoc(collection(db, 'bookings'), {
                userId: currentUser.uid,
                packageId: pkg.id,
                packageTitle: pkg.title,
                bookingDate: bookingData.date,
                travelers: Number(bookingData.travelers),
                contactName: bookingData.name,
                contactEmail: bookingData.email,
                contactPhone: bookingData.phone,
                travelersList: bookingData.travelersList,
                specialRequests: bookingData.specialRequests,
                totalPrice: pkg.price * Number(bookingData.travelers),
                paymentType: paymentOption,
                amountPaid: 0, // Initially 0 until payment success
                balanceDue: totalAmount,
                status: 'pending_payment', // Use a temporary status
                createdAt: serverTimestamp()
            });

            // 4. Initialize Razorpay
            const options = {
                key: "rzp_live_S2yg6cwyGDfgjI", // Live Key ID
                amount: amountToPay * 100, // Amount in paise
                currency: "INR",
                name: "Infinite Yatra",
                description: `Booking ID: ${bookingRef.id}`,
                image: "https://your-logo-url.com/logo.png", // Optional: Add your logo URL here
                handler: async function (response) {
                    // 5. On Payment Success
                    try {
                        const paymentId = response.razorpay_payment_id;

                        // Update Booking in Firestore
                        await updateDoc(doc(db, 'bookings', bookingRef.id), {
                            status: 'confirmed',
                            amountPaid: amountToPay,
                            balanceDue: paymentOption === 'token' ? (totalAmount - amountToPay) : 0,
                            paymentId: paymentId,
                            paymentDate: serverTimestamp()
                        });

                        setConfirmedBookingId(bookingRef.id);

                        // Send Emails (Non-blocking)
                        sendBookingEmails({
                            id: bookingRef.id,
                            contactName: bookingData.name,
                            contactEmail: bookingData.email,
                            contactPhone: bookingData.phone,
                            travelersList: bookingData.travelersList,
                            packageTitle: pkg.title,
                            bookingDate: bookingData.date,
                            travelers: Number(bookingData.travelers),
                            totalPrice: pkg.price * Number(bookingData.travelers),
                            specialRequests: bookingData.specialRequests
                        });

                        // Redirect to Success Page
                        navigate('/booking-success', {
                            state: {
                                bookingId: bookingRef.id,
                                packageTitle: pkg.title,
                                amountPaid: amountToPay,
                                totalAmount: totalAmount,
                                date: bookingData.date,
                                paymentOption: paymentOption
                            }
                        });

                    } catch (err) {
                        console.error("Error updating booking after payment:", err);
                        setError("Payment successful but failed to update booking. Please contact support.");
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: bookingData.name,
                    email: bookingData.email,
                    contact: bookingData.phone
                },
                notes: {
                    address: "Infinite Yatra Office"
                },
                theme: {
                    color: "#2563EB"
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                        // Optional: Delete the pending booking or mark as cancelled
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                setError(`Payment Failed: ${response.error.description}`);
                setSubmitting(false);
            });

            rzp1.open();

        } catch (error) {
            console.error("Error initiating booking:", error);
            setError("Failed to initiate booking. Please try again or contact support.");
            setSubmitting(false);
        }
    };

    const handleWhatsAppShare = () => {
        let travelerDetails = bookingData.travelersList.map((t, i) =>
            `Traveler ${i + 1}: ${t.name} (${t.age}, ${t.gender})`
        ).join('\n');

        const message = `*Booking Confirmation*\n\n*Booking ID:* ${confirmedBookingId}\n*Package:* ${pkg.title}\n*Date:* ${bookingData.date}\n*Travelers:* ${bookingData.travelers}\n\n*Primary Contact:*\nName: ${bookingData.name}\nPhone: ${bookingData.phone}\n\n*Traveler Details:*\n${travelerDetails}\n\n--------------------------------\nSent via Infinite Yatra Website`;
        const whatsappUrl = `https://wa.me/919265799325?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const isFormValid = () => {
        const contactValid = bookingData.name && bookingData.email && bookingData.phone;
        const travelersValid = bookingData.travelersList.every(t =>
            t.name && t.age && t.gender && t.mobile
        );
        return contactValid && travelersValid;
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
                        <span>Payment</span>
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
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-slate-900"
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
                                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-slate-900"
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
                                                            min={pkg.validDateRange?.start && pkg.validDateRange.start > new Date().toISOString().split('T')[0] ? pkg.validDateRange.start : new Date().toISOString().split('T')[0]}
                                                            max={pkg.validDateRange?.end}
                                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                                            placeholder="Choose Custom Date"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={bookingData.date}
                                                        onChange={handleInputChange}
                                                        min={pkg.validDateRange?.start && pkg.validDateRange.start > new Date().toISOString().split('T')[0] ? pkg.validDateRange.start : new Date().toISOString().split('T')[0]}
                                                        max={pkg.validDateRange?.end}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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
                                    <div className="space-y-8">
                                        {/* Primary Contact */}
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                                                <User size={20} className="text-blue-600" /> Primary Contact
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        placeholder="Full Name"
                                                        value={bookingData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
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
                                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                                    />
                                                </div>
                                                <div className="relative md:col-span-2">
                                                    <PhoneInput
                                                        country={'in'}
                                                        value={bookingData.phone}
                                                        onChange={handlePhoneChange}
                                                        inputStyle={{
                                                            width: '100%',
                                                            height: '48px',
                                                            fontSize: '16px',
                                                            paddingLeft: '48px',
                                                            borderRadius: '0.5rem',
                                                            border: '1px solid #e2e8f0',
                                                            color: '#0f172a'
                                                        }}
                                                        containerStyle={{
                                                            width: '100%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Travelers Details */}
                                        <div className="space-y-4">
                                            <h3 className="flex items-center gap-2 font-bold text-slate-800">
                                                <Users size={20} className="text-blue-600" /> Traveler Details
                                            </h3>
                                            {bookingData.travelersList.map((traveler, index) => (
                                                <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative">
                                                    <div className="absolute -left-3 top-6 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                                                        {index + 1}
                                                    </div>
                                                    <h4 className="font-semibold text-slate-700 mb-4 pl-4">Traveler {index + 1}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Full Name"
                                                            value={traveler.name}
                                                            onChange={(e) => handleTravelerChange(index, 'name', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                                        />
                                                        <div className="flex gap-4">
                                                            <input
                                                                type="number"
                                                                placeholder="Age"
                                                                value={traveler.age}
                                                                onChange={(e) => handleTravelerChange(index, 'age', e.target.value)}
                                                                className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                                            />
                                                            <select
                                                                value={traveler.gender}
                                                                onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                                                                className="w-1/2 px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-slate-900"
                                                            >
                                                                <option value="">Gender</option>
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <PhoneInput
                                                                country={'in'}
                                                                value={traveler.mobile}
                                                                onChange={(value) => handleTravelerChange(index, 'mobile', value)}
                                                                inputStyle={{
                                                                    width: '100%',
                                                                    height: '48px',
                                                                    fontSize: '16px',
                                                                    paddingLeft: '48px',
                                                                    borderRadius: '0.5rem',
                                                                    border: '1px solid #e2e8f0',
                                                                    color: '#0f172a'
                                                                }}
                                                                containerStyle={{
                                                                    width: '100%'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <textarea
                                                name="specialRequests"
                                                placeholder="Any special requests? (Dietary, accessibility, etc.)"
                                                value={bookingData.specialRequests}
                                                onChange={handleInputChange}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-slate-900"
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
                                            onClick={nextStep}
                                            disabled={!isFormValid()}
                                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            Proceed to Payment <ArrowRight size={20} />
                                        </button>

                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6">Payment Details</h3>

                                        <div className="flex flex-col gap-4 mb-8">
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-slate-200">
                                                <span className="text-slate-600">Package Base Price</span>
                                                <span className="font-medium">₹{pkg.price.toLocaleString()} x {bookingData.travelers}</span>
                                            </div>
                                            {bookingData.discount > 0 && (
                                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200 text-green-700">
                                                    <span className="flex items-center gap-2"><CheckCircle size={16} /> Referral Discount</span>
                                                    <span className="font-bold">- ₹{bookingData.discount}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <span className="text-lg font-bold text-slate-900">Total Amount</span>
                                                <span className="text-2xl font-bold text-blue-600">
                                                    ₹{(pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <h4 className="font-semibold text-slate-700 mb-2">Select Payment Option</h4>

                                            {/* Token Amount Option */}
                                            <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentOption === 'token' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="paymentOption"
                                                    checked={paymentOption === 'token'}
                                                    onChange={() => setPaymentOption('token')}
                                                    className="w-5 h-5 text-blue-600 mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <div className="font-bold text-slate-900">Pay Token Amount</div>
                                                        <div className="font-bold text-blue-600">₹{(1000 * bookingData.travelers).toLocaleString()}</div>
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-1">
                                                        Mandatory to secure your slots (₹1000 per person). Non-refundable.
                                                    </div>
                                                </div>
                                            </label>

                                            {/* Full Amount Option */}
                                            <label className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentOption === 'full' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="paymentOption"
                                                    checked={paymentOption === 'full'}
                                                    onChange={() => setPaymentOption('full')}
                                                    className="w-5 h-5 text-blue-600 mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <div className="font-bold text-slate-900">Pay Full Amount</div>
                                                        <div className="font-bold text-blue-600">
                                                            ₹{(pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-500 mt-1">
                                                        Clear all dues now.
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Summary of what is being paid */}
                                        <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl shadow-lg mt-4">
                                            <div>
                                                <div className="text-slate-400 text-sm">Amount Payable Now</div>
                                                <div className="text-2xl font-bold">
                                                    ₹{paymentOption === 'token'
                                                        ? (1000 * bookingData.travelers).toLocaleString()
                                                        : (pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)).toLocaleString()
                                                    }
                                                </div>
                                            </div>
                                            {paymentOption === 'token' && (
                                                <div className="text-right">
                                                    <div className="text-slate-400 text-xs">Balance Due</div>
                                                    <div className="font-medium">
                                                        ₹{((pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)) - (1000 * bookingData.travelers)).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Cancellation Policy */}
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
                                            <h5 className="font-bold text-slate-800 mb-2">Cancellation & Refund Policy</h5>
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li><strong>Token Amount (₹1000/person):</strong> Non-Refundable & Non-Transferable.</li>
                                                <li><strong>Full Payment Refund:</strong>
                                                    <ul className="list-[circle] pl-4 mt-1 space-y-1">
                                                        <li>Cancelled <strong>&gt;7 days</strong> before trip: Full Refund minus token charges.</li>
                                                        <li>Cancelled <strong>&lt;7 days</strong> before trip: 50% Refund only.</li>
                                                    </ul>
                                                </li>
                                            </ul>
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="terms-checkbox"
                                                            type="checkbox"
                                                            checked={agreedToTerms}
                                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </div>
                                                    <label htmlFor="terms-checkbox" className="text-sm text-slate-700 cursor-pointer select-none">
                                                        I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Terms & Conditions</a>, Cancellation Policy, and Trip Rules.
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-6">
                                        <button
                                            onClick={prevStep}
                                            className="text-slate-600 font-semibold hover:text-slate-900 flex items-center gap-2"
                                        >
                                            <ArrowLeft size={20} /> Back
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={submitting || !agreedToTerms}
                                            className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader className="animate-spin" size={20} /> Processing...
                                                </>
                                            ) : (
                                                <>Pay Now <CheckCircle size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
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
        </div >
    );
};

export default BookingPage;
