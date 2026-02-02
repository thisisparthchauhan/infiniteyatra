import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, MapPin, Star } from 'lucide-react';

const AdminHotelManager = () => {
    const [hotels, setHotels] = useState([
        {
            id: '1',
            name: 'The Grand IY Resort',
            city: 'Goa',
            rating: 4.8,
            price: 12000,
            status: 'Active'
        },
        {
            id: '2',
            name: 'Himalayan Sanctuary',
            city: 'Manali',
            rating: 4.9,
            price: 8500,
            status: 'Active'
        }
    ]);

    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Hotel Management</h2>
                    <p className="text-slate-400">Add, edit, and manage hotel partners</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                    <Plus size={20} />
                    Add Hotel
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search hotels..."
                    className="bg-transparent border-none outline-none text-white w-full"
                />
            </div>

            {/* Hotel List */}
            <div className="grid gap-4">
                {hotels.map((hotel) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={hotel.id}
                        className="bg-white/5 p-6 rounded-xl border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-zinc-600">IMG</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">{hotel.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {hotel.city}</span>
                                    <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {hotel.rating}</span>
                                    <span className="text-green-400 px-2 py-0.5 bg-green-500/10 rounded-full text-xs">{hotel.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
                                <Edit2 size={18} />
                            </button>
                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Simple Add Form Modal (Mockup) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold text-white mb-6">Add New Hotel</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Hotel Name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500" />
                            <input type="text" placeholder="City" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500" />
                            <input type="number" placeholder="Base Price" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-slate-300">Cancel</button>
                            <button onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white">Save Hotel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHotelManager;
