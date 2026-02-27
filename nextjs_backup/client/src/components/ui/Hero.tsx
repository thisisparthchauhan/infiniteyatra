import React from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Users, MapPin } from 'lucide-react';

const Hero = () => {
    return (
        <div className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80"
                    alt="Luxury Hotel"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium tracking-wider mb-6">
                        INFINITE YATRA HOTELS
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Sanctuary</span>
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 font-light">
                        Curated stays for the modern explorer. From luxury resorts to trekking basecamps.
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-full p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2"
                >
                    {/* Location Input */}
                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
                        <MapPin className="text-zinc-400" size={20} />
                        <div className="text-left w-full">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Destination</label>
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                className="w-full bg-transparent outline-none text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400"
                            />
                        </div>
                    </div>

                    {/* Dates Input */}
                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
                        <Calendar className="text-zinc-400" size={20} />
                        <div className="text-left w-full">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Check-in - Check-out</label>
                            <input
                                type="text"
                                placeholder="Add dates"
                                className="w-full bg-transparent outline-none text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400"
                            />
                        </div>
                    </div>

                    {/* Guests Input */}
                    <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full">
                        <Users className="text-zinc-400" size={20} />
                        <div className="text-left w-full">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Guests</label>
                            <input
                                type="text"
                                placeholder="Add guests"
                                className="w-full bg-transparent outline-none text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400"
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <button className="bg-zinc-900 dark:bg-white text-white dark:text-black p-4 rounded-full hover:scale-105 transition-transform duration-200 shadow-lg">
                        <Search size={24} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
