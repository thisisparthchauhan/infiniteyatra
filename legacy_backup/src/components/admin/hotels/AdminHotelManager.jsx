import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, MapPin, Star, Building2, Database, Zap, Hotel } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import AdminHotelForm from './AdminHotelForm';
import { hotels as staticHotels } from '../../../data/hotels';
import { useRole } from '../../../context/RoleContext';
import { USER_ROLES } from '../../../config/roles';
import { where, query } from 'firebase/firestore'; // Check imports
import { useAuth } from '../../../context/AuthContext';

const AdminHotelManager = () => {
    const { currentRole } = useRole();
    const { currentUser } = useAuth();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentHotel, setCurrentHotel] = useState(null);

    // Fetch Hotels
    const fetchHotels = async () => {
        setLoading(true);
        try {
            let q = collection(db, 'hotels');

            // PARTNER PORTAL LOGIC
            // If Partner, only show their own hotels
            if (currentRole === USER_ROLES.HOTEL_PARTNER && currentUser?.uid) {
                // Assuming 'ownerId' field exists. If not, this will return empty, which is correct (secure).
                q = query(collection(db, 'hotels'), where('ownerId', '==', currentUser.uid));
            }

            const querySnapshot = await getDocs(q);
            const fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (fetchedHotels.length === 0 && currentRole !== USER_ROLES.HOTEL_PARTNER) {
                // Only fallback to static if NOT a partner (partners start Empty)
                console.log("No hotels in DB, using static data for preview");
                setHotels([]);
            } else {
                setHotels(fetchedHotels);
            }
        } catch (error) {
            console.error("Error fetching hotels:", error);
            if (currentRole !== USER_ROLES.HOTEL_PARTNER) setHotels(staticHotels);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    // Handle Save (Create/Update)
    const handleSaveHotel = async (hotelData) => {
        setLoading(true);
        try {
            let hotelId = hotelData.id;
            if (!hotelId) {
                // Generate ID from name
                hotelId = hotelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }

            // Assign Owner ID for Partners
            const finalData = { ...hotelData, id: hotelId };
            if (currentRole === USER_ROLES.HOTEL_PARTNER && currentUser?.uid) {
                finalData.ownerId = currentUser.uid;
                finalData.status = 'Pending Approval'; // Partner edits need approval
            }

            await setDoc(doc(db, 'hotels', hotelId), finalData, { merge: true });
            await fetchHotels(); // Refresh list
            setIsFormOpen(false);
            setCurrentHotel(null);
            // alert("Hotel saved successfully!");
        } catch (error) {
            console.error("Error saving hotel:", error);
            alert("Failed to save hotel.");
        } finally {
            setLoading(false);
        }
    };

    // Handle Delete
    const handleDeleteHotel = async (hotelId) => {
        if (!window.confirm("Are you sure you want to delete this hotel?")) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'hotels', hotelId));
            await fetchHotels();
        } catch (error) {
            console.error("Error deleting hotel:", error);
            alert("Failed to delete hotel.");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredHotels = hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMigrate = async () => {
        if (!window.confirm("Load static mock data into database?")) return;
        setLoading(true);
        try {
            for (const h of staticHotels) {
                await setDoc(doc(db, 'hotels', h.id), h);
            }
            await fetchHotels();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Hotel className="text-blue-400" /> Hotel Management
                    </h3>
                    <p className="text-slate-400 text-sm">Manage hotel partners, inventory, and pricing.</p>
                </div>
                <div className="flex gap-3">
                    {/* Dev Tool: Reset Data */}
                    {hotels.length === 0 && (
                        <button onClick={handleMigrate} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
                            <Database size={16} /> Load Demo Data
                        </button>
                    )}
                    <button
                        onClick={() => { setCurrentHotel(null); setIsFormOpen(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Hotel
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hotels by name or city..."
                    className="bg-transparent border-none outline-none text-white w-full placeholder:text-slate-500"
                />
            </div>

            {/* Grid View */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading hotels...</div>
            ) : filteredHotels.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-slate-400 text-lg">No hotels found.</p>
                    <p className="text-slate-600 text-sm">Add a new hotel to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredHotels.map((hotel) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={hotel.id}
                            className="glass-card group rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 bg-[#0a0a0a]"
                        >
                            {/* Image Area */}
                            <div className="h-48 relative overflow-hidden">
                                {hotel.image ? (
                                    <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                                        <Hotel size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                <div className="absolute top-4 right-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 flex items-center gap-1 backdrop-blur-md ${hotel.isVisible ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {hotel.isVisible ? 'Active' : 'Draft'}
                                    </span>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md line-clamp-1">{hotel.name}</h3>
                                        <div className="flex items-center gap-2 text-slate-300 text-xs mt-1">
                                            <MapPin size={12} /> {hotel.city}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-400 mb-0.5">Starting from</span>
                                        <span className="bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white shadow-lg">
                                            ₹{parseInt(hotel.price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-4 bg-white/5 space-y-3">
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500" /> {hotel.rating || 'New'}</span>
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                                        {hotel.amenities?.length || 0} Amenities
                                    </span>
                                </div>

                                {hotel.costPrice && (
                                    <div className="text-xs text-slate-500 flex justify-between border-t border-white/5 pt-2">
                                        <span>Cost: ₹{parseInt(hotel.costPrice).toLocaleString()}</span>
                                        <span className="text-green-500">Margin: {Math.round(((hotel.price - hotel.costPrice) / hotel.price) * 100)}%</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-white/5 flex gap-2">
                                    <button
                                        onClick={() => handleDeleteHotel(hotel.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors flex items-center justify-center"
                                        title="Delete Hotel"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Clone to avoid reference issues
                                            const hotelCopy = { ...hotel, name: `${hotel.name} (Copy)`, id: null };
                                            delete hotelCopy.id;
                                            setCurrentHotel(hotelCopy);
                                            setIsFormOpen(true);
                                        }}
                                        className="px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/20 rounded-lg transition-colors flex items-center justify-center"
                                        title="Duplicate"
                                    >
                                        <Zap size={16} />
                                    </button>
                                    <button
                                        onClick={() => { setCurrentHotel(hotel); setIsFormOpen(true); }}
                                        className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={16} /> Edit Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isFormOpen && (
                <AdminHotelForm
                    initialData={currentHotel}
                    onSave={handleSaveHotel}
                    onCancel={() => { setIsFormOpen(false); setCurrentHotel(null); }}
                />
            )}
        </div>
    );
};

export default AdminHotelManager;
