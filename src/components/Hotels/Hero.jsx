import React from 'react';
import { motion } from 'framer-motion';

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
            </div>
        </div>
    );
};

export default Hero;
