import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Wifi, Coffee, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const hotels = [
    {
        id: 'h1',
        name: 'The Grand IY Resort',
        location: 'Goa, India',
        rating: 4.8,
        price: 12000,
        image: 'https://images.unsplash.com/photo-1571896349842-6e53ce41be03?auto=format&fit=crop&q=80',
        amenities: ['WiFi', 'Breakfast']
    },
    {
        id: 'h2',
        name: 'Himalayan Sanctuary',
        location: 'Manali, Himachal',
        rating: 4.9,
        price: 8500,
        image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80',
        amenities: ['WiFi', 'Breakfast']
    },
    {
        id: 'h3',
        name: 'IY Urban Escape',
        location: 'Mumbai, Maharashtra',
        rating: 4.5,
        price: 9000,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        amenities: ['WiFi', 'Breakfast']
    },
    {
        id: 'h4',
        name: 'Thar Desert Luxury Camp',
        location: 'Jaisalmer, Rajasthan',
        rating: 4.7,
        price: 15000,
        image: 'https://images.unsplash.com/photo-1534067783842-19e9102c98cd?auto=format&fit=crop&q=80',
        amenities: ['WiFi', 'Breakfast']
    }
];

const HomeHotels = () => {
    return (
        <section className="py-20 bg-black text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold mb-4 font-display"
                        >
                            Featured Stays
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-400 text-lg max-w-2xl"
                        >
                            Handpicked collections for your next journey. Experience luxury, comfort, and culture.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            to="/hotels"
                            className="group flex items-center gap-2 text-white font-medium border-b border-white/30 pb-1 hover:border-white transition-colors"
                        >
                            View All Hotels
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {hotels.map((hotel, index) => (
                        <motion.div
                            key={hotel.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                        >
                            {/* Image Badge */}
                            <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-bold">{hotel.rating}</span>
                            </div>

                            {/* Image */}
                            <div className="h-64 overflow-hidden relative">
                                <img
                                    src={hotel.image}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-80" />
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors truncate">{hotel.name}</h3>
                                <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
                                    <MapPin className="w-3 h-3" />
                                    <span>{hotel.location}</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                                    {hotel.amenities.map((amenity, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5">
                                            {amenity === 'WiFi' ? <Wifi className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Starts From</p>
                                        <p className="text-lg font-bold text-white">
                                            ₹{hotel.price.toLocaleString()}
                                            <span className="text-slate-500 text-xs font-normal"> /night</span>
                                        </p>
                                    </div>
                                    <Link
                                        to={`/hotels/${hotel.id}`}
                                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors transform active:scale-95"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomeHotels;
