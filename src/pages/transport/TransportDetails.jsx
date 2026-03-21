import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Fuel, Briefcase, CheckCircle, Info, Star, Clock, AlertCircle, Phone, FileText, ChevronLeft, X, Plus, Minus } from 'lucide-react';
import { getVehicles, addBooking, updateBookingData } from '../../services/transportService';
import { payWithRazorpay } from '../../services/paymentGateway';
import { useAuth } from '../../context/AuthContext';

const TransportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showMobileBooking, setShowMobileBooking] = useState(false);
    const [bookingId, setBookingId] = useState('');

    const [activeImage, setActiveImage] = useState(0);

    const [bookingData, setBookingData] = useState({
        startDate: '',
        endDate: '',
        pickupTime: '10:00',
        pickupCity: '',
        dropCity: '',
        pickupAddress: '',
        intermediateStops: [],
        dropAddress: '',
        passengerName: currentUser?.displayName || '',
        passengerPhone: '',
        specialRequests: '',
        driveMode: 'with_driver', // 'with_driver' | 'self_drive'
        drivingLicense: ''
    });

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const vehicles = await getVehicles();
                const found = vehicles.find(v => v.id === id);
                if (found) {
                    setVehicle(found);
                    setBookingData(prev => ({
                        ...prev,
                        pickupCity: found.city,
                        dropCity: found.city
                    }));
                } else {
                    alert('Vehicle not found');
                    navigate('/transport');
                }
            } catch (error) {
                console.error("Error fetching vehicle details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicle();
    }, [id, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({ ...prev, [name]: value }));
    };

    const addStop = () => {
        setBookingData(prev => ({
            ...prev,
            intermediateStops: [...prev.intermediateStops, '']
        }));
    };

    const removeStop = (indexToRemove) => {
        setBookingData(prev => ({
            ...prev,
            intermediateStops: prev.intermediateStops.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleStopChange = (index, value) => {
        setBookingData(prev => {
            const newStops = [...prev.intermediateStops];
            newStops[index] = value;
            return { ...prev, intermediateStops: newStops };
        });
    };

    const handleDriveModeToggle = (mode) => {
        setBookingData(prev => ({ ...prev, driveMode: mode }));
    };

    const totalDays = () => {
        if (!bookingData.startDate || !bookingData.endDate) return 0;
        const start = new Date(bookingData.startDate);
        const end = new Date(bookingData.endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    };

    const calculateTotal = () => {
        if (!vehicle) return 0;
        return totalDays() * vehicle.pricePerDay;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Please login to book a vehicle.');
            navigate('/login');
            return;
        }

        const totalAmount = calculateTotal();
        if (totalAmount <= 0) {
            alert('Invalid dates selected.');
            return;
        }

        const payload = {
            ...bookingData,
            startDate: new Date(bookingData.startDate),
            endDate: new Date(bookingData.endDate),
            userId: currentUser.uid,
            customerEmail: currentUser.email,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            vehicleType: vehicle.type,
            totalDays: totalDays(),
            totalAmount: totalAmount,
            status: 'pending'
        };

        try {
            setSubmitting(true);
            const docId = await addBooking(payload);
            setBookingId(docId);
            
            await payWithRazorpay(
                {
                    id: docId,
                    amount: totalAmount,
                    currency: 'INR',
                    user: { name: currentUser.displayName, email: currentUser.email, phone: bookingData.passengerPhone },
                    description: `Transport Booking - ${vehicle.name}`,
                    collectionName: 'transportation_bookings'
                },
                async (paymentSuccess) => {
                    try {
                        await updateBookingData(docId, {
                            paymentStatus: 'Paid',
                            status: 'confirmed',
                            paymentId: paymentSuccess.paymentId,
                            orderId: paymentSuccess.orderId
                        });
                        setShowSuccessModal(true);
                    } catch (dbError) {
                        console.error('Error updating booking post-payment:', dbError);
                        alert('Payment successful but status update failed. Please contact support.');
                    } finally {
                        setSubmitting(false);
                    }
                },
                (errorMessage) => {
                    console.error('Payment Failed:', errorMessage);
                    alert(`Payment Failed: ${errorMessage}`);
                    setSubmitting(false);
                }
            );
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Failed to submit booking. Please try again.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-28 pb-20 flex justify-center items-center bg-[#0a0a0a]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!vehicle) return null;

    const images = vehicle.images?.length > 0 ? vehicle.images : [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517438476312-d0f8d956bc56?auto=format&fit=crop&q=80'
    ];

    const generateWhatsAppLink = () => {
        const message = `Hi, I just requested a booking on Infinite Yatra!\n\nBooking ID: ${bookingId}\nVehicle: ${vehicle.name}\nDates: ${bookingData.startDate} to ${bookingData.endDate}\nTotal: ₹${calculateTotal()}`;
        return `https://wa.me/?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-20 md:pt-24 pb-24 md:pb-20 font-sans">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

                {/* Mobile Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="md:hidden flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors p-2 -ml-2 min-h-[44px]"
                >
                    <ChevronLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

                    {/* LEFT SIDE (60%) */}
                    <div className="w-full lg:w-[60%] space-y-8">

                        {/* 1. Image gallery */}
                        <div className="space-y-4">
                            <div className="rounded-2xl md:rounded-3xl overflow-hidden h-[250px] sm:h-[300px] md:h-[450px] border border-slate-800 relative group">
                                <div
                                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                                    onScroll={(e) => {
                                        const index = Math.round(e.target.scrollLeft / e.target.clientWidth);
                                        setActiveImage(index);
                                    }}
                                >
                                    {images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`${vehicle.name} ${idx}`}
                                            className="w-full h-full object-cover shrink-0 snap-center"
                                        />
                                    ))}
                                </div>
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 z-10">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">{vehicle.type}</span>
                                </div>
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none md:hidden">
                                    {images.map((_, idx) => (
                                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeImage === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="hidden md:flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setActiveImage(idx);
                                            // Scroll container to selected image if using scroll method:
                                            // document.querySelector('.snap-mandatory').scrollTo({ left: idx * document.querySelector('.snap-mandatory').clientWidth, behavior: 'smooth' });
                                        }}
                                        className={`shrink-0 w-24 h-24 md:w-32 md:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImage === idx ? 'border-purple-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2 & 3. Title, City, Rating, Bookings */}
                        <div>
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{vehicle.name}</h1>
                                {vehicle.totalBookings > 10 && (
                                    <span className="bg-purple-900/30 text-purple-400 border border-purple-800/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Popular
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <MapPin size={16} className="text-purple-400" />
                                    {vehicle.city}, {vehicle.state}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-white font-bold">{(vehicle.rating || 5).toFixed(1)}</span>
                                    <span className="text-slate-500">({vehicle.totalBookings || 0} bookings)</span>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-800" />

                        {/* 4. Feature tags */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Vehicle Highlights</h3>
                            <div className="flex flex-wrap gap-3">
                                <span className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 text-sm font-semibold">
                                    <Users size={16} className="text-purple-400" /> {vehicle.seats} Seats
                                </span>
                                {vehicle.driverIncluded && (
                                    <span className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 text-sm font-semibold">
                                        <Briefcase size={16} className="text-purple-400" /> Driver Included
                                    </span>
                                )}
                                {vehicle.fuelIncluded && (
                                    <span className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 text-sm font-semibold">
                                        <Fuel size={16} className="text-purple-400" /> Fuel Included
                                    </span>
                                )}
                                {vehicle.features?.map((feature, idx) => (
                                    <span key={idx} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-slate-300 text-sm font-semibold">
                                        <CheckCircle size={14} className="text-green-400" /> {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-800" />

                        {/* 5. About */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">About this {vehicle.type}</h3>
                            <p className="text-slate-400 leading-relaxed font-medium">
                                {vehicle.description || 'Experience the best road trip with this well-maintained, comfortable vehicle. Ideal for both city driving and long highway journeys.'}
                            </p>
                        </div>

                        {/* 6 & 7. Inclusions/Exclusions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                            <div>
                                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-500" /> Included in price
                                </h4>
                                <ul className="space-y-2 text-slate-400 text-sm font-medium">
                                    <li>✓ Unlimited kilometers</li>
                                    <li>✓ Comprehensive insurance</li>
                                    <li>✓ 24/7 Roadside assistance</li>
                                    <li>✓ Vehicle maintenance</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-red-500" /> Not Included
                                </h4>
                                <ul className="space-y-2 text-slate-400 text-sm font-medium">
                                    {!vehicle.fuelIncluded && <li>× Fuel / Charging costs</li>}
                                    <li>× Toll taxes and parking fees</li>
                                    <li>× Interstate permits (if applicable)</li>
                                    <li>× Fines or traffic violations</li>
                                </ul>
                            </div>
                        </div>

                        <hr className="border-slate-800" />

                        {/* 8 & 9. Policies */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <MapPin size={18} className="text-purple-500" /> Pickup & Drop Policy
                                </h4>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Vehicle must be picked up and dropped off at the agreed-upon locations. Late drop-offs may incur additional hourly charges. Please ensure you have a valid driving license and ID ready for verification at the time of pickup.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <Info size={18} className="text-purple-500" /> Cancellation Policy
                                </h4>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Cancellations made 24 hours prior to the pickup time are eligible for a full refund. Cancellations made within 24 hours may be subject to a 1-day rental deduction.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP RIGHT SIDE BOOKING CARD */}
                    <div className="hidden lg:block w-[40%]">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl sticky top-28">

                            {/* 1. Price */}
                            <div className="mb-6 flex justify-between items-end border-b border-slate-800 pb-6">
                                <div>
                                    <p className="text-3xl font-black text-white leading-none">₹{vehicle.pricePerDay}</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Per Day</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-slate-400 leading-none">₹{vehicle.pricePerHour}</p>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">Per Hour</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* 2 & 3. Dates & Time */}
                                <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 relative">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pickup Date</label>
                                            <input
                                                type="date" name="startDate" required
                                                className="w-full bg-transparent text-white font-semibold text-base focus:outline-none color-scheme-dark min-h-[44px]"
                                                value={bookingData.startDate} onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                        <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 relative">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Return Date</label>
                                            <input
                                                type="date" name="endDate" required
                                                className="w-full bg-transparent text-white font-semibold text-base focus:outline-none color-scheme-dark min-h-[44px]"
                                                value={bookingData.endDate} onChange={handleInputChange}
                                                min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pickup Time</label>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-purple-500" />
                                            <input
                                                type="time" name="pickupTime" required
                                                className="w-full bg-transparent text-white font-semibold text-base focus:outline-none color-scheme-dark min-h-[44px]"
                                                value={bookingData.pickupTime} onChange={handleInputChange}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Drive Mode Selection (Cars & Bikes Only) */}
                                {['car', 'bike', 'cars', 'bikes'].includes(vehicle.type?.toLowerCase()) && (
                                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => handleDriveModeToggle('with_driver')}
                                            className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${bookingData.driveMode === 'with_driver' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                        >
                                            With Driver
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleDriveModeToggle('self_drive')}
                                            className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${bookingData.driveMode === 'self_drive' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                        >
                                            Self Drive
                                        </button>
                                    </div>
                                )}

                                {/* Address Fields & Dynamic Waypoints */}
                                <div className="space-y-3">
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="text" name="pickupAddress" placeholder="Exact Pickup Location / Landmark" required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none placeholder:text-slate-600 min-h-[44px]"
                                            value={bookingData.pickupAddress} onChange={handleInputChange}
                                        />
                                    </div>
                                    
                                    <div className="pl-6 border-l-2 border-dashed border-slate-700 ml-5 py-2 space-y-3">
                                        <AnimatePresence>
                                            {bookingData.intermediateStops.map((stop, index) => (
                                                <motion.div 
                                                    key={index}
                                                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                                    className="relative flex items-center gap-2"
                                                >
                                                    <div className="absolute -left-[35px] w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600" />
                                                    <input
                                                        type="text" placeholder={`Stop ${index + 1}`} required
                                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none placeholder:text-slate-600 min-h-[44px]"
                                                        value={stop} onChange={(e) => handleStopChange(index, e.target.value)}
                                                    />
                                                    <button 
                                                        type="button" onClick={() => removeStop(index)}
                                                        className="p-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl transition-colors shrink-0"
                                                    >
                                                        <Minus size={16} strokeWidth={3} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        
                                        <button 
                                            type="button" onClick={addStop}
                                            className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors py-1"
                                        >
                                            <Plus size={16} /> Add Stop (Optional)
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={16} />
                                        <input
                                            type="text" name="dropAddress" placeholder="Final Drop Location" required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none placeholder:text-slate-600 min-h-[44px]"
                                            value={bookingData.dropAddress} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Traveler Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                        <input
                                            type="text" name="passengerName" placeholder="Full Name" required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none min-h-[44px]"
                                            value={bookingData.passengerName} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                        <input
                                            type="tel" name="passengerPhone" placeholder="Phone" required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none min-h-[44px]"
                                            value={bookingData.passengerPhone} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                
                                <AnimatePresence>
                                    {bookingData.driveMode === 'self_drive' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="relative"
                                        >
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={16} />
                                            <input
                                                type="text" name="drivingLicense" placeholder="Driving License Number" required
                                                className="w-full bg-purple-950/20 border border-purple-900/50 rounded-xl pl-10 pr-3 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none min-h-[44px]"
                                                value={bookingData.drivingLicense} onChange={handleInputChange}
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1 ml-1 font-medium">* Required for self-drive verification upon pickup</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Special Requests */}
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-slate-600" size={16} />
                                    <textarea
                                        name="specialRequests" placeholder="Special requests..." rows={2}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base font-medium focus:border-purple-500 focus:outline-none placeholder:text-slate-600 resize-none min-h-[44px]"
                                        value={bookingData.specialRequests} onChange={handleInputChange}
                                    ></textarea>
                                </div>

                                {/* 4. Calculate total */}
                                {bookingData.startDate && bookingData.endDate && (
                                    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-4 border border-purple-900/40">
                                        <div className="flex justify-between items-center text-sm mb-2 text-slate-300">
                                            <span>₹{vehicle.pricePerDay} × {totalDays()} days</span>
                                            <span>₹{calculateTotal()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mb-3 text-slate-400">
                                            <span>Service Fee (0%)</span>
                                            <span>₹0</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-purple-900/50 pt-3">
                                            <span className="font-bold text-white">Total Amount</span>
                                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                                                ₹{calculateTotal()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* 10. Confirm Booking Button */}
                                <button
                                    type="submit" disabled={submitting}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
                                >
                                    {submitting ? 'Processing...' : 'Confirm Booking'}
                                </button>
                                <p className="text-center text-xs text-slate-500 font-medium">
                                    You won't be charged securely until confirmed.
                                </p>
                            </form>
                        </div>
                    </div>

                </div>
            </div>

            {/* MOBILE STICKY BOOKING BAR */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 pb-safe flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                    <p className="text-xl font-black text-white leading-none">₹{vehicle.pricePerDay}<span className="text-sm text-slate-500 font-medium ml-1">/ day</span></p>
                </div>
                <button
                    onClick={() => setShowMobileBooking(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl min-h-[44px] shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                >
                    Book Now
                </button>
            </div>

            {/* MOBILE FULLSCREEN BOOKING MODAL */}
            <AnimatePresence>
                {showMobileBooking && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-50 bg-slate-950 flex flex-col lg:hidden"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10 pt-safe">
                            <h3 className="text-lg font-bold text-white">Book {vehicle.name}</h3>
                            <button
                                onClick={() => setShowMobileBooking(false)}
                                className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 pb-24">
                            <div className="mb-6 flex justify-between items-end bg-slate-900 p-4 rounded-2xl border border-slate-800">
                                <div>
                                    <p className="text-2xl font-black text-white leading-none">₹{vehicle.pricePerDay}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Per Day</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-slate-400 leading-none">₹{vehicle.pricePerHour}</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Per Hour</p>
                                </div>
                            </div>

                            <form id="mobile-booking-form" onSubmit={handleSubmit} className="space-y-4">
                                {/* Drive Mode Selection (Cars & Bikes Only) */}
                                {['car', 'bike', 'cars', 'bikes'].includes(vehicle.type?.toLowerCase()) && (
                                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => handleDriveModeToggle('with_driver')}
                                            className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${bookingData.driveMode === 'with_driver' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                        >
                                            With Driver
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleDriveModeToggle('self_drive')}
                                            className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${bookingData.driveMode === 'self_drive' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                        >
                                            Self Drive
                                        </button>
                                    </div>
                                )}
                                
                                {/* Dates & Time */}
                                <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pickup</label>
                                            <input
                                                type="date" name="startDate" required
                                                className="w-full bg-slate-800 rounded-lg p-3 text-white font-medium text-base focus:outline-none min-h-[44px]"
                                                value={bookingData.startDate} onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Return</label>
                                            <input
                                                type="date" name="endDate" required
                                                className="w-full bg-slate-800 rounded-lg p-3 text-white font-medium text-base focus:outline-none min-h-[44px]"
                                                value={bookingData.endDate} onChange={handleInputChange}
                                                min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time</label>
                                        <input
                                            type="time" name="pickupTime" required
                                            className="w-full bg-slate-800 rounded-lg p-3 text-white font-medium text-base focus:outline-none min-h-[44px]"
                                            value={bookingData.pickupTime} onChange={handleInputChange}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>

                                {/* Address Fields & Dynamic Waypoints */}
                                <div className="space-y-3 pt-2">
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text" name="pickupAddress" placeholder="Exact Pickup Location / Landmark" required
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-blue-500 focus:outline-none min-h-[44px]"
                                            value={bookingData.pickupAddress} onChange={handleInputChange}
                                        />
                                    </div>
                                    
                                    <div className="pl-6 border-l-2 border-dashed border-slate-700 ml-5 py-2 space-y-3">
                                        <AnimatePresence>
                                            {bookingData.intermediateStops.map((stop, index) => (
                                                <motion.div 
                                                    key={index}
                                                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                                    className="relative flex items-center gap-2"
                                                >
                                                    <div className="absolute -left-[35px] w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600" />
                                                    <input
                                                        type="text" placeholder={`Stop ${index + 1}`} required
                                                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-base font-medium focus:border-blue-500 focus:outline-none placeholder:text-slate-600 min-h-[44px]"
                                                        value={stop} onChange={(e) => handleStopChange(index, e.target.value)}
                                                    />
                                                    <button 
                                                        type="button" onClick={() => removeStop(index)}
                                                        className="p-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl transition-colors shrink-0"
                                                    >
                                                        <Minus size={16} strokeWidth={3} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        
                                        <button 
                                            type="button" onClick={addStop}
                                            className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors py-1"
                                        >
                                            <Plus size={16} /> Add Stop (Optional)
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                        <input
                                            type="text" name="dropAddress" placeholder="Final Drop Location" required
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-blue-500 focus:outline-none min-h-[44px]"
                                            value={bookingData.dropAddress} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Traveler Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                        <input
                                            type="text" name="passengerName" placeholder="Full Name" required
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-blue-500 focus:outline-none min-h-[44px]"
                                            value={bookingData.passengerName} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                        <input
                                            type="tel" name="passengerPhone" placeholder="Phone" required
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-blue-500 focus:outline-none min-h-[44px]"
                                            value={bookingData.passengerPhone} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                
                                <AnimatePresence>
                                    {bookingData.driveMode === 'self_drive' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="relative"
                                        >
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                            <input
                                                type="text" name="drivingLicense" placeholder="Driving License Number" required
                                                className="w-full bg-blue-900/10 border border-blue-900/30 rounded-xl pl-10 pr-3 py-3 text-white text-base font-medium focus:border-blue-500 focus:outline-none min-h-[44px]"
                                                value={bookingData.drivingLicense} onChange={handleInputChange}
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1 ml-1 font-medium">* Required for self-drive verification upon pickup</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Special Requests */}
                                <div className="relative pt-2">
                                    <FileText className="absolute left-3 top-3.5 text-slate-600" size={18} />
                                    <textarea
                                        name="specialRequests" placeholder="Special requests..." rows={3}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-blue-500 focus:outline-none resize-none min-h-[44px]"
                                        value={bookingData.specialRequests} onChange={handleInputChange}
                                    ></textarea>
                                </div>

                                {/* 4. Calculate total */}
                                {bookingData.startDate && bookingData.endDate && (
                                    <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-900/30 mt-4">
                                        <div className="flex justify-between items-center text-sm mb-2 text-slate-300">
                                            <span>₹{vehicle.pricePerDay} × {totalDays()} days</span>
                                            <span>₹{calculateTotal()}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-blue-900/40 pt-3">
                                            <span className="font-bold text-white">Total</span>
                                            <span className="text-xl font-black text-blue-400">₹{calculateTotal()}</span>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Footer CTA */}
                        <div className="bg-slate-900 p-4 border-t border-slate-800 fixed bottom-0 left-0 right-0 pb-safe">
                            <button
                                form="mobile-booking-form" type="submit" disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl min-h-[44px] shadow-lg disabled:opacity-70 disabled:active:scale-100 active:scale-95 transition-transform"
                            >
                                {submitting ? 'Processing...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOOKING SUCCESS MODAL */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>

                            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mb-6 mx-auto border border-green-800/50">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>

                            <h2 className="text-2xl font-black text-white text-center mb-2">Booking Requested!</h2>
                            <p className="text-slate-400 text-sm text-center mb-6 font-medium">
                                We've received your request for the {vehicle.name}. Our team will confirm availability shortly.
                            </p>

                            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-6 space-y-3 font-medium text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Booking ID</span>
                                    <span className="text-white font-mono">{bookingId.substring(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Dates</span>
                                    <span className="text-white">{bookingData.startDate} to {bookingData.endDate}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500">Total</span>
                                    <span className="text-purple-400 font-bold">₹{calculateTotal()}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={generateWhatsAppLink()}
                                    target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition-colors"
                                >
                                    Share on WhatsApp
                                </a>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => navigate('/my-bookings')} // Fallback or valid route
                                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                                    >
                                        My Bookings
                                    </button>
                                    <button
                                        onClick={() => navigate('/transport')}
                                        className="bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-sm"
                                    >
                                        Back to Search
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default TransportDetails;
