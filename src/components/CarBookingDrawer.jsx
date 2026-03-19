import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, Navigation, Calendar, Clock, ArrowRight, User, Phone, Mail,
    CheckCircle2, ChevronLeft, Plus, Trash2, Users, Car, AlertTriangle,
    Check, MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveCars, addCarBooking } from '../services/carService';
import { addCredits } from '../services/passportService';

export default function CarBookingDrawer({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [availableCars, setAvailableCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        pickupLocation: '',
        stops: [],
        dropLocation: '',
        travelDate: '',
        pickupTime: '',
        isRoundTrip: false,
        returnDate: '',
        totalPassengers: 1,
        selectedCar: null,
        selectedPricingType: null,
        specialRequests: ''
    });

    // Fetch active cars when reaching step 3
    useEffect(() => {
        if (step === 3 && availableCars.length === 0) {
            setLoadingCars(true);
            getActiveCars()
                .then(cars => setAvailableCars(cars))
                .catch(err => console.error('Failed to fetch cars:', err))
                .finally(() => setLoadingCars(false));
        }
    }, [step]);

    if (!isOpen) return null;

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleAddStop = () => {
        if (formData.stops.length < 5) {
            setFormData({ ...formData, stops: [...formData.stops, ''] });
        }
    };

    const handleRemoveStop = (index) => {
        const newStops = [...formData.stops];
        newStops.splice(index, 1);
        setFormData({ ...formData, stops: newStops });
    };

    const handleStopChange = (index, value) => {
        const newStops = [...formData.stops];
        newStops[index] = value;
        setFormData({ ...formData, stops: newStops });
    };

    const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    // ── Smart Car Allocation ──
    const getCarAllocation = () => {
        const car = formData.selectedCar;
        if (!car) return null;

        const passengers = formData.totalPassengers;
        const carsNeeded = Math.ceil(passengers / car.seatingCapacity);
        const passengersPerCar = Math.ceil(passengers / carsNeeded);

        // Get the price for the selected pricing type
        let pricePerUnit = 0;
        let pricingLabel = '';
        const pt = formData.selectedPricingType || car.pricing?.pricingType;

        if (pt === 'perKm' || (pt === 'all' && formData.selectedPricingType === 'perKm')) {
            pricePerUnit = car.pricing?.perKm || 0;
            pricingLabel = '/ km';
        } else if (pt === 'perDay' || (pt === 'all' && formData.selectedPricingType === 'perDay')) {
            pricePerUnit = car.pricing?.perDay || 0;
            pricingLabel = '/ day';
        } else if (pt === 'perTrip' || (pt === 'all' && formData.selectedPricingType === 'perTrip')) {
            pricePerUnit = car.pricing?.perTrip || 0;
            pricingLabel = '/ trip';
        } else {
            // Default to first available pricing
            if (car.pricing?.perKm) { pricePerUnit = car.pricing.perKm; pricingLabel = '/ km'; }
            else if (car.pricing?.perDay) { pricePerUnit = car.pricing.perDay; pricingLabel = '/ day'; }
            else if (car.pricing?.perTrip) { pricePerUnit = car.pricing.perTrip; pricingLabel = '/ trip'; }
        }

        const estimatedFare = pricePerUnit * carsNeeded;
        const fitsInOne = car.seatingCapacity >= passengers;

        return {
            carsNeeded,
            passengersPerCar,
            fitsInOne,
            pricePerUnit,
            pricingLabel,
            estimatedFare,
            pricingType: formData.selectedPricingType || pt
        };
    };

    const allocation = getCarAllocation();

    // Build booking data for summary
    const totalEstimatedFare = allocation ? allocation.estimatedFare : 0;
    const advanceAmount = Math.round(totalEstimatedFare * 0.20);

    // ── Submit Booking ──
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const car = formData.selectedCar;
            const alloc = getCarAllocation();

            const selectedCars = [{
                carId: car.id,
                carName: car.name,
                carType: car.type,
                seatingCapacity: car.seatingCapacity,
                passengersAllocated: formData.totalPassengers,
                pricingType: alloc.pricingType,
                estimatedFare: alloc.estimatedFare
            }];

            const bookingData = {
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                customerEmail: formData.customerEmail,
                pickupLocation: formData.pickupLocation,
                stops: formData.stops.filter(s => s.trim() !== ''),
                dropLocation: formData.dropLocation,
                travelDate: formData.travelDate,
                pickupTime: formData.pickupTime,
                isRoundTrip: formData.isRoundTrip,
                returnDate: formData.isRoundTrip ? formData.returnDate : null,
                totalPassengers: formData.totalPassengers,
                selectedCars,
                totalCars: alloc.carsNeeded,
                totalEstimatedFare: alloc.estimatedFare,
                advanceAmount: Math.round(alloc.estimatedFare * 0.20),
                specialRequests: formData.specialRequests
            };

            const result = await addCarBooking(bookingData);
            setBookingResult(result);

            // Award passport credits
            if (currentUser?.uid) {
                try {
                    await addCredits(currentUser.uid, 'car_booking', `Car booking: ${car.name}`, 50, result.id);
                } catch (e) { console.log('Passport credit skip:', e); }
            }
        } catch (err) {
            console.error('Booking failed:', err);
            setBookingResult({ bookingRef: 'IY-CAR-' + Math.floor(1000 + Math.random() * 9000) });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── WhatsApp message ──
    const getWhatsAppLink = () => {
        const alloc = getCarAllocation();
        const car = formData.selectedCar;
        const msg = `Hi Infinite Yatra! 🚗\n\nI just booked a car:\n📋 Ref: ${bookingResult?.bookingRef}\n🚗 ${alloc?.carsNeeded || 1} × ${car?.name}\n👥 ${formData.totalPassengers} passengers\n📍 ${formData.pickupLocation} → ${formData.dropLocation}\n📅 ${formData.travelDate} at ${formData.pickupTime}\n💰 Advance: ₹${advanceAmount.toLocaleString('en-IN')}\n\nPlease confirm my booking!`;
        return `https://wa.me/919265799325?text=${encodeURIComponent(msg)}`;
    };

    // ── Today's date for min ──
    const today = new Date().toISOString().split('T')[0];

    // ── Step progress indicator ──
    const renderStepIcon = (num) => {
        const isActive = step === num;
        const isCompleted = step > num || bookingResult;
        return (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${isActive ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                    isCompleted ? 'bg-green-500/20 text-green-500 border-green-500/50' : 'border-gray-700 text-gray-500'}
            `}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : num}
            </div>
        );
    };

    // ── Car pricing display ──
    const renderCarPricing = (car) => {
        const p = car.pricing;
        if (!p) return <span className="text-slate-500">Price TBD</span>;

        if (p.pricingType === 'all') {
            return (
                <div className="flex flex-wrap gap-1.5">
                    {p.perKm && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">₹{p.perKm}/km</span>}
                    {p.perDay && <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">₹{p.perDay}/day</span>}
                    {p.perTrip && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">₹{p.perTrip}/trip</span>}
                </div>
            );
        }

        if (p.pricingType === 'perKm' && p.perKm) return <span className="text-blue-400 font-bold">₹{p.perKm} / km</span>;
        if (p.pricingType === 'perDay' && p.perDay) return <span className="text-purple-400 font-bold">₹{p.perDay} / day</span>;
        if (p.pricingType === 'perTrip' && p.perTrip) return <span className="text-green-400 font-bold">₹{p.perTrip} / trip</span>;

        return <span className="text-slate-500">Price TBD</span>;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-end">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm"
                />

                {/* Drawer */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full md:w-[620px] h-full bg-[#111118] border-l border-gray-800 flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-[#111118]/90 backdrop-blur-md px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            {step > 1 && !bookingResult && (
                                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Car className="w-5 h-5 text-blue-400" /> Book Car <span className="text-blue-400">With Driver</span>
                                </h2>
                                {!bookingResult && (
                                    <p className="text-sm text-gray-500">Step {step} of 5</p>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    {!bookingResult && (
                        <div className="px-6 py-4 border-b border-gray-800/50 flex justify-between relative shrink-0">
                            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-800 -translate-y-1/2 -z-10"></div>
                            {[1, 2, 3, 4, 5].map(num => (
                                <React.Fragment key={num}>{renderStepIcon(num)}</React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1 text-gray-200 overflow-y-auto hide-scrollbar w-full">
                        <AnimatePresence mode="wait">

                            {/* ═══ SUCCESS STATE ═══ */}
                            {bookingResult ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center text-center py-12"
                                >
                                    {/* Animated checkmark */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                        className="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(34,197,94,0.3)] border border-green-500/50"
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                                        >
                                            <CheckCircle2 className="w-14 h-14 text-green-500" />
                                        </motion.div>
                                    </motion.div>

                                    <h3 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h3>
                                    <p className="text-gray-400 mb-6">Your car booking has been received.</p>

                                    <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-6 w-full max-w-sm mb-4">
                                        <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
                                        <p className="font-mono text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                            {bookingResult.bookingRef}
                                        </p>
                                    </div>

                                    <p className="text-sm text-gray-400 mb-8 max-w-sm">
                                        Our team will call you within <strong className="text-white">2 hours</strong> to confirm your ride.
                                    </p>

                                    <a
                                        href={getWhatsAppLink()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg transition-colors mb-3"
                                    >
                                        <MessageCircle className="w-5 h-5" /> Chat with us on WhatsApp
                                    </a>

                                    <button
                                        onClick={onClose}
                                        className="w-full max-w-sm py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium transition-colors"
                                    >
                                        Done
                                    </button>
                                </motion.div>

                            ) : step === 1 ? (
                                /* ═══ STEP 1: BASIC INFO ═══ */
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <User className="text-gray-400" /> Your Details & Route
                                    </h3>

                                    {/* Name & Phone */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name *</label>
                                            <input
                                                type="text"
                                                value={formData.customerName}
                                                onChange={e => update('customerName', e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Phone *</label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-800 bg-[#151520] text-gray-400 text-sm">+91</span>
                                                <input
                                                    type="tel"
                                                    value={formData.customerPhone}
                                                    onChange={e => update('customerPhone', e.target.value)}
                                                    placeholder="98765 43210"
                                                    className="flex-1 min-w-0 rounded-r-xl bg-[#1a1a24] border border-gray-800 px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Email (Optional)</label>
                                        <input
                                            type="email"
                                            value={formData.customerEmail}
                                            onChange={e => update('customerEmail', e.target.value)}
                                            placeholder="john@example.com"
                                            className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Route planner */}
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                        <MapPin className="text-blue-400 w-5 h-5" /> Route
                                    </h4>

                                    <div className="relative pl-8 mb-6">
                                        <div className="absolute top-6 bottom-6 left-[11px] border-l-2 border-dashed border-gray-700 w-0"></div>

                                        {/* Pickup */}
                                        <div className="mb-5 relative">
                                            <div className="absolute top-1/2 -left-8 w-6 h-6 rounded-full border-4 border-[#111118] bg-green-500 -translate-y-1/2 z-10"></div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Pickup Location (A)</label>
                                            <input
                                                type="text"
                                                value={formData.pickupLocation}
                                                onChange={e => update('pickupLocation', e.target.value)}
                                                placeholder="Enter pickup point"
                                                className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>

                                        {/* Stops */}
                                        <AnimatePresence>
                                            {formData.stops.map((stop, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mb-5 relative"
                                                >
                                                    <div className="absolute top-1/2 -left-[30px] w-5 h-5 rounded-full border-4 border-[#111118] bg-yellow-500 -translate-y-1/2 z-10"></div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Stop {String.fromCharCode(66 + i)}</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={stop}
                                                            onChange={e => handleStopChange(i, e.target.value)}
                                                            placeholder="Enter intermediate stop"
                                                            className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                                        />
                                                        <button onClick={() => handleRemoveStop(i)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {formData.stops.length < 5 && (
                                            <button
                                                onClick={handleAddStop}
                                                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-5 py-2 px-4 border border-gray-800 rounded-xl bg-[#151520] hover:bg-gray-800 transition"
                                            >
                                                <Plus className="w-4 h-4" /> Add Stop
                                            </button>
                                        )}

                                        {/* Drop */}
                                        <div className="relative">
                                            <div className="absolute top-1/2 -left-8 w-6 h-6 rounded-full border-4 border-[#111118] bg-gradient-to-r from-blue-500 to-purple-500 -translate-y-1/2 z-10"></div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Drop Location (Final)</label>
                                            <input
                                                type="text"
                                                value={formData.dropLocation}
                                                onChange={e => update('dropLocation', e.target.value)}
                                                placeholder="Enter destination"
                                                className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Date, Time, Round Trip */}
                                    <div className="grid grid-cols-2 gap-4 mb-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Travel Date *</label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={formData.travelDate}
                                                onChange={e => update('travelDate', e.target.value)}
                                                className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Pickup Time *</label>
                                            <input
                                                type="time"
                                                value={formData.pickupTime}
                                                onChange={e => update('pickupTime', e.target.value)}
                                                className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Round Trip Toggle */}
                                    <div
                                        className="flex items-center justify-between p-4 bg-[#1a1a24] border border-gray-800 rounded-xl mb-5 cursor-pointer"
                                        onClick={() => update('isRoundTrip', !formData.isRoundTrip)}
                                    >
                                        <div>
                                            <h4 className="font-medium text-white">Round Trip?</h4>
                                            <p className="text-sm text-gray-500">Need to return to your pickup location?</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${formData.isRoundTrip ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-700'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formData.isRoundTrip ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {formData.isRoundTrip && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Return Date</label>
                                                <input
                                                    type="date"
                                                    min={formData.travelDate || today}
                                                    value={formData.returnDate}
                                                    onChange={e => update('returnDate', e.target.value)}
                                                    className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        disabled={!formData.customerName || !formData.customerPhone || !formData.pickupLocation || !formData.dropLocation || !formData.travelDate || !formData.pickupTime}
                                        onClick={handleNext}
                                        className="w-full mt-4 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all"
                                    >
                                        Continue <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </motion.div>

                            ) : step === 2 ? (
                                /* ═══ STEP 2: PASSENGERS ═══ */
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <Users className="text-gray-400" /> How many passengers?
                                    </h3>

                                    {/* Large Stepper */}
                                    <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-8 mb-6 text-center">
                                        <p className="text-gray-400 text-sm mb-4">Total Passengers</p>
                                        <div className="flex items-center justify-center gap-6">
                                            <button
                                                onClick={() => update('totalPassengers', Math.max(1, formData.totalPassengers - 1))}
                                                className="w-14 h-14 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl text-white text-2xl font-bold transition"
                                            >
                                                −
                                            </button>
                                            <span className="text-5xl font-black text-white tabular-nums w-20 text-center">{formData.totalPassengers}</span>
                                            <button
                                                onClick={() => update('totalPassengers', Math.min(100, formData.totalPassengers + 1))}
                                                className="w-14 h-14 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl text-white text-2xl font-bold transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Safety Warning */}
                                    {formData.totalPassengers > 4 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6"
                                        >
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-yellow-400 font-bold text-sm mb-1">Safety Notice</p>
                                                    <p className="text-yellow-500/80 text-xs leading-relaxed">
                                                        For passenger safety and traffic regulations, we allocate the right number of vehicles.
                                                        Overloading vehicles is illegal under Motor Vehicles Act.
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        className="w-full mt-4 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all"
                                    >
                                        Choose Your Car <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </motion.div>

                            ) : step === 3 ? (
                                /* ═══ STEP 3: CAR SELECTION ═══ */
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        <Car className="text-blue-400" /> Select Your Car
                                    </h3>
                                    <p className="text-gray-500 text-sm mb-6">Choose a car for {formData.totalPassengers} passenger{formData.totalPassengers > 1 ? 's' : ''}</p>

                                    {loadingCars ? (
                                        <div className="flex justify-center py-20">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : availableCars.length === 0 ? (
                                        <div className="text-center py-16">
                                            <Car className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                            <p className="text-gray-400 font-bold">No cars available right now</p>
                                            <p className="text-gray-500 text-sm">Please try again later.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {availableCars.map(car => {
                                                const isSelected = formData.selectedCar?.id === car.id;
                                                const carsNeeded = Math.ceil(formData.totalPassengers / car.seatingCapacity);
                                                const fitsInOne = car.seatingCapacity >= formData.totalPassengers;

                                                return (
                                                    <div
                                                        key={car.id}
                                                        onClick={() => {
                                                            update('selectedCar', car);
                                                            // Auto-select pricing type for non-"all" cars
                                                            if (car.pricing?.pricingType !== 'all') {
                                                                update('selectedPricingType', car.pricing?.pricingType);
                                                            }
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                                            : 'border-gray-800 bg-[#1a1a24] hover:border-gray-600'
                                                        }`}
                                                    >
                                                        <div className="flex gap-4">
                                                            {/* Car Photo */}
                                                            <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-900 shrink-0">
                                                                {car.photos?.[0] ? (
                                                                    <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Car className="w-8 h-8 text-gray-700" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Car Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-bold text-white truncate">{car.name}</h4>
                                                                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase font-bold shrink-0">
                                                                        {car.type}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Users className="w-3.5 h-3.5" /> {car.seatingCapacity} seats
                                                                    </span>
                                                                    {car.city && (
                                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <MapPin className="w-3 h-3" /> {car.city}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Feature pills */}
                                                                {car.features?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                                        {car.features.slice(0, 4).map((f, i) => (
                                                                            <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10">{f}</span>
                                                                        ))}
                                                                        {car.features.length > 4 && (
                                                                            <span className="text-[10px] text-gray-500">+{car.features.length - 4}</span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Pricing */}
                                                                <div className="text-sm">{renderCarPricing(car)}</div>
                                                            </div>

                                                            {/* Check indicator */}
                                                            {isSelected && (
                                                                <div className="shrink-0 mt-1">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                                        <Check className="w-4 h-4 text-white" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Pricing type selector for "all" pricing */}
                                                        {isSelected && car.pricing?.pricingType === 'all' && (
                                                            <div className="mt-3 pt-3 border-t border-gray-800">
                                                                <p className="text-xs text-gray-500 mb-2 font-bold">Choose your pricing:</p>
                                                                <div className="flex gap-2">
                                                                    {car.pricing.perKm && (
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); update('selectedPricingType', 'perKm'); }}
                                                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${formData.selectedPricingType === 'perKm' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                                                        >
                                                                            ₹{car.pricing.perKm}/km
                                                                        </button>
                                                                    )}
                                                                    {car.pricing.perDay && (
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); update('selectedPricingType', 'perDay'); }}
                                                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${formData.selectedPricingType === 'perDay' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                                                        >
                                                                            ₹{car.pricing.perDay}/day
                                                                        </button>
                                                                    )}
                                                                    {car.pricing.perTrip && (
                                                                        <button
                                                                            onClick={e => { e.stopPropagation(); update('selectedPricingType', 'perTrip'); }}
                                                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${formData.selectedPricingType === 'perTrip' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                                                        >
                                                                            ₹{car.pricing.perTrip}/trip
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Allocation info */}
                                                        {isSelected && (
                                                            <div className="mt-3">
                                                                {fitsInOne ? (
                                                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                                                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                                        <p className="text-green-400 text-sm font-medium">✓ 1 car fits all {formData.totalPassengers} passenger{formData.totalPassengers > 1 ? 's' : ''}</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                                                        <p className="text-yellow-400 text-sm font-medium">
                                                                            Since you have {formData.totalPassengers} passengers, we'll book <strong>{carsNeeded} cars</strong> of this type.
                                                                        </p>
                                                                        {allocation && (
                                                                            <p className="text-yellow-500/70 text-xs mt-1">
                                                                                Total: {carsNeeded} × {car.name} = ₹{allocation.estimatedFare.toLocaleString('en-IN')} {allocation.pricingLabel}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <button
                                        disabled={!formData.selectedCar || (formData.selectedCar?.pricing?.pricingType === 'all' && !formData.selectedPricingType)}
                                        onClick={handleNext}
                                        className="w-full mt-6 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all"
                                    >
                                        Review Summary <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </motion.div>

                            ) : step === 4 ? (
                                /* ═══ STEP 4: SUMMARY ═══ */
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <CheckCircle2 className="text-blue-400" /> Booking Summary
                                    </h3>

                                    {/* Customer Info */}
                                    <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-5 mb-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Customer</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-500" /> <span className="text-white font-medium">{formData.customerName}</span></div>
                                            <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-500" /> <span className="text-gray-300">+91 {formData.customerPhone}</span></div>
                                            {formData.customerEmail && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-500" /> <span className="text-gray-300">{formData.customerEmail}</span></div>}
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-5 mb-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Route</h4>
                                        <div className="relative pl-6 space-y-0">
                                            <div className="absolute top-2 bottom-2 left-[7px] border-l-2 border-dashed border-gray-700"></div>
                                            <div className="relative pb-3">
                                                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-[#1a1a24]"></div>
                                                <p className="text-white font-medium text-sm">{formData.pickupLocation}</p>
                                            </div>
                                            {formData.stops.filter(s => s.trim()).map((stop, i) => (
                                                <div key={i} className="relative pb-3">
                                                    <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-yellow-500 border-2 border-[#1a1a24]"></div>
                                                    <p className="text-gray-300 text-sm">{stop}</p>
                                                </div>
                                            ))}
                                            <div className="relative">
                                                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-[#1a1a24]"></div>
                                                <p className="text-white font-medium text-sm">{formData.dropLocation}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trip Details */}
                                    <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-5 mb-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Travel Date</p>
                                                <p className="text-white font-medium text-sm">{formData.travelDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Pickup Time</p>
                                                <p className="text-white font-medium text-sm">{formData.pickupTime}</p>
                                            </div>
                                            {formData.isRoundTrip && formData.returnDate && (
                                                <div>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Return Date</p>
                                                    <p className="text-white font-medium text-sm">{formData.returnDate}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Passengers</p>
                                                <p className="text-white font-medium text-sm">{formData.totalPassengers}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Car Allocation */}
                                    {allocation && formData.selectedCar && (
                                        <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-5 mb-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Car Allocation</h4>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-900 shrink-0">
                                                    {formData.selectedCar.photos?.[0] ? (
                                                        <img src={formData.selectedCar.photos[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : <div className="w-full h-full flex items-center justify-center"><Car className="w-6 h-6 text-gray-700" /></div>}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{allocation.carsNeeded} × {formData.selectedCar.name}</p>
                                                    <p className="text-gray-400 text-xs">{formData.selectedCar.seatingCapacity} seats each · {formData.selectedCar.type}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-3 border-t border-gray-800">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Rate</span>
                                                    <span className="text-white">₹{allocation.pricePerUnit.toLocaleString('en-IN')} {allocation.pricingLabel}</span>
                                                </div>
                                                {allocation.carsNeeded > 1 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Cars</span>
                                                        <span className="text-white">× {allocation.carsNeeded}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-800">
                                                    <span className="text-white">Total Estimated Fare</span>
                                                    <span className="text-blue-400 text-lg">₹{totalEstimatedFare.toLocaleString('en-IN')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Advance Highlight */}
                                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-2xl p-5 mb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-blue-400 font-bold text-sm">Advance to Pay (20%)</p>
                                                <p className="text-blue-500/60 text-xs mt-0.5">Balance due at travel</p>
                                            </div>
                                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                                ₹{advanceAmount.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Special Requests */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Special Requests (Optional)</label>
                                        <textarea
                                            rows={3}
                                            value={formData.specialRequests}
                                            onChange={e => update('specialRequests', e.target.value)}
                                            placeholder="E.g., Child seat, extra luggage space..."
                                            className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition resize-none"
                                        />
                                    </div>

                                    {/* Terms */}
                                    <label className="flex items-start gap-3 p-4 bg-[#1a1a24] border border-gray-800 rounded-xl cursor-pointer mb-6">
                                        <input
                                            type="checkbox"
                                            checked={agreedTerms}
                                            onChange={() => setAgreedTerms(!agreedTerms)}
                                            className="mt-0.5 w-4 h-4 accent-blue-500"
                                        />
                                        <span className="text-sm text-gray-300">
                                            I agree to <span className="text-blue-400 underline">Infinite Yatra's booking terms</span> and conditions.
                                        </span>
                                    </label>

                                    <button
                                        disabled={!agreedTerms}
                                        onClick={handleNext}
                                        className="w-full flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all"
                                    >
                                        Confirm Booking <ArrowRight className="w-5 h-5 ml-2" />
                                    </button>
                                </motion.div>

                            ) : (
                                /* ═══ STEP 5: CONFIRM ═══ */
                                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div className="text-center py-10">
                                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
                                            <Car className="w-10 h-10 text-blue-400" />
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2">Ready to book?</h3>
                                        <p className="text-gray-400 mb-8">
                                            {allocation?.carsNeeded || 1} × {formData.selectedCar?.name} for {formData.totalPassengers} passenger{formData.totalPassengers > 1 ? 's' : ''}
                                        </p>

                                        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
                                            <p className="text-gray-400 text-sm mb-1">Advance Amount</p>
                                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                                ₹{advanceAmount.toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        <button
                                            disabled={isSubmitting}
                                            onClick={handleSubmit}
                                            className="w-full max-w-sm mx-auto flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                <>Confirm & Book <CheckCircle2 className="w-5 h-5 ml-2" /></>
                                            )}
                                        </button>

                                        <p className="text-xs text-gray-500 mt-4">You'll receive a confirmation call within 2 hours</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
