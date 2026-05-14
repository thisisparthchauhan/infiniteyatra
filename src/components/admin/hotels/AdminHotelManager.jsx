import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Search, Edit2, Trash2, MapPin, Star, Building2, Zap, Hotel,
    Globe, SlidersHorizontal, Eye, EyeOff, LayoutGrid, List
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import AdminHotelForm from './AdminHotelForm';
import AdminCityManager from './AdminCityManager';
import { hotels as staticHotels } from '../../../data/hotels';
import { useRole } from '../../../context/RoleContext';
import { USER_ROLES } from '../../../config/roles';
import { useAuth } from '../../../context/AuthContext';

const PARTNER_LABELS = {
    bloom: { label: 'Bloom Hotels', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    iy: { label: 'IY Direct', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    other: { label: 'Partner', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const AdminHotelManager = () => {
    const { currentRole } = useRole();
    const { currentUser } = useAuth();

    // Tab: 'hotels' | 'cities'
    const [activeTab, setActiveTab] = useState('hotels');

    // Hotel state
    const [hotels, setHotels] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentHotel, setCurrentHotel] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCity, setFilterCity] = useState('all');
    const [filterPartner, setFilterPartner] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // ── Fetch Hotels ────────────────────────────────────────────────────────
    const fetchHotels = async () => {
        setLoading(true);
        try {
            let q = collection(db, 'hotels');
            if (currentRole === USER_ROLES.HOTEL_PARTNER && currentUser?.uid) {
                q = query(collection(db, 'hotels'), where('ownerId', '==', currentUser.uid));
            }
            const snap = await getDocs(q);
            const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (fetched.length === 0 && currentRole !== USER_ROLES.HOTEL_PARTNER) {
                setHotels(staticHotels);
            } else {
                setHotels(fetched);
            }
        } catch (err) {
            console.error('Error fetching hotels:', err);
            if (currentRole !== USER_ROLES.HOTEL_PARTNER) setHotels(staticHotels);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch Cities (for filter dropdown) ────────────────────────────────
    const fetchCities = async () => {
        try {
            const snap = await getDocs(collection(db, 'hotel_cities'));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setCities(data);
        } catch (err) {
            console.error('Error fetching cities:', err);
        }
    };

    useEffect(() => {
        fetchHotels();
        fetchCities();
    }, []);

    // ── Save Hotel ────────────────────────────────────────────────────────
    const handleSaveHotel = async (hotelData) => {
        setLoading(true);
        try {
            let hotelId = hotelData.id;
            if (!hotelId) {
                hotelId = hotelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            const finalData = { ...hotelData, id: hotelId };
            if (currentRole === USER_ROLES.HOTEL_PARTNER && currentUser?.uid) {
                finalData.ownerId = currentUser.uid;
                finalData.status = 'Pending Approval';
            }
            await setDoc(doc(db, 'hotels', hotelId), finalData, { merge: true });
            await fetchHotels();
            setIsFormOpen(false);
            setCurrentHotel(null);
        } catch (err) {
            console.error('Error saving hotel:', err);
            alert(`Failed to save hotel: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ── Delete Hotel ──────────────────────────────────────────────────────
    const handleDeleteHotel = async (hotelId) => {
        if (!window.confirm('Are you sure you want to delete this hotel?')) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'hotels', hotelId));
            await fetchHotels();
        } catch (err) {
            alert('Failed to delete hotel.');
        } finally {
            setLoading(false);
        }
    };

    // ── Toggle Visibility ────────────────────────────────────────────────
    const toggleVisibility = async (hotel) => {
        await setDoc(doc(db, 'hotels', hotel.id), { isVisible: !hotel.isVisible }, { merge: true });
        await fetchHotels();
    };

    // ── Filtered Hotels ───────────────────────────────────────────────────
    const filteredHotels = useMemo(() => {
        return hotels.filter(h => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || h.name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q);
            const matchCity = filterCity === 'all' || h.city === filterCity || h.location === filterCity;
            const matchPartner = filterPartner === 'all' || h.partner === filterPartner;
            const matchStatus = filterStatus === 'all'
                || (filterStatus === 'active' && h.isVisible)
                || (filterStatus === 'hidden' && !h.isVisible)
                || (filterStatus === 'pending' && h.status === 'Pending Approval');
            return matchSearch && matchCity && matchPartner && matchStatus;
        });
    }, [hotels, searchQuery, filterCity, filterPartner, filterStatus]);

    // ── Unique city names from hotels (fallback if no hotel_cities) ───────
    const hotelCities = useMemo(() => {
        const set = new Set(hotels.map(h => h.city || h.location).filter(Boolean));
        return [...set].sort();
    }, [hotels]);

    const cityOptions = cities.length > 0 ? cities.map(c => c.name) : hotelCities;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── Tab Bar ─────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                <button
                    onClick={() => setActiveTab('hotels')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'hotels' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Hotel size={15} /> Hotels
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{hotels.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('cities')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'cities' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Globe size={15} /> Cities
                </button>
            </div>

            {/* ── CITIES TAB ──────────────────────────────────────────────── */}
            {activeTab === 'cities' && <AdminCityManager />}

            {/* ── HOTELS TAB ──────────────────────────────────────────────── */}
            {activeTab === 'hotels' && (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-5 rounded-2xl border border-white/10 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Hotel className="text-blue-400" /> Hotel Management
                            </h3>
                            <p className="text-slate-400 text-sm mt-0.5">
                                {filteredHotels.length} of {hotels.length} hotels
                                {filterCity !== 'all' && ` in ${filterCity}`}
                                {filterPartner !== 'all' && ` · ${PARTNER_LABELS[filterPartner]?.label}`}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {/* View toggle */}
                            <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500'}`}><LayoutGrid size={15} /></button>
                                <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500'}`}><List size={15} /></button>
                            </div>
                            <button
                                onClick={() => { setCurrentHotel(null); setIsFormOpen(true); }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={15} /> Add Hotel
                            </button>
                        </div>
                    </div>

                    {/* ── Filters Row ────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-3 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                            <Search size={16} className="text-slate-500 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by hotel name or city…"
                                className="bg-transparent outline-none text-white text-sm w-full placeholder:text-slate-500"
                            />
                        </div>

                        {/* City filter */}
                        <select
                            value={filterCity}
                            onChange={e => setFilterCity(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-amber-500/50 min-w-[140px]"
                        >
                            <option value="all">All Cities</option>
                            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Partner filter */}
                        <select
                            value={filterPartner}
                            onChange={e => setFilterPartner(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-amber-500/50 min-w-[140px]"
                        >
                            <option value="all">All Partners</option>
                            <option value="bloom">Bloom Hotels</option>
                            <option value="iy">IY Direct</option>
                            <option value="other">Other</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-amber-500/50 min-w-[120px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="hidden">Hidden</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* ── Hotel Cards ─────────────────────────────────────── */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden animate-pulse">
                                    <div className="h-44 bg-white/5" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-white/5 rounded w-3/4" />
                                        <div className="h-3 bg-white/5 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredHotels.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
                            <p className="text-slate-400 text-lg">No hotels found.</p>
                            <p className="text-slate-600 text-sm">Try adjusting your filters or add a new hotel.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredHotels.map((hotel, i) => (
                                <motion.div
                                    key={hotel.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all group hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/10"
                                >
                                    {/* Image */}
                                    <div className="h-44 relative overflow-hidden">
                                        {hotel.image ? (
                                            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                <Hotel size={40} className="text-zinc-700" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                                            {hotel.partner && PARTNER_LABELS[hotel.partner] && (
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${PARTNER_LABELS[hotel.partner].color}`}>
                                                    {PARTNER_LABELS[hotel.partner].label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border border-white/10 ${hotel.isVisible ? 'bg-green-500/20 text-green-400' : 'bg-zinc-600/40 text-zinc-400'}`}>
                                                {hotel.status === 'Pending Approval' ? 'Pending' : hotel.isVisible ? 'Active' : 'Hidden'}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                            <div>
                                                <h3 className="text-base font-bold text-white leading-tight line-clamp-1">{hotel.name}</h3>
                                                <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {hotel.city || hotel.location}</p>
                                            </div>
                                            <span className="bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white shrink-0">
                                                ₹{parseInt(hotel.price || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 space-y-2">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" /> {hotel.rating || '—'}
                                            </span>
                                            <span>{hotel.rooms?.length || 0} room types</span>
                                            <span>{hotel.amenities?.length || 0} amenities</span>
                                        </div>

                                        {hotel.costPrice && (
                                            <div className="flex justify-between text-xs text-slate-500 border-t border-white/5 pt-2">
                                                <span>Cost: ₹{parseInt(hotel.costPrice).toLocaleString('en-IN')}</span>
                                                <span className="text-green-400">Margin: {Math.round(((hotel.price - hotel.costPrice) / hotel.price) * 100)}%</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => handleDeleteHotel(hotel.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                            <button onClick={() => toggleVisibility(hotel)} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded-lg transition-colors" title={hotel.isVisible ? 'Hide' : 'Show'}>
                                                {hotel.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                            <button
                                                onClick={() => { setCurrentHotel({ ...hotel, name: `${hotel.name} (Copy)`, id: null }); setIsFormOpen(true); }}
                                                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg transition-colors"
                                                title="Duplicate"
                                            >
                                                <Zap size={14} />
                                            </button>
                                            <button
                                                onClick={() => { setCurrentHotel(hotel); setIsFormOpen(true); }}
                                                className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <Edit2 size={13} /> Edit
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        /* List View */
                        <div className="space-y-2">
                            {filteredHotels.map((hotel, i) => (
                                <motion.div
                                    key={hotel.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="flex items-center gap-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all group"
                                >
                                    <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                                        {hotel.image ? (
                                            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center"><Hotel size={18} className="text-zinc-600" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{hotel.name}</p>
                                        <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={10} /> {hotel.city || hotel.location}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2">
                                        {hotel.partner && PARTNER_LABELS[hotel.partner] && (
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${PARTNER_LABELS[hotel.partner].color}`}>
                                                {PARTNER_LABELS[hotel.partner].label}
                                            </span>
                                        )}
                                        <span className="text-blue-400 font-bold text-sm">₹{parseInt(hotel.price || 0).toLocaleString('en-IN')}</span>
                                        <span className="text-xs flex items-center gap-0.5 text-yellow-400"><Star size={11} className="fill-yellow-400" />{hotel.rating || '—'}</span>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => toggleVisibility(hotel)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                            {hotel.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button onClick={() => { setCurrentHotel(hotel); setIsFormOpen(true); }} className="p-2 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/10 transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteHotel(hotel.id)} className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Hotel Form Modal ─────────────────────────────────────────── */}
            {isFormOpen && (
                <AdminHotelForm
                    initialData={currentHotel}
                    cities={cities}
                    onSave={handleSaveHotel}
                    onCancel={() => { setIsFormOpen(false); setCurrentHotel(null); }}
                />
            )}
        </div>
    );
};

export default AdminHotelManager;
