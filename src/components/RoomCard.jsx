
import React, { useState } from 'react';
import { Bed, User, ChevronDown, ChevronUp, Check, Info } from 'lucide-react';

const RoomCard = ({ room, hotelImage }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Group amenities for display
    const amenityGroups = [
        { title: 'Bathroom', items: room.bathroom },
        { title: 'Dining', items: room.dining },
        { title: 'General', items: room.general },
        { title: 'Media', items: room.media }
    ].filter(group => group.items && group.items.length > 0);

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group">
            <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-80 shrink-0 relative overflow-hidden h-64 md:h-auto">
                    <img
                        src={room.image || room.images?.[0] || hotelImage}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-white">{room.name}</h3>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-zinc-400">{room.bedType || 'Double Bed'}</span>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-3 mb-6">
                            {room.size && (
                                <span className="bg-white/10 text-zinc-300 text-xs px-3 py-1.5 rounded font-medium">
                                    Size: {room.size}
                                </span>
                            )}
                            <span className="bg-white/10 text-zinc-300 text-xs px-3 py-1.5 rounded font-medium">
                                Max capacity: {room.occupancy}
                            </span>
                        </div>

                        {/* Toggle Details */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-orange-500 uppercase tracking-wider transition-colors mb-4"
                        >
                            Room Details
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>

                    {/* Room Options / Variants Table */}
                    <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
                        {room.variants ? (
                            room.variants.map((variant) => (
                                <div key={variant.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/[0.05] transition-colors">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-white text-sm">{variant.name}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {variant.inclusions && variant.inclusions.map((inc, i) => (
                                                <span key={i} className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 flex items-center gap-1">
                                                    <Check size={10} /> {inc}
                                                </span>
                                            ))}
                                            {variant.tags && variant.tags.map((tag, i) => (
                                                <span key={i} className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="text-right">
                                            {variant.originalPrice && (
                                                <span className="block text-xs text-zinc-500 line-through">₹{variant.originalPrice.toLocaleString()}</span>
                                            )}
                                            <span className="block text-lg font-bold text-white">₹{variant.price.toLocaleString()}</span>
                                            <span className="text-[10px] text-zinc-500">per night</span>
                                        </div>
                                        <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Fallback for rooms without variants
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-2xl font-bold text-white">₹{parseInt(room.price).toLocaleString()}</span>
                                    <span className="text-xs text-zinc-500 ml-1">/ night</span>
                                </div>
                                <button className="bg-white text-black px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                                    Select Room
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Details */}
            {isExpanded && (
                <div className="border-t border-white/10 bg-white/[0.02] p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {amenityGroups.map((group, idx) => (
                            <div key={idx}>
                                <h4 className="font-bold text-white text-sm mb-3">{group.title}</h4>
                                <ul className="space-y-2">
                                    {group.items.map((item, i) => (
                                        <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomCard;
