import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import SEO from '../../components/SEO';
import { X, Plus, ChevronRight, Star, MapPin, Loader2, Wifi, Coffee, Car, Waves, Dumbbell, Wind, CheckCircle2, XCircle, Building2 } from 'lucide-react';

const AMENITY_ICONS = {
    'WiFi': Wifi, 'Breakfast Included': Coffee, 'Parking': Car,
    'Swimming Pool': Waves, 'Gym / Fitness Centre': Dumbbell, 'Air Conditioning': Wind,
    'Wifi': Wifi, 'Heater': Wind
};

const HotelCompare = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([null, null, null]);
    const [loading, setLoading] = useState([false, false, false]);
    const [addSlot, setAddSlot] = useState(null); // Which slot is being filled
    const [searchQuery, setSearchQuery] = useState('');
    const [allHotels, setAllHotels] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    // Load hotels from URL params
    useEffect(() => {
        const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
        ids.forEach((id, idx) => {
            if (idx < 3) loadHotel(id, idx);
        });

        // Load all hotels for the picker
        const loadAll = async () => {
            const { collection, getDocs, query, where } = await import('firebase/firestore');
            try {
                const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                const snap = await getDocs(q);
                setAllHotels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch {
                const snap = await getDocs(collection(db, 'hotels'));
                setAllHotels(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(h => h.isVisible !== false));
            }
        };
        loadAll();
    }, []);

    const loadHotel = async (id, slot) => {
        setLoading(prev => { const n = [...prev]; n[slot] = true; return n; });
        try {
            const snap = await getDoc(doc(db, 'hotels', id));
            if (snap.exists()) {
                setHotels(prev => { const n = [...prev]; n[slot] = { id: snap.id, ...snap.data() }; return n; });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(prev => { const n = [...prev]; n[slot] = false; return n; });
        }
    };

    const addHotel = (hotel, slot) => {
        setHotels(prev => { const n = [...prev]; n[slot] = hotel; return n; });
        // Update URL
        const newIds = [...hotels];
        newIds[slot] = hotel;
        const ids = newIds.filter(Boolean).map(h => h.id).join(',');
        setSearchParams({ ids });
        setShowPicker(false);
        setSearchQuery('');
    };

    const removeHotel = (slot) => {
        setHotels(prev => { const n = [...prev]; n[slot] = null; return n; });
        const newIdList = hotels.filter((_, idx) => idx !== slot).filter(Boolean).map(h => h.id).join(',');
        if (newIdList) setSearchParams({ ids: newIdList });
        else setSearchParams({});
    };

    const openPicker = (slot) => {
        setAddSlot(slot);
        setShowPicker(true);
        setSearchQuery('');
    };

    const selectedIds = hotels.filter(Boolean).map(h => h.id);
    const filteredSearch = allHotels
        .filter(h => !selectedIds.includes(h.id))
        .filter(h => !searchQuery || h.name?.toLowerCase().includes(searchQuery.toLowerCase()) || h.location?.toLowerCase().includes(searchQuery.toLowerCase()));

    const filledHotels = hotels.filter(Boolean);

    // Comparison data
    const allAmenities = [...new Set(filledHotels.flatMap(h => h.amenities || []))];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <SEO title="Compare Hotels | Infinite Yatra" description="Compare hotels side-by-side on Infinite Yatra." />

            {/* Header */}
            <div className="border-b border-white/10 bg-gradient-to-b from-purple-900/20 to-transparent">
                <div className="container mx-auto px-4 max-w-7xl py-8">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">
                        <Link to="/" className="hover:text-white">Home</Link>
                        <ChevronRight size={12} />
                        <Link to="/hotels/all" className="hover:text-white">Hotels</Link>
                        <ChevronRight size={12} />
                        <span className="text-purple-400">Compare</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-1">Compare Hotels</h1>
                    <p className="text-zinc-500 text-sm">Select up to 3 hotels to compare side-by-side</p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl py-8">
                {/* Hotel Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[0, 1, 2].map(slot => {
                        const h = hotels[slot];
                        const isLoading = loading[slot];

                        if (isLoading) {
                            return <div key={slot} className="bg-[#111] border border-white/10 rounded-2xl h-72 flex items-center justify-center"><Loader2 className="animate-spin text-purple-400" /></div>;
                        }

                        if (!h) {
                            return (
                                <button key={slot} onClick={() => openPicker(slot)} className="bg-[#111] border-2 border-dashed border-white/10 rounded-2xl h-72 flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                                        <Plus size={24} className="text-zinc-500 group-hover:text-purple-400" />
                                    </div>
                                    <span className="text-sm font-medium text-zinc-500 group-hover:text-purple-400">Add Hotel</span>
                                </button>
                            );
                        }

                        return (
                            <div key={slot} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden group relative">
                                <button onClick={() => removeHotel(slot)} className="absolute top-3 right-3 z-10 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/50 transition-colors">
                                    <X size={14} />
                                </button>
                                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${h.image || h.imageUrl || ''})` }}>
                                    <div className="h-full w-full bg-gradient-to-t from-black/80 to-transparent" />
                                </div>
                                <div className="p-4">
                                    <Link to={`/hotels/${h.id}`} className="font-bold text-white hover:text-purple-400 transition-colors block truncate">{h.name}</Link>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {h.location || h.city}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-lg font-bold text-white">₹{Number(h.price || 0).toLocaleString()}<span className="text-xs text-zinc-500 font-normal">/night</span></span>
                                        {h.rating && (
                                            <span className="flex items-center gap-1 text-sm font-bold bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-md"><Star size={12} fill="currentColor" />{h.rating}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Table */}
                {filledHotels.length >= 2 && (
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-5 border-b border-white/10">
                            <h2 className="font-bold text-lg text-white">Side-by-Side Comparison</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-4 text-left text-zinc-500 w-48">Feature</th>
                                        {filledHotels.map(h => (
                                            <th key={h.id} className="p-4 text-left text-white font-bold">{h.name?.split(' ').slice(0, 3).join(' ')}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {/* Price */}
                                    <tr className="hover:bg-white/5">
                                        <td className="p-4 text-zinc-400 font-medium">Price/Night</td>
                                        {filledHotels.map(h => {
                                            const price = Number(h.price || 0);
                                            const isCheapest = price === Math.min(...filledHotels.map(fh => Number(fh.price || Infinity)));
                                            return <td key={h.id} className="p-4"><span className={`font-bold text-lg ${isCheapest ? 'text-green-400' : 'text-white'}`}>₹{price.toLocaleString()}</span> {isCheapest && <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded ml-1">Best Price</span>}</td>;
                                        })}
                                    </tr>
                                    {/* Rating */}
                                    <tr className="hover:bg-white/5">
                                        <td className="p-4 text-zinc-400 font-medium">Rating</td>
                                        {filledHotels.map(h => {
                                            const rating = Number(h.rating || 0);
                                            const isBest = rating === Math.max(...filledHotels.map(fh => Number(fh.rating || 0)));
                                            return <td key={h.id} className="p-4"><span className="flex items-center gap-1"><Star size={14} className="text-yellow-400" fill="currentColor" /><span className={`font-bold ${isBest ? 'text-yellow-400' : 'text-white'}`}>{h.rating || 'N/A'}</span></span></td>;
                                        })}
                                    </tr>
                                    {/* Category */}
                                    <tr className="hover:bg-white/5">
                                        <td className="p-4 text-zinc-400 font-medium">Category</td>
                                        {filledHotels.map(h => <td key={h.id} className="p-4 text-white">{h.category || '-'}</td>)}
                                    </tr>
                                    {/* Location */}
                                    <tr className="hover:bg-white/5">
                                        <td className="p-4 text-zinc-400 font-medium">Location</td>
                                        {filledHotels.map(h => <td key={h.id} className="p-4 text-white">{h.location || h.city || '-'}</td>)}
                                    </tr>
                                    {/* Rooms */}
                                    <tr className="hover:bg-white/5">
                                        <td className="p-4 text-zinc-400 font-medium">Room Types</td>
                                        {filledHotels.map(h => <td key={h.id} className="p-4 text-white">{h.rooms?.length || 0}</td>)}
                                    </tr>
                                    {/* Amenities */}
                                    {allAmenities.slice(0, 12).map(amenity => {
                                        const Icon = AMENITY_ICONS[amenity] || CheckCircle2;
                                        return (
                                            <tr key={amenity} className="hover:bg-white/5">
                                                <td className="p-4 text-zinc-400 font-medium flex items-center gap-2"><Icon size={14} className="text-zinc-500" /> {amenity}</td>
                                                {filledHotels.map(h => {
                                                    const has = (h.amenities || []).includes(amenity);
                                                    return <td key={h.id} className="p-4">{has ? <CheckCircle2 size={16} className="text-green-400" /> : <XCircle size={16} className="text-zinc-700" />}</td>;
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Winner Summary */}
                        <div className="p-5 border-t border-white/10 bg-gradient-to-r from-purple-900/20 to-transparent">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm text-zinc-400">🏆 Best Value:</span>
                                {(() => {
                                    const best = filledHotels.reduce((a, b) => {
                                        const scoreA = (Number(a.rating || 0) * 1000) / Math.max(Number(a.price || 1), 1);
                                        const scoreB = (Number(b.rating || 0) * 1000) / Math.max(Number(b.price || 1), 1);
                                        return scoreA >= scoreB ? a : b;
                                    });
                                    return (
                                        <Link to={`/hotels/${best.id}`} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm font-bold text-purple-300 hover:bg-purple-500/30 transition-colors">
                                            <Star size={12} fill="currentColor" /> {best.name}
                                        </Link>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {filledHotels.length < 2 && (
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
                        <Building2 size={48} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Add at least 2 hotels to compare</h3>
                        <p className="text-zinc-500 text-sm">Click the "Add Hotel" cards above to select hotels for comparison.</p>
                    </div>
                )}
            </div>

            {/* Hotel Picker Modal */}
            {showPicker && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPicker(false)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Select a Hotel</h3>
                            <button onClick={() => setShowPicker(false)} className="p-1 hover:bg-white/10 rounded"><X size={18} className="text-zinc-400" /></button>
                        </div>
                        <div className="p-4">
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                placeholder="Search by name or location..."
                            />
                        </div>
                        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                            {filteredSearch.length === 0 && <p className="text-center text-zinc-500 py-6 text-sm">No hotels found</p>}
                            {filteredSearch.map(h => (
                                <button
                                    key={h.id}
                                    onClick={() => addHotel(h, addSlot)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                                >
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                                        <img src={h.image || h.imageUrl || ''} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white text-sm truncate">{h.name}</p>
                                        <p className="text-xs text-zinc-500">{h.location || h.city}</p>
                                    </div>
                                    <span className="text-sm font-bold text-white">₹{Number(h.price || 0).toLocaleString()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelCompare;
