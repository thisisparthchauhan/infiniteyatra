import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bed, Users, ChevronDown, ChevronUp, Check, X, Maximize2,
    Wifi, Wind, Tv, Coffee, Bath, ShowerHead, Shirt, UtensilsCrossed,
    Refrigerator, Armchair, Lock, Droplets, Sparkles, Shield, ImageIcon
} from 'lucide-react';

const AMENITY_ICONS = {
    'WiFi': Wifi, 'Air Conditioning': Wind, 'Flat-screen TV': Tv, 'Cable channels': Tv,
    'Streaming services': Tv, 'Tea/Coffee maker': Coffee, 'Electric kettle': Coffee,
    'Bathtub': Bath, 'Walk-in shower': ShowerHead, 'Shower': ShowerHead,
    'Bathrobe': Shirt, 'Hair dryer': Droplets, 'Mini-bar': Refrigerator,
    'Refrigerator': Refrigerator, 'Microwave': UtensilsCrossed, 'Kitchenette': UtensilsCrossed,
    'Dining table': UtensilsCrossed, 'Bottled water': Droplets, 'Sofa': Armchair,
    'Seating Area': Armchair, 'Sitting area': Armchair, 'Safe': Lock, 'Wardrobe': Lock,
    'Ironing facilities': Shirt, 'Desk': Armchair, 'Towels': Shirt, 'Slippers': Shirt,
    'Free toiletries': Sparkles, 'Shower cap': Droplets, '2 Bathrooms': Bath,
    'Private Entrance': Lock, 'Laundry': Shirt,
};

