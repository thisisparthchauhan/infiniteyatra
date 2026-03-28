import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Star, MapPin, ChevronRight, SlidersHorizontal, Wifi, Coffee, Car, Waves, Dumbbell, X, MessageCircle, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const CATEGORY_CHIPS = [
    'All', 'Budget', '3 Star', '4 Star', '5 Star', 'Trek Stay',
    'Spiritual', 'Luxury', 'Family', 'Honeymoon', 'Couple Friendly',
    'Resort', 'Homestay', 'Villa', 'Cottage', 'Dormitory', 'Guest House', 'Camp'
];

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price-low', label: 'Price: Low → High' },
    { value: 'price-high', label: 'Price: High → Low' },
    { value: 'rating', label: 'Highest Rated' }
];

const AMENITY_ICONS = {
    'WiFi': Wifi, 'Breakfast Included': Coffee, 'Parking': Car,
    'Swimming Pool': Waves, 'Gym / Fitness Centre': Dumbbell
};

const AllHotels = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState('recommended');
    const [showFilters, setShowFilters] = useState(false);
    const [compareList, setCompareList] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                let fetchedHotels = [];
                try {
                    const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                    const snapshot = await getDocs(q);
                    fetchedHotels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch {
                    const allSnapshot = await getDocs(collection(db, 'hotels'));
                    fetchedHotels = allSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(h => h.isVisible !== false);
                }
                setHotels(fetchedHotels);
            } catch (error) {
                console.error("Error fetching hotels:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    // Filter logic
    const filtered = hotels.filter(hotel => {
        const matchesSearch = !searchQuery ||
            hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hotel.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hotel.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hotel.address?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = activeCategory === 'All' ||
            hotel.category === activeCategory ||
            (hotel.hotelType || []).includes(activeCategory);

        return matchesSearch && matchesCategory;
    });

    // Sort logic
    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'price-low': return (Number(a.price) || 0) - (Number(b.price) || 0);
            case 'price-high': return (Number(b.price) || 0) - (Number(a.price) || 0);
            case 'rating': return (Number(b.rating) || 0) - (Number(a.rating) || 0);
            default: return 0;
        }
    });

    const toggleCompare = (hotel) => {
        setCompareList(prev => {
            if (prev.find(h => h.id === hotel.id)) return prev.filter(h => h.id !== hotel.id);
            if (prev.length >= 3) return prev;
            return [...prev, hotel];
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <SEO title="All Hotels | Infinite Yatra" description="Browse all verified hotels and stays on Infinite Yatra." />

            {/* Hero Header */}
            <div className="relative bg-gradient-to-b from-blue-900/30 to-[#0a0a0a] pt-28 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight size={12} />
                        <Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link>
                        <ChevronRight size={12} />
                        <span className="text-orange-500">All Hotels</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">
                        Explore All Stays
                    </h1>
                    <div className="flex items-center gap-4">
                        <p className="text-zinc-400 text-lg max-w-2xl">
                            Curated hotels, homestays, and resorts across India — verified for quality, safety, and comfort.
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Link to="/my-hotel-bookings" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/10 transition-colors">
                            📋 My Bookings
                        </Link>
                        <Link to="/hotels/compare" className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors">
                            ⚖️ Compare Hotels
                        </Link>
                    </div>
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 py-4">
                <div className="container mx-auto px-4 max-w-7xl space-y-4">
                    {/* Search + Sort Row */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search hotels by name, city, or location..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="sm:hidden flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
                            >
                                <SlidersHorizontal size={16} /> Filters
                            </button>
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                                    ))}
                                </select>
                                <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Category Chips */}
                    <div className={`flex gap-2 overflow-x-auto no-scrollbar pb-1 ${showFilters ? '' : 'hidden sm:flex'}`}>
                        {CATEGORY_CHIPS.map(chip => (
                            <button
                                key={chip}
                                onClick={() => setActiveCategory(chip)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === chip
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Header */}
            <div className="container mx-auto px-4 max-w-7xl py-6">
                <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>Showing <strong className="text-white">{sorted.length}</strong> hotel{sorted.length !== 1 ? 's' : ''}</span>
                    {activeCategory !== 'All' && (
                        <button onClick={() => setActiveCategory('All')} className="text-orange-400 hover:text-orange-300 flex items-center gap-1">
                            <X size={14} /> Clear filter: {activeCategory}
                        </button>
                    )}
                </div>
            </div>

            {/* Hotel Grid */}
            <div className="container mx-auto px-4 max-w-7xl pb-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white/5 rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-56 bg-zinc-800" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                                    <div className="h-4 bg-zinc-800 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">🏨</div>
                        <h3 className="text-xl font-bold text-white mb-2">No hotels found</h3>
                        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                            No hotels match your search. Try a different filter or contact us on WhatsApp.
                        </p>
                        <a
                            href="https://wa.me/919265799325?text=Hi%2C%20I%20am%20looking%20for%20a%20hotel%20on%20Infinite%20Yatra."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl font-semibold hover:bg-green-500/30 transition-colors"
                        >
                            <MessageCircle size={18} /> Chat with us on WhatsApp
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sorted.map((hotel, idx) => (
                            <motion.div
                                key={hotel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link
                                    to={`/hotels/${hotel.id}`}
                                    className="group block bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                                >
                                    {/* Image */}
                                    <div className="relative h-56 overflow-hidden">
                                        <img
                                            src={hotel.image || hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'}
                                            alt={hotel.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                        {/* Rating Badge */}
                                        {hotel.rating && (
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-sm font-bold border border-white/10">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-white">{hotel.rating}</span>
                                            </div>
                                        )}

                                        {/* Category Badge */}
                                        {hotel.category && (
                                            <div className="absolute top-4 left-4 bg-blue-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-blue-300 border border-blue-500/20">
                                                {hotel.category}
                                            </div>
                                        )}

                                        {/* Bottom overlay info */}
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md line-clamp-1 mb-1">
                                                {hotel.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-zinc-300 text-sm">
                                                <MapPin size={13} className="text-orange-400" />
                                                <span>{hotel.location || hotel.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 space-y-4">
                                        {/* Compare checkbox */}
                                        <label className="flex items-center gap-2 cursor-pointer text-xs" onClick={e => e.preventDefault()}>
                                            <input
                                                type="checkbox"
                                                checked={!!compareList.find(c => c.id === hotel.id)}
                                                onChange={() => toggleCompare(hotel)}
                                                className="w-3.5 h-3.5 rounded bg-black/40 border-white/20 text-purple-500 cursor-pointer"
                                            />
                                            <span className="text-zinc-500 font-medium">Compare</span>
                                        </label>

                                        {/* Amenity Icons */}
                                        {hotel.amenities && hotel.amenities.length > 0 && (
                                            <div className="flex gap-3">
                                                {hotel.amenities.slice(0, 3).map((amenity, i) => {
                                                    const Icon = AMENITY_ICONS[amenity];
                                                    if (!Icon) return null;
                                                    return (
                                                        <div key={i} className="flex items-center gap-1.5 text-zinc-500 text-xs">
                                                            <Icon size={13} />
                                                            <span>{amenity}</span>
                                                        </div>
                                                    );
                                                })}
                                                {hotel.amenities.length > 3 && (
                                                    <span className="text-xs text-zinc-600">+{hotel.amenities.length - 3} more</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Price + CTA */}
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div>
                                                <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Starts from</span>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-xl font-bold text-white">₹{Number(hotel.price || 0).toLocaleString()}</span>
                                                    <span className="text-sm text-zinc-500">/night</span>
                                                </div>
                                            </div>
                                            <span className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                                                View Details
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Floating Compare Bar */}
                {compareList.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-6 py-4 shadow-2xl shadow-purple-500/10 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {compareList.map(h => (
                                <div key={h.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl">
                                    <span className="text-sm text-white font-medium truncate max-w-[100px]">{h.name?.split(' ').slice(0, 2).join(' ')}</span>
                                    <button onClick={() => toggleCompare(h)} className="text-zinc-500 hover:text-red-400">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            disabled={compareList.length < 2}
                            onClick={() => navigate(`/hotels/compare?ids=${compareList.map(h => h.id).join(',')}`)}
                            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:from-purple-600 hover:to-blue-700 shadow-lg shadow-purple-500/25"
                        >
                            Compare ({compareList.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllHotels;
