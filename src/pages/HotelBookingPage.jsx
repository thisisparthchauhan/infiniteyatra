import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, CreditCard, Calendar, Users, ShieldCheck, Hotel, Bed, TrendingUp } from 'lucide-react';
import { calculateDynamicPrice } from '../utils/pricingEngine';
import { payWithRazorpay } from '../services/paymentGateway';
import { acquireLock, releaseLock } from '../services/lockingService'; // If integrated

const HotelBookingPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const navigate = useNavigate();

    const [hotel, setHotel] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [loading, setLoading] = useState(true);

    const [guestDetails, setGuestDetails] = useState({
        fullName: '',
        email: '',
        phone: '',
        specialRequests: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('full');
    const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
    const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Next day
    const [guests, setGuests] = useState(2);

    // Dynamic Pricing State
    const [dynamicPrice, setDynamicPrice] = useState(0);
    const [pricingBreakdown, setPricingBreakdown] = useState(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, 'hotels', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const hotelData = { id: docSnap.id, ...docSnap.data() };
                    setHotel(hotelData);

                    if (roomId && hotelData.rooms) {
                        const room = hotelData.rooms.find(r => r.id.toString() === roomId);
                        setSelectedRoom(room);
                        // Initial Price Set
                        setDynamicPrice(Number(room.price));
                    }
                }
            } catch (error) {
                console.error("Error fetching hotel:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, roomId]);

    // Dynamic Price Recalculation Effect
    useEffect(() => {
        if (selectedRoom && hotel) {
            const updatePrice = async () => {
                const res = await calculateDynamicPrice({
                    basePrice: Number(selectedRoom.price),
                    costPrice: Number(selectedRoom.costPrice || selectedRoom.price * 0.7),
                    totalInventory: Number(selectedRoom.count),
                    checkInDate: checkIn,
                    hotelId: id,
                    roomId: selectedRoom.id
                });
                setDynamicPrice(res.finalPrice);
                setPricingBreakdown(res.breakdown);
            };
            updatePrice();
        }
    }, [checkIn, selectedRoom, hotel, id]);

    // Calculations
    const getDaysDifference = (start, end) => {
        const date1 = new Date(start);
        const date2 = new Date(end);
        const timeDiff = Math.abs(date2 - date1);
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) || 1;
    };

    const nights = getDaysDifference(checkIn, checkOut);
    const roomPrice = dynamicPrice; // Use dynamic price

    const baseAmount = roomPrice * nights;
    const taxRate = 0.18;
    const taxAmount = baseAmount * taxRate;
    const totalAmount = baseAmount + taxAmount;
    const advanceAmount = totalAmount * 0.30;

    // Mock Commission (e.g. 15%)
    const commissionRate = 0.15;
    const iyCommission = baseAmount * commissionRate;
    const hotelPayout = baseAmount - iyCommission;

    const handleInputChange = (e) => {
        setGuestDetails({ ...guestDetails, [e.target.name]: e.target.value });
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!guestDetails.fullName || !guestDetails.phone) {
            alert("Please fill in your details.");
            return;
        }

        const bookingId = 'BK' + Date.now().toString().slice(-6);
        const amountToPay = paymentMethod === 'full' ? totalAmount : advanceAmount;

        const bookingPayload = {
            hotelId: id,
            hotelName: hotel.name,
            roomId: selectedRoom?.id || 'standard',
            roomName: selectedRoom?.name || 'Standard Room',
            userId: 'guest_user',
            customerName: guestDetails.fullName,
            customerEmail: guestDetails.email,
            customerPhone: guestDetails.phone,
            checkIn,
            checkOut,
            nights,
            guests,
            pricePerNight: roomPrice,
            baseAmount,
            taxAmount,
            totalAmount,
            paidAmount: amountToPay,
            paymentMethod,
            paymentStatus: 'Pending', // Initially Pending
            bookingStatus: 'Pending',
            referenceId: bookingId,
            pricingDebug: pricingBreakdown,
            createdAt: serverTimestamp()
        };

        const financeRecord = {
            bookingId: bookingId,
            hotelId: id,
            grossAmount: baseAmount,
            totalCollected: totalAmount,
            iyCommission,
            hotelPayout,
            payoutStatus: 'Pending',
            createdAt: serverTimestamp()
        };

        // Initiate Razorpay Payment
        await payWithRazorpay(
            {
                id: bookingId,
                amount: amountToPay,
                currency: 'INR',
                user: { name: guestDetails.fullName, email: guestDetails.email, phone: guestDetails.phone },
                description: `Booking at ${hotel.name}`
            },
            async (paymentSuccess) => {
                // ON SUCCESS
                try {
                    // Update Status
                    bookingPayload.paymentStatus = paymentMethod === 'full' ? 'Paid' : 'Partial';
                    bookingPayload.bookingStatus = 'Confirmed';
                    bookingPayload.paymentId = paymentSuccess.paymentId;
                    bookingPayload.orderId = paymentSuccess.orderId;

                    await addDoc(collection(db, 'hotel_bookings'), bookingPayload);
                    await addDoc(collection(db, 'hotel_finance'), financeRecord);
                    navigate('/hotels/success', { state: { booking: bookingPayload } });
                } catch (dbError) {
                    console.error("DB Error after Payment:", dbError);
                    alert("Payment successful but booking save failed. Contact support.");
                }
            },
            (errorMessage) => {
                // ON FAILURE
                console.error("Payment Failed:", errorMessage);
                alert(`Payment Failed: ${errorMessage}`);
                // releaseLock(lockId) if implemented
            }
        );
    };

    if (loading) return <div className="min-h-screen pt-24 text-center">Loading...</div>;
    if (!hotel) return <div className="min-h-screen pt-24 text-center">Hotel not found</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white pb-20 pt-24 font-sans">
            <div className="container mx-auto px-4 max-w-6xl">

                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-blue-500 mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Property</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Left Column: Form */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Confirm Your Stay</h1>
                            <p className="text-slate-500">Secure your reservation at {hotel.name}</p>
                        </div>

                        {/* Guest Details (Same as before) */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Users className="text-blue-500" size={20} /> Guest Information
                            </h2>
                            <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={guestDetails.fullName}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={guestDetails.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={guestDetails.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                            placeholder="+91 98765 43210"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Check-in Date</label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Special Requests</label>
                                    <textarea
                                        name="specialRequests"
                                        value={guestDetails.specialRequests}
                                        onChange={handleInputChange}
                                        className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                                        placeholder="Late check-in, etc."
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Payment Options (Same as before) - Truncated for brevity in tool call, will use full implementation */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
                                            <span className="text-sm text-slate-500">Pay remaining ₹{(totalAmount - advanceAmount).toLocaleString()} at hotel</span>
                                        </div>
                                    </div>
                                    <span className="font-bold">₹{advanceAmount.toLocaleString()}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary with Dynamic Pricing Feedback */}
                    <div className="w-full lg:w-96">
                        <div className="sticky top-28 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                            <h3 className="text-lg font-bold mb-4">Booking Summary</h3>

                            <div className="flex gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                                <img src={hotel.image} alt="Hotel" className="w-20 h-20 rounded-lg object-cover" />
                                <div>
                                    <p className="font-bold text-sm line-clamp-1">{hotel.name}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                        <Hotel size={12} /> {hotel.location.split(',')[0]}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Bed size={10} /> {selectedRoom ? selectedRoom.name : 'Standard Room'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Pricing Alert */}
                            {pricingBreakdown && pricingBreakdown.occupancyMultiplier > 1 && (
                                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                                    <TrendingUp size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-400">High Demand Date</p>
                                        <p className="text-[10px] text-slate-400">Prices are slightly higher due to high occupancy.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">{nights} Nights ({checkIn})</span>
                                    <span>₹{baseAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Price/Night</span>
                                    <span>₹{roomPrice.toLocaleString()}</span>
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
                                    <div className="flex justify-between text-sm text-blue-500 font-semibold p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                        <span>Due Now</span>
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
