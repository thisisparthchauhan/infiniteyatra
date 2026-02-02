import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Star, Wifi, Coffee, Utensils, Waves,
    Calendar, Users, Check, Shield, Clock, ArrowLeft, ChevronRight
} from 'lucide-react';

const HotelDetail = () => {
    const { id } = useParams();
    const [activeImage, setActiveImage] = useState(0);

    // Mock Data (In a real app, fetch this based on `id` from backend)
    const hotel = {
        name: 'The Grand IY Resort',
        location: 'Goa, India',
        rating: 4.8,
        reviews: 124,
        description: `Nestled on the pristine shores of Goa, The Grand IY Resort offers an unparalleled blend of luxury and tranquility. Experience world-class hospitality with our private beachfront access, infinity pools, and gourmet dining options. Whether you're seeking a romantic getaway or a family adventure, our resort is your perfect sanctuary.`,
        amenities: [
            { icon: Wifi, label: 'Free High-Speed WiFi' },
            { icon: Waves, label: 'Infinity Pool' },
            { icon: Utensils, label: 'Gourmet Dining' },
            { icon: Coffee, label: 'Breakfast Included' },
            { icon: Shield, label: '24/7 Security' },
            { icon: Users, label: 'Family Friendly' }
        ],
        images: [
            'https://images.unsplash.com/photo-1571896349842-6e53ce41be03?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1540541338287-41700206dee6?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80'
        ],
        rooms: [
            {
                id: 'r1',
                name: 'Deluxe Ocean View',
                size: '450 sq ft',
                view: 'Ocean View',
                price: 12000,
                image: 'https://images.unsplash.com/photo-1590490360182-f33efe293b3d?auto=format&fit=crop&q=80'
            },
            {
                id: 'r2',
                name: 'Premium Garden Suite',
                size: '600 sq ft',
                view: 'Garden View',
                price: 18500,
                image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80'
            }
        ]
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-white pb-20">
            {/* Navbar Placeholder Adjustment */}
            <div className="h-20 bg-black"></div>

            {/* Breadcrumb / Back Button */}
            <div className="container mx-auto px-4 py-6">
                <Link to="/hotels" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    <span>Back to Hotels</span>
                </Link>
            </div>

            {/* Image Gallery */}
            <section className="container mx-auto px-4 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px] rounded-3xl overflow-hidden">
                    {/* Main Large Image */}
                    <div className="relative h-full group cursor-pointer">
                        <img
                            src={hotel.images[0]}
                            alt="Main View"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    {/* Secondary Images Grid */}
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {hotel.images.slice(1).map((img, index) => (
                            <div key={index} className="relative h-full overflow-hidden group cursor-pointer">
                                <img
                                    src={img}
                                    alt={`Gallery ${index}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-12">
                {/* Left Column: Details */}
                <div className="w-full lg:w-2/3 space-y-12">

                    {/* Title & Overview */}
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-2">{hotel.name}</h1>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <MapPin size={18} />
                                    <span>{hotel.location}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold mb-2 border border-blue-500/20">
                                    <ShieldCheck size={12} /> Verified by IY
                                </span>
                                <div className="flex items-center gap-1 justify-end mb-1">
                                    <Star className="fill-yellow-500 text-yellow-500" size={20} />
                                    <span className="text-xl font-bold">{hotel.rating}</span>
                                </div>
                                <span className="text-sm text-slate-500 underline">{hotel.reviews} reviews</span>
                            </div>
                        </div>
                        <p className="text-lg text-slate-400 leading-relaxed font-light">
                            {hotel.description}
                        </p>
                    </div>

                    {/* Amenities */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Amenities</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                            {hotel.amenities.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-slate-300">
                                    <div className="p-2 bg-white/5 rounded-lg text-blue-400">
                                        <item.icon size={20} />
                                    </div>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Room Categories */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Choose Your Room</h2>
                        <div className="space-y-6">
                            {hotel.rooms.map((room) => (
                                <div key={room.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-6 flex flex-col md:flex-row gap-6 hover:border-blue-500/50 transition-colors">
                                    <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                                        <p className="text-slate-500 text-sm mb-4">{room.size} • {room.view}</p>
                                        <div className="flex items-start gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1"><Check size={14} className="text-green-500" /> Free Cancellation</span>
                                            <span className="flex items-center gap-1"><Check size={14} className="text-green-500" /> Breakfast Included</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-row md:flex-col justify-between items-end">
                                        <div>
                                            <span className="text-2xl font-bold block">₹{room.price.toLocaleString()}</span>
                                            <span className="text-xs text-slate-500">per night</span>
                                        </div>
                                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-500 transition-colors">
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Policies */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Hotel Policies</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div>
                                <h4 className="flex items-center gap-2 font-semibold mb-2 text-slate-200">
                                    <Clock size={18} className="text-slate-400" /> Check-in / Check-out
                                </h4>
                                <ul className="text-sm text-slate-400 space-y-1">
                                    <li>Check-in: 12:00 PM</li>
                                    <li>Check-out: 11:00 AM</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 font-semibold mb-2 text-slate-200">
                                    <Shield size={18} className="text-slate-400" /> Cancellation Policy
                                </h4>
                                <p className="text-sm text-slate-400">
                                    Full refund if cancelled within 48 hours of booking. 50% refund up to 7 days before check-in.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking Card (Sticky) */}
                <div className="w-full lg:w-1/3">
                    <div className="sticky top-24">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
                            <div className="flex items-baseline justify-between mb-6">
                                <div>
                                    <span className="text-lg text-slate-400 line-through mr-2">₹15,000</span>
                                    <span className="text-3xl font-bold">₹12,000</span>
                                    <span className="text-slate-500 text-sm"> / night</span>
                                </div>
                                <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold">20% OFF</span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <label className="block text-xs text-slate-500 font-medium uppercase mb-1">Check-in</label>
                                        <span className="font-bold text-sm">Feb 15, 2026</span>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <label className="block text-xs text-slate-500 font-medium uppercase mb-1">Check-out</label>
                                        <span className="font-bold text-sm">Feb 18, 2026</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 flex justify-between items-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors">
                                    <div>
                                        <label className="block text-xs text-slate-500 font-medium uppercase mb-1">Guests</label>
                                        <span className="font-bold text-sm">2 Guests, 1 Room</span>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-400" />
                                </div>
                            </div>

                            <Link to={`/hotels/book/${id}`} className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25">
                                Book with Infinite Yatra
                            </Link>

                            <p className="text-xs text-slate-500 text-center mt-4">
                                You won't be charged yet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelDetail;