const RoomCard = ({ room, hotelImage, onSelectVariant }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const images = room.images?.length > 0 ? room.images : [room.image || hotelImage];
    const roomCount = room.count || 0;
    const isLowStock = roomCount > 0 && roomCount <= 3;

    const amenityGroups = [
        { title: 'Bathroom', icon: <Bath size={14} />, items: room.bathroom },
        { title: 'Dining & Kitchen', icon: <Coffee size={14} />, items: room.dining },
        { title: 'Room Facilities', icon: <Armchair size={14} />, items: room.general },
        { title: 'Entertainment', icon: <Tv size={14} />, items: room.media }
    ].filter(group => group.items && group.items.length > 0);

    const allAmenities = [...(room.bathroom || []), ...(room.dining || []), ...(room.general || []), ...(room.media || [])];

    const lowestPrice = room.variants
        ? Math.min(...room.variants.map(v => v.price))
        : room.price;

    const highestOriginal = room.variants
        ? Math.max(...room.variants.filter(v => v.originalPrice).map(v => v.originalPrice), 0)
        : null;

    const discount = highestOriginal && lowestPrice < highestOriginal
        ? Math.round(((highestOriginal - lowestPrice) / highestOriginal) * 100)
        : 0;

    return (
        <motion.div
            layout
            className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 group"
        >
            {/* Main Row: Image + Info + Price */}
            <div className="flex flex-col lg:flex-row">

                {/* Room Image */}
                <div className="w-full lg:w-72 xl:w-80 shrink-0 relative overflow-hidden h-56 lg:h-auto">
                    <img
                        src={images[activeImageIdx]}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Image Count Badge */}
                    {images.length > 1 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs text-white">
                            <ImageIcon size={12} />
                            <span>{images.length} photos</span>
                        </div>
                    )}

                    {/* Image Dots */}
                    {images.length > 1 && (
                        <div className="absolute bottom-3 right-3 flex gap-1">
                            {images.slice(0, 5).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImageIdx(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImageIdx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Low Stock Badge */}
                    {isLowStock && (
                        <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            Only {roomCount} left!
                        </div>
                    )}

                    {/* Discount Badge */}
                    {discount > 0 && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                            {discount}% OFF
                        </div>
                    )}
                </div>

                {/* Room Info */}
                <div className="flex-1 p-5 lg:p-6 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">{room.name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                                <span className="flex items-center gap-1.5">
                                    <Bed size={14} className="text-blue-400" />
                                    {room.bedType || 'Double Bed'}
                                </span>
                                {room.size && (
                                    <span className="flex items-center gap-1.5">
                                        <Maximize2 size={14} className="text-purple-400" />
                                        {room.size}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Users size={14} className="text-orange-400" />
                                    Max {room.occupancy} guest{room.occupancy > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Description */}
                    {room.description && (
                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{room.description}</p>
                    )}

                    {/* Quick Amenities Preview */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {allAmenities.slice(0, 6).map((amenity, idx) => {
                            const Icon = AMENITY_ICONS[amenity] || Check;
                            return (
                                <span key={idx} className="flex items-center gap-1 text-[11px] text-zinc-400 bg-white/5 px-2 py-1 rounded-lg">
                                    <Icon size={11} className="text-zinc-500" />
                                    {amenity}
                                </span>
                            );
                        })}
                        {allAmenities.length > 6 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg transition-colors"
                            >
                                +{allAmenities.length - 6} more
                            </button>
                        )}
                    </div>

                    {/* Expandable Details Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-400 transition-colors self-start"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Hide room details' : 'View all room details'}
                    </button>
                </div>

                {/* Price Column (Desktop) */}
                <div className="hidden lg:flex flex-col items-end justify-center p-6 border-l border-white/5 min-w-[180px]">
                    {highestOriginal > 0 && (
                        <span className="text-xs text-zinc-500 line-through mb-0.5">
                            ₹{highestOriginal.toLocaleString()}
                        </span>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">₹{lowestPrice.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 mb-3">per night + taxes</span>
                    {room.variants ? (
                        <span className="text-[10px] text-green-400 font-medium">
                            {room.variants.length} option{room.variants.length > 1 ? 's' : ''} available
                        </span>
                    ) : (
                        <button
                            onClick={() => onSelectVariant?.(room, null)}
                            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                        >
                            Select Room
                        </button>
                    )}
                </div>
            </div>

            {/* Expandable Room Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-white/10 bg-white/[0.02] p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {amenityGroups.map((group, idx) => (
                                    <div key={idx}>
                                        <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                                            <span className="text-orange-400">{group.icon}</span>
                                            {group.title}
                                        </h4>
                                        <ul className="space-y-2">
                                            {group.items.map((item, i) => (
                                                <li key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                                                    <Check size={10} className="text-green-500 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Room Variants / Rate Options (Booking.com style) */}
            {room.variants && room.variants.length > 0 && (
                <div className="border-t border-white/10">
                    <div className="p-4 pb-2">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Choose your option</h4>
                    </div>
                    <div className="space-y-0">
                        {room.variants.map((variant, vIdx) => {
                            const isSelected = selectedVariant === variant.id;
                            const savings = variant.originalPrice
                                ? variant.originalPrice - variant.price
                                : 0;

                            return (
                                <div
                                    key={variant.id || vIdx}
                                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-5 py-4 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-orange-500/10 border-l-4 border-l-orange-500'
                                            : 'bg-transparent hover:bg-white/[0.03] border-l-4 border-l-transparent'
                                    } ${vIdx < room.variants.length - 1 ? 'border-b border-white/5' : ''}`}
                                    onClick={() => setSelectedVariant(isSelected ? null : variant.id)}
                                >
                                    {/* Variant Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-semibold text-white text-sm">{variant.name}</h5>
                                            {savings > 0 && (
                                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                    Save ₹{savings.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Inclusions */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {variant.inclusions?.map((inc, i) => (
                                                <span key={i} className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                                    <Check size={9} strokeWidth={3} /> {inc}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {variant.tags?.map((tag, i) => {
                                                const isPositive = tag.includes('Free') || tag.includes('Breakfast') || tag.includes('Included');
                                                const isNegative = tag.includes('Non-refundable') || tag.includes('No cancellation');
                                                return (
                                                    <span
                                                        key={i}
                                                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                                            isPositive ? 'text-green-400 bg-green-500/10' :
                                                            isNegative ? 'text-amber-400 bg-amber-500/10' :
                                                            'text-zinc-400 bg-white/5'
                                                        }`}
                                                    >
                                                        {isPositive && <Check size={9} className="inline mr-0.5" strokeWidth={3} />}
                                                        {tag}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Price + CTA */}
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="text-right">
                                            {variant.originalPrice && (
                                                <span className="block text-xs text-zinc-500 line-through">
                                                    ₹{variant.originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                            <span className="block text-xl font-bold text-white">
                                                ₹{variant.price.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">per night + taxes</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectVariant?.(room, variant);
                                            }}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/25 hover:from-orange-600 hover:to-red-700'
                                                    : 'bg-white/10 text-white hover:bg-white/20 shadow-none border border-white/10'
                                            }`}
                                        >
                                            {isSelected ? 'Book Now' : 'Select'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mobile Price Bar (when no variants or fallback) */}
            {(!room.variants || room.variants.length === 0) && (
                <div className="lg:hidden border-t border-white/10 p-4 flex items-center justify-between">
                    <div>
                        <span className="text-xl font-bold text-white">₹{parseInt(room.price).toLocaleString()}</span>
                        <span className="text-xs text-zinc-500 ml-1">/ night + taxes</span>
                    </div>
                    <button
                        onClick={() => onSelectVariant?.(room, null)}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        Select Room
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default RoomCard;
