import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Fuel, Briefcase, MapPin, CheckCircle } from 'lucide-react';

const TransportVehicleCard = ({ vehicle, layout = 'grid' }) => {
    const navigate = useNavigate();

    const handleBook = () => {
        navigate(`/transport/book/${vehicle.id}`);
    };

    const isList = layout === 'list';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`bg-slate-900/80 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 border border-slate-800 flex ${isList ? 'flex-col md:flex-row' : 'flex-col'} group cursor-pointer backdrop-blur-sm`}
            onClick={handleBook}
        >
            {/* Image Section */}
            <div className={`relative overflow-hidden ${isList ? 'md:w-2/5 h-48 md:h-auto' : 'h-56'}`}>
                <img
                    src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?auto=format&fit=crop&q=80'}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {vehicle.totalBookings > 10 && (
                        <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                            Popular
                        </span>
                    )}
                    <span className="bg-black/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold capitalize border border-white/20">
                        {vehicle.type}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className={`p-4 md:p-5 flex flex-col justify-between flex-1 ${isList ? 'md:w-3/5' : ''}`}>

                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                            {vehicle.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-400 mb-4 font-medium">
                        <MapPin size={14} className="text-slate-500 shrink-0" />
                        <span className="truncate">{vehicle.city}, {vehicle.state}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-4 p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/30">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Users size={16} className="text-slate-500" />
                            <span>{vehicle.seats} Seats</span>
                        </div>
                        {vehicle.driverIncluded && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Briefcase size={16} className="text-slate-500" />
                                <span>With Driver</span>
                            </div>
                        )}
                        {vehicle.fuelIncluded && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Fuel size={16} className="text-slate-500" />
                                <span>Fuel Included</span>
                            </div>
                        )}
                    </div>

                    {/* Features Preview (Up to 3) */}
                    {vehicle.features && vehicle.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {vehicle.features.slice(0, 3).map((feature, idx) => (
                                <span key={idx} className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-1 rounded-md">
                                    <CheckCircle size={12} className="text-blue-500" />
                                    {feature}
                                </span>
                            ))}
                            {vehicle.features.length > 3 && (
                                <span className="text-[11px] font-medium text-slate-500 flex items-center px-1">
                                    +{vehicle.features.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-800/50 mt-2">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="text-left">
                            <p className="text-[10px] md:text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Price</p>
                            <p className="text-xl md:text-2xl font-black text-blue-400 leading-none">₹{vehicle.pricePerDay}<span className="text-xs text-slate-500 font-medium ml-1">/day</span></p>
                        </div>
                    </div>

                    <button
                        className="w-full min-h-[44px] bg-slate-800 border border-slate-700 hover:bg-blue-600 hover:border-blue-500 text-white font-bold py-2.5 rounded-xl transition-all duration-300 text-sm md:text-base flex items-center justify-center gap-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleBook();
                        }}
                    >
                        View & Book
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default TransportVehicleCard;
