import React from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
                    alt="Mountain Landscape"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-6 text-center text-white">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
                >
                    Discover Your Next <br />
                    <span className="text-blue-400">Adventure</span>
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-1 bg-white w-48 mx-auto mb-8 rounded-full"
                />

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-3xl md:text-5xl text-white font-bold mb-10 max-w-2xl mx-auto tracking-wide"
                >
                    Explore Infinite Yatra
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="bg-white p-2 rounded-full shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-2"
                >
                    <div className="flex-1 flex items-center gap-3 px-6 py-3 w-full border-b md:border-b-0 md:border-r border-slate-100">
                        <MapPin className="text-blue-500 shrink-0" size={20} />
                        <div className="text-left w-full">
                            <label className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Location</label>
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                className="w-full outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex items-center gap-3 px-6 py-3 w-full border-b md:border-b-0 md:border-r border-slate-100">
                        <Calendar className="text-blue-500 shrink-0" size={20} />
                        <div className="text-left w-full">
                            <label className="block text-xs text-slate-400 font-medium uppercase tracking-wider">Date</label>
                            <input
                                type="text"
                                placeholder="Add dates"
                                className="w-full outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                            />
                        </div>
                    </div>

                    <div className="p-2 w-full md:w-auto">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full w-full md:w-auto transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                            <Search size={20} />
                            <span className="md:hidden font-medium">Search</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
