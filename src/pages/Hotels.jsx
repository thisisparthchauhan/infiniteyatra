import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import HotelCard from '../components/Hotels/HotelCard';
import {
    Search, MapPin, Building2, Home as HomeIcon, Tent, Trees, Castle, Bed,
    ArrowRight, Star, CalendarDays, Users, Minus, Plus, ChevronLeft, ChevronRight,
    ShieldCheck, Sparkles, BadgeCheck, PhoneCall, XCircle, Landmark, Ship, TreePine,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { hotels as staticHotels } from '../data/hotels';
import SEO from '../components/common/SEO';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = [
    { id: 'all', label: 'All Stays', icon: Sparkles },
    { id: 'Hotel', label: 'Hotels', icon: Building2 },
    { id: 'Resort', label: 'Resorts', icon: Castle },
    { id: 'Homestay', label: 'Homestays', icon: HomeIcon },
    { id: 'Villa', label: 'Villas', icon: Trees },
    { id: 'Cottage', label: 'Cottages', icon: TreePine },
    { id: 'Dormitory', label: 'Dormitories', icon: Bed },
    { id: 'Guest House', label: 'Guest Houses', icon: Landmark },
    { id: 'Camp', label: 'Camps', icon: Tent },
    { id: 'Treehouse', label: 'Treehouses', icon: Trees },
    { id: 'Houseboat', label: 'Houseboats', icon: Ship },
];

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Rated' },
];

const TRUST_STATS = [
    { label: 'Hotels', value: '500+', icon: Building2 },
    { label: 'Cities', value: '50+', icon: MapPin },
    { label: 'Happy Guests', value: '10K+', icon: Users },
];

const POPULAR_DESTINATIONS = [
    'Shimla', 'Manali', 'Rishikesh', 'Jaipur', 'Goa', 'Udaipur',
    'Dharamshala', 'Mussoorie', 'Varanasi', 'Ooty',
];

const WHY_BOOK = [
    {
        icon: ShieldCheck,
        title: 'Best Price Guarantee',
        description: 'Find a lower price elsewhere? We will match it and give you an extra 10% off your booking.',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'hover:border-amber-500/40',
    },
    {
        icon: BadgeCheck,
        title: 'Verified Properties',
        description: 'Every property is physically inspected by our ground team to ensure quality, hygiene, and safety standards.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'hover:border-emerald-500/40',
    },
    {
        icon: PhoneCall,
        title: '24/7 Support',
        description: 'Our dedicated travel experts are available around the clock to help with bookings, changes, or emergencies.',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'hover:border-blue-500/40',
    },
    {
        icon: XCircle,
        title: 'Free Cancellation',
        description: 'Plans changed? Cancel up to 48 hours before check-in on most properties for a full refund, no questions asked.',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'hover:border-rose-500/40',
    },
];

// ---------------------------------------------------------------------------
// Helper: localStorage recently viewed
// ---------------------------------------------------------------------------

const RECENTLY_VIEWED_KEY = 'iy_recently_viewed_hotels';

