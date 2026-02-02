import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Wifi, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

const HotelCard = ({ id, slug, name, city, rating, price, imageUrl }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-800"
        >
            <div className="relative h-64 w-full overflow-hidden">
                <img
                    src={imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span>{rating}</span>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{name}</h3>
                        <div className="flex items-center gap-1 text-zinc-500 text-sm">
                            <MapPin size={14} />
                            <span>{city}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 my-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    {/* Icons Placeholder for Amenities */}
                    <div className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Wifi size={14} />
                        <span>WiFi</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500 text-xs">
                        <Coffee size={14} />
                        <span>Breakfast</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div>
                        <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Starts from</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-zinc-900 dark:text-white">₹{price.toLocaleString()}</span>
                            <span className="text-sm text-zinc-500">/night</span>
                        </div>
                    </div>

                    <Link to={`/hotels/${id}`} className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                        View Details
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default HotelCard;
