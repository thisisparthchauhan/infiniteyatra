import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Wifi, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

const HotelCard = ({ id, slug, name, city, location, rating, price, image, imageUrl, amenities }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-[#111] rounded-2xl overflow-hidden shadow-lg border border-white/10 hover:border-white/20 transition-all"
        >
            <div className="relative h-64 w-full overflow-hidden">
                <img
                    src={image || imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {rating && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm border border-white/10">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-white">{rating}</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                        <div className="flex items-center gap-1 text-zinc-500 text-sm">
                            <MapPin size={14} className="text-orange-400" />
                            <span>{location || city}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 my-4 border-t border-white/10 pt-4">
                    {amenities && amenities.length > 0 ? (
                        amenities.slice(0, 2).map((amenity, i) => (
                            <div key={i} className="flex items-center gap-1 text-zinc-500 text-xs">
                                {amenity === 'WiFi' ? <Wifi size={14} /> : <Coffee size={14} />}
                                <span>{amenity}</span>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                                <Wifi size={14} />
                                <span>WiFi</span>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-500 text-xs">
                                <Coffee size={14} />
                                <span>Breakfast</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div>
                        <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Starts from</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white">₹{Number(price || 0).toLocaleString()}</span>
                            <span className="text-sm text-zinc-500">/night</span>
                        </div>
                    </div>

                    <Link to={`/hotels/${id}`} className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/20">
                        View Details
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default HotelCard;
