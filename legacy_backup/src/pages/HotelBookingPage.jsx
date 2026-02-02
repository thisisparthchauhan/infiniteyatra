import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Calendar, Users, ShieldCheck, Hotel } from 'lucide-react';

const HotelBookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock Hotel Data (In real app, fetch via ID)
    const hotel = {
        name: 'The Grand IY Resort',
        location: 'Goa, India',
        pricePerNight: 12000,
        image: 'https://images.unsplash.com/photo-1571896349842-6e53ce41be03?auto=format&fit=crop&q=80'
    };

    const [guestDetails, setGuestDetails] = useState({
        fullName: '',
        email: '',
        phone: '',
        specialRequests: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('full'); // 'full' or 'advance'
    const [nights, setNights] = useState(3);
    const [guests, setGuests] = useState(2);

    const taxRate = 0.18;
    const baseAmount = hotel.pricePerNight * nights;
    const taxAmount = baseAmount * taxRate;
    const totalAmount = baseAmount + taxAmount;
    const advanceAmount = totalAmount * 0.30; // 30% advance

    const handleInputChange = (e) => {
        setGuestDetails({ ...guestDetails, [e.target.name]: e.target.value });
    };

    const handleBooking = (e) => {
        e.preventDefault();

        // 1. Create Booking Object
        const newBooking = {
            id: 'BK' + Math.floor(Math.random() * 100000),
            hotelName: hotel.name,
            customerName: guestDetails.fullName,
            date: new Date().toISOString(),
            amount: paymentMethod === 'full' ? totalAmount : advanceAmount,
            totalValue: totalAmount,
            status: 'Confirmed',
            paymentStatus: paymentMethod === 'full' ? 'Paid' : 'Partially Paid'
        };

        // 2. Save to LocalStorage for Admin Dashboard Demo
        const existingBookings = JSON.parse(localStorage.getItem('iy_hotel_bookings') || '[]');
        localStorage.setItem('iy_hotel_bookings', JSON.stringify([newBooking, ...existingBookings]));

        // 3. Mock API Call & Navigate
        setTimeout(() => {
            navigate('/hotels/success', { state: { booking: newBooking } });
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white pb-20 pt-24">
            <div className="container mx-auto px-4 max-w-6xl">

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Hotel Details</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Left Column: Form */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Confirm Your Stay</h1>
                            <p className="text-slate-500">You're one step away from your dream vacation.</p>
                        </div>

                        {/* Guest Details */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Users className="text-blue-500" size={20} /> Guest Information
                            </h2>
                            <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={guestDetails.fullName}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={guestDetails.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={guestDetails.phone}
                                        onChange={handleInputChange}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Special Requests (Optional)</label>
                                    <textarea
                                        name="specialRequests"
                                        value={guestDetails.specialRequests}
                                        onChange={handleInputChange}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                                        placeholder="Late check-in, dietary restrictions, etc."
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Payment Options */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CreditCard className="text-blue-500" size={20} /> Payment Option
                            </h2>

                            <div className="space-y-4">
                                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'full' ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={paymentMethod === 'full'}
                                            onChange={() => setPaymentMethod('full')}
                                            className="w-5 h-5 text-blue-600 accent-blue-600"
                                        />
                                        <div>
                                            <span className="font-bold block">Pay Full Amount</span>
                                            <span className="text-sm text-slate-500">Secure your booking instantly</span>
                                        </div>
                                    </div>
                                    <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
                                </label>

                                <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'advance' ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={paymentMethod === 'advance'}
                                            onChange={() => setPaymentMethod('advance')}
                                            className="w-5 h-5 text-blue-600 accent-blue-600"
                                        />
                                        <div>
                                            <span className="font-bold block">Pay 30% Advance</span>
                                            <span className="text-sm text-slate-500">Pay the rest upon check-in</span>
                                        </div>
                                    </div>
                                    <span className="font-bold">₹{advanceAmount.toLocaleString()}</span>
                                </label>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                                <ShieldCheck size={18} className="text-green-500" />
                                <span>Your payment information is encrypted and secure.</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="w-full lg:w-96">
                        <div className="sticky top-28 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                            <h3 className="text-lg font-bold mb-4">Booking Summary</h3>

                            <div className="flex gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                                <img src={hotel.image} alt="Hotel" className="w-20 h-20 rounded-lg object-cover" />
                                <div>
                                    <p className="font-bold text-sm">{hotel.name}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Hotel size={12} /> {hotel.location}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">Deluxe Room</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">₹{hotel.pricePerNight.toLocaleString()} x {nights} Nights</span>
                                    <span>₹{baseAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Taxes & Fees (18%)</span>
                                    <span>₹{taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{totalAmount.toLocaleString()}</span>
                                </div>
                                {paymentMethod === 'advance' && (
                                    <div className="flex justify-between text-sm text-blue-500 font-semibold">
                                        <span>Pay Now (30%)</span>
                                        <span>₹{advanceAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleBooking}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-600/25 transition-all active:scale-[0.98]"
                            >
                                Confirm & Pay
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelBookingPage;