function getRecentlyViewed() {
    try {
        return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    } catch {
        return [];
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GuestSelector({ guests, setGuests, open, setOpen }) {
    const ref = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [setOpen]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm hover:border-amber-500/40 transition-colors w-full md:w-auto"
            >
                <Users size={16} className="text-amber-400 shrink-0" />
                <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full mt-2 right-0 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl z-50 min-w-[180px]"
                    >
                        <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-semibold">Guests</p>
                        <div className="flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={() => setGuests(Math.max(1, guests - 1))}
                                className="w-8 h-8 rounded-full border border-zinc-600 flex items-center justify-center text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="text-white font-semibold text-lg">{guests}</span>
                            <button
                                type="button"
                                onClick={() => setGuests(Math.min(20, guests + 1))}
                                className="w-8 h-8 rounded-full border border-zinc-600 flex items-center justify-center text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CategoryBar({ active, onChange, categoryRef }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        el?.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            el?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll]);

    const scroll = (dir) => {
        scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    return (
        <div ref={categoryRef} className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-zinc-800/60">
            <div className="container mx-auto px-4 relative">
                {canScrollLeft && (
                    <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-zinc-900/90 border border-zinc-700 rounded-full shadow-lg hover:bg-zinc-800 transition-colors">
                        <ChevronLeft size={18} className="text-zinc-300" />
                    </button>
                )}
                {canScrollRight && (
                    <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-zinc-900/90 border border-zinc-700 rounded-full shadow-lg hover:bg-zinc-800 transition-colors">
                        <ChevronRight size={18} className="text-zinc-300" />
                    </button>
                )}
                <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3 px-2 md:px-8">
                    {PROPERTY_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isActive = active === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => onChange(type.id)}
                                className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-xs font-medium shrink-0
                                    ${isActive
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{type.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Hotels = () => {
    const navigate = useNavigate();

    // Data
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search state
    const [destination, setDestination] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(2);
    const [guestOpen, setGuestOpen] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filters
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortBy, setSortBy] = useState('recommended');

    // Recently viewed
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    const categoryRef = useRef(null);
    const searchInputRef = useRef(null);

    // -----------------------------------------------------------------------
    // Fetch hotels
    // -----------------------------------------------------------------------
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                let fetchedHotels = [];
                try {
                    const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                    const querySnapshot = await getDocs(q);
                    fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (indexErr) {
                    console.warn('Index query failed, fetching all hotels:', indexErr);
                    const allSnapshot = await getDocs(collection(db, 'hotels'));
                    fetchedHotels = allSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(h => h.isVisible !== false);
                }
                setHotels(fetchedHotels.length > 0 ? fetchedHotels : staticHotels);
            } catch (error) {
                console.error('Error fetching hotels:', error);
                setHotels(staticHotels);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    // Load recently viewed
    useEffect(() => {
        const ids = getRecentlyViewed();
        if (ids.length > 0) setRecentlyViewed(ids);
    }, []);

    // -----------------------------------------------------------------------
    // Derived data
    // -----------------------------------------------------------------------

    // Cities
    const cities = useMemo(() => {
        const cityMap = {};
        hotels.forEach(hotel => {
            const city = (hotel.city || '').trim();
            if (!city) return;
            if (!cityMap[city]) cityMap[city] = { name: city, count: 0, minPrice: Infinity, image: null };
            cityMap[city].count++;
            const price = hotel.price || hotel.rooms?.[0]?.price || 0;
            if (price > 0 && price < cityMap[city].minPrice) cityMap[city].minPrice = price;
            if (!cityMap[city].image) cityMap[city].image = hotel.image || hotel.imageUrl || hotel.images?.[0] || null;
        });
        return Object.values(cityMap).sort((a, b) => b.count - a.count);
    }, [hotels]);

    // Destination suggestions
    const suggestions = useMemo(() => {
        if (!destination.trim()) return POPULAR_DESTINATIONS.slice(0, 6);
        const q = destination.toLowerCase();
        const matched = cities
            .filter(c => c.name.toLowerCase().includes(q))
            .map(c => c.name);
        const fromPopular = POPULAR_DESTINATIONS.filter(p => p.toLowerCase().includes(q) && !matched.includes(p));
        return [...matched, ...fromPopular].slice(0, 6);
    }, [destination, cities]);

    // Filtered + sorted hotels
    const displayHotels = useMemo(() => {
        let result = [...hotels];

        // Category filter
        if (activeCategory !== 'all') {
            result = result.filter(h =>
                (h.category || '').toLowerCase() === activeCategory.toLowerCase() ||
                (h.hotelType || []).some(t => t.toLowerCase() === activeCategory.toLowerCase())
            );
        }

        // Sort
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case 'price-high':
                result.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            default:
                break;
        }

        return result;
    }, [hotels, activeCategory, sortBy]);

    // Recently viewed hotels data
    const recentHotels = useMemo(() => {
        if (recentlyViewed.length === 0) return [];
        return recentlyViewed
            .map(id => hotels.find(h => h.id === id))
            .filter(Boolean)
            .slice(0, 8);
    }, [recentlyViewed, hotels]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const citySlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const handleSearch = (e) => {
        e?.preventDefault();
        if (destination.trim()) {
            navigate(`/hotels/city/${citySlug(destination.trim())}`);
        } else {
            navigate('/hotels/all');
        }
    };

    const selectSuggestion = (name) => {
        setDestination(name);
        setShowSuggestions(false);
        navigate(`/hotels/city/${citySlug(name)}`);
    };

    // Today's date for min on date inputs
    const today = new Date().toISOString().split('T')[0];

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <SEO
                title="Hotels - Infinite Yatra | Budget to Luxury Stays Across India"
                description="Discover 500+ handpicked hotels, resorts, homestays, villas, and unique stays across 50+ cities in India. Best prices guaranteed by Infinite Yatra."
                url="/hotels"
            />

            {/* ============================================================= */}
            {/* HERO SECTION                                                   */}
            {/* ============================================================= */}
            <section className="relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative container mx-auto px-4 pt-28 pb-20 md:pt-36 md:pb-28">
                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-center max-w-4xl mx-auto mb-10"
                    >
                        <p className="text-amber-400 font-semibold text-sm tracking-widest uppercase mb-4">Infinite Yatra Hotels</p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
                            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">Find Your </span>
                            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 bg-clip-text text-transparent">Perfect Stay</span>
                        </h1>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            From mountain homestays to beachside villas, discover handpicked stays that turn every trip into an unforgettable experience.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        onSubmit={handleSearch}
                        className="max-w-5xl mx-auto bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-3 md:p-4 shadow-2xl shadow-black/40"
                    >
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                            {/* Destination */}
                            <div className="relative flex-1">
                                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Where are you going?"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="w-full pl-11 pr-4 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 text-sm"
                                />
                                {destination && (
                                    <button type="button" onClick={() => setDestination('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                        <X size={14} />
                                    </button>
                                )}
                                {/* Autocomplete Dropdown */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                                                {destination.trim() ? 'Suggestions' : 'Popular Destinations'}
                                            </p>
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onMouseDown={() => selectSuggestion(s)}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                                                >
                                                    <MapPin size={14} className="text-amber-400 shrink-0" />
                                                    <span className="text-sm text-zinc-300">{s}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Check-in */}
                            <div className="relative">
                                <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                                <input
                                    type="date"
                                    min={today}
                                    value={checkIn}
                                    onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value > checkOut) setCheckOut(''); }}
                                    className="pl-10 pr-3 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-amber-500/50 w-full md:w-[150px] appearance-none"
                                    title="Check-in date"
                                />
                            </div>

                            {/* Check-out */}
                            <div className="relative">
                                <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
                                <input
                                    type="date"
                                    min={checkIn || today}
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    className="pl-10 pr-3 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-amber-500/50 w-full md:w-[150px] appearance-none"
                                    title="Check-out date"
                                />
                            </div>

                            {/* Guests */}
                            <GuestSelector guests={guests} setGuests={setGuests} open={guestOpen} setOpen={setGuestOpen} />

                            {/* Search button */}
                            <button
                                type="submit"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm shrink-0"
                            >
                                <Search size={18} />
                                <span className="hidden sm:inline">Search</span>
                            </button>
                        </div>
                    </motion.form>

                    {/* Trust Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="flex items-center justify-center gap-8 md:gap-14 mt-10"
                    >
                        {TRUST_STATS.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex items-center gap-2.5 text-center">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Icon size={16} className="text-amber-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-bold text-lg leading-tight">{stat.value}</p>
                                        <p className="text-zinc-500 text-xs">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* ============================================================= */}
            {/* CATEGORY BAR (sticky)                                          */}
            {/* ============================================================= */}
            <CategoryBar active={activeCategory} onChange={setActiveCategory} categoryRef={categoryRef} />

            {/* ============================================================= */}
            {/* TRENDING DESTINATIONS                                          */}
            {/* ============================================================= */}
            {cities.length > 0 && (
                <section className="container mx-auto px-4 py-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-end justify-between mb-10"
                    >
                        <div>
                            <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-2">Explore India</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Trending Destinations</h2>
                        </div>
                        <Link
                            to="/hotels/all"
                            className="text-amber-400 hover:text-amber-300 font-medium text-sm flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {cities.slice(0, 6).map((city, i) => (
                            <motion.div
                                key={city.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    to={`/hotels/city/${citySlug(city.name)}`}
                                    className="group block relative overflow-hidden rounded-2xl border border-zinc-800 hover:border-amber-500/30 transition-all"
                                >
                                    <div className="aspect-[3/4] bg-zinc-800 relative">
                                        {city.image ? (
                                            <img
                                                src={city.image}
                                                alt={city.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                <MapPin size={40} className="text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-lg font-bold text-white mb-1">{city.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-zinc-400">{city.count} {city.count === 1 ? 'stay' : 'stays'}</p>
                                            {city.minPrice < Infinity && (
                                                <p className="text-xs font-semibold text-amber-400">from ₹{city.minPrice.toLocaleString('en-IN')}</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================================================= */}
            {/* FEATURED STAYS / ALL HOTELS                                    */}
            {/* ============================================================= */}
            <section className="container mx-auto px-4 py-16">
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-2">Handpicked for You</p>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                            {activeCategory === 'all' ? 'Featured Stays' : PROPERTY_TYPES.find(p => p.id === activeCategory)?.label || 'Stays'}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-1">
                            {displayHotels.length} {displayHotels.length === 1 ? 'property' : 'properties'} found
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-3">
                        {/* Sort dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none pr-8"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <Link
                            to="/hotels/all"
                            className="px-4 py-2.5 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/10 transition-colors whitespace-nowrap"
                        >
                            View All
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden animate-pulse">
                                <div className="h-64 bg-zinc-800" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                                    <div className="h-10 bg-zinc-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayHotels.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 size={48} className="text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 text-lg">No properties found for this category.</p>
                        <button
                            onClick={() => setActiveCategory('all')}
                            className="mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                        >
                            Browse all stays
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayHotels.slice(0, 6).map((hotel, i) => (
                            <motion.div
                                key={hotel.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                viewport={{ once: true }}
                            >
                                <HotelCard {...hotel} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {displayHotels.length > 6 && (
                    <div className="text-center mt-12">
                        <Link
                            to="/hotels/all"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                        >
                            Explore All {displayHotels.length} Stays <ArrowRight size={18} />
                        </Link>
                    </div>
                )}
            </section>

            {/* ============================================================= */}
            {/* RECENTLY VIEWED                                                */}
            {/* ============================================================= */}
            {recentHotels.length > 0 && (
                <section className="container mx-auto px-4 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-2">Welcome Back</p>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Recently Viewed</h2>
                    </motion.div>

                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {recentHotels.map((hotel) => (
                            <div key={hotel.id} className="min-w-[300px] max-w-[340px] shrink-0">
                                <HotelCard {...hotel} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================================================= */}
            {/* WHY BOOK WITH US                                               */}
            {/* ============================================================= */}
            <section className="py-20 border-t border-zinc-800/60">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">The Infinite Yatra Promise</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Book With Us?</h2>
                        <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
                            We don't just list hotels. We curate experiences that are verified for quality, safety, and unmatched comfort.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {WHY_BOOK.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    viewport={{ once: true }}
                                    className={`bg-zinc-900/50 p-7 rounded-2xl border border-zinc-800 text-center ${item.border} transition-all group`}
                                >
                                    <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                                        <Icon size={26} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============================================================= */}
            {/* PARTNER CTA                                                    */}
            {/* ============================================================= */}
            <section className="container mx-auto px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12">
                            <div className="flex-1">
                                <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">Become a Partner</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                    List Your Property on Infinite Yatra
                                </h2>
                                <p className="text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed">
                                    Reach thousands of travellers every month. Enjoy zero commission for the first 3 months, dedicated support, and full control over your pricing and availability.
                                </p>
                            </div>
                            <Link
                                to="/partner/hotel-onboarding"
                                className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm md:text-base"
                            >
                                <Building2 size={20} />
                                List Your Property
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>
        </main>
    );
};

export default Hotels;
