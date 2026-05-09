import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MapPin, Search, Star, ChevronRight, Building2, Home, MessageCircle,
    SlidersHorizontal, ArrowUpDown, X, Wifi, Car, Coffee, Waves, Dumbbell,
    UtensilsCrossed, Dog, Wind, ChevronDown, Flame, TrendingUp, Users
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { hotels as staticHotels } from '../../data/hotels';
import HotelCard from '../../components/hotels/HotelCard';
import SEO from '../../components/SEO';

const PROPERTY_TYPES = ['All', 'Hotel', 'Resort', 'Homestay', 'Villa', 'Cottage', 'Dormitory', 'Guest House', 'Camp'];

const SORT_OPTIONS = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'rating', label: 'Highest Rated' }
];

const BUDGET_RANGES = [
    { id: 'all', label: 'All Budgets', min: 0, max: Infinity },
    { id: 'budget', label: 'Under ₹2,000', min: 0, max: 2000 },
    { id: 'mid', label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
    { id: 'premium', label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
    { id: 'luxury', label: '₹10,000+', min: 10000, max: Infinity }
];

const AMENITY_FILTERS = [
    { id: 'wifi', label: 'WiFi', icon: Wifi, match: ['Wifi', 'WiFi', 'Free WiFi'] },
    { id: 'parking', label: 'Parking', icon: Car, match: ['Parking', 'Free Parking'] },
    { id: 'breakfast', label: 'Breakfast', icon: Coffee, match: ['Breakfast', 'Breakfast Included'] },
    { id: 'pool', label: 'Pool', icon: Waves, match: ['Swimming Pool', 'Pool'] },
    { id: 'gym', label: 'Gym', icon: Dumbbell, match: ['Gym', 'Gym / Fitness Centre'] },
    { id: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, match: ['Restaurant'] },
    { id: 'pet', label: 'Pet Friendly', icon: Dog, match: ['Pet Friendly'] },
    { id: 'ac', label: 'AC', icon: Wind, match: ['Air Conditioning', 'AC'] }
];

const CityHotels = () => {
    const { citySlug } = useParams();
    const navigate = useNavigate();
    const [allHotels, setAllHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [propertyType, setPropertyType] = useState('All');
    const [sortBy, setSortBy] = useState('recommended');
    const [budgetRange, setBudgetRange] = useState('all');
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const cityName = useMemo(() => {
        return citySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }, [citySlug]);

    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true);
            try {
                let fetched = [];
                try {
                    const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                    const snap = await getDocs(q);
                    fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch {
                    const allSnap = await getDocs(collection(db, 'hotels'));
                    fetched = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(h => h.isVisible !== false);
                }
                if (fetched.length === 0) fetched = staticHotels;
                setAllHotels(fetched);
            } catch {
                setAllHotels(staticHotels);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const cityHotels = useMemo(() => {
        let result = allHotels.filter(hotel => {
            const hotelCity = (hotel.city || '').toLowerCase();
            const hotelLocation = (hotel.location || '').toLowerCase();
            const search = cityName.toLowerCase();
            return hotelCity.includes(search) || hotelLocation.includes(search);
        });

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(h =>
                (h.name || '').toLowerCase().includes(q) ||
                (h.category || '').toLowerCase().includes(q) ||
                (h.description || '').toLowerCase().includes(q)
            );
        }

        if (propertyType !== 'All') {
            result = result.filter(h =>
                (h.category || '').toLowerCase() === propertyType.toLowerCase() ||
                (h.hotelType || []).some(t => t.toLowerCase() === propertyType.toLowerCase())
            );
        }

        if (budgetRange !== 'all') {
            const range = BUDGET_RANGES.find(b => b.id === budgetRange);
            if (range) {
                result = result.filter(h => {
                    const price = h.price || h.rooms?.[0]?.price || 0;
                    return price >= range.min && price < range.max;
                });
            }
        }

        if (selectedAmenities.length > 0) {
            result = result.filter(h => {
                const hotelAmenities = (h.amenities || []).map(a => a.toLowerCase());
                return selectedAmenities.every(filterAmenity => {
                    const amenityDef = AMENITY_FILTERS.find(af => af.id === filterAmenity);
                    return amenityDef?.match.some(m => hotelAmenities.includes(m.toLowerCase()));
                });
            });
        }

        switch (sortBy) {
            case 'price-low': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
            case 'price-high': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
            case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            default: break;
        }

        return result;
    }, [allHotels, cityName, searchQuery, propertyType, sortBy, budgetRange, selectedAmenities]);

    const otherCities = useMemo(() => {
        const cityMap = {};
        allHotels.forEach(hotel => {
            const city = (hotel.city || '').trim();
            if (city && city.toLowerCase() !== cityName.toLowerCase()) {
                if (!cityMap[city]) cityMap[city] = { count: 0, minPrice: Infinity, image: null };
                cityMap[city].count++;
                const price = hotel.price || 0;
                if (price > 0 && price < cityMap[city].minPrice) cityMap[city].minPrice = price;
                if (!cityMap[city].image) cityMap[city].image = hotel.image || hotel.imageUrl;
            }
        });
        return Object.entries(cityMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 6)
            .map(([name, data]) => ({ name, ...data }));
    }, [allHotels, cityName]);

    const citySlugify = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const activeFilterCount = (propertyType !== 'All' ? 1 : 0) + (budgetRange !== 'all' ? 1 : 0) + selectedAmenities.length;

    const toggleAmenity = (id) => {
        setSelectedAmenities(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <SEO
                title={`Hotels in ${cityName} - Best Stays & Deals | Infinite Yatra`}
                description={`Find the best hotels, resorts, homestays, and more in ${cityName}. Book verified stays at the best prices with Infinite Yatra.`}
                url={`/hotels/city/${citySlug}`}
            />

            {/* ─── Hero ─── */}
            <div className="relative bg-gradient-to-b from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a] pt-28 pb-10">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
                        <Link to="/" className="hover:text-white transition-colors flex items-center gap-1"><Home size={12} /> Home</Link>
                        <ChevronRight size={10} />
                        <Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link>
                        <ChevronRight size={10} />
                        <span className="text-zinc-300">{cityName}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                                Hotels in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{cityName}</span>
                            </h1>
                            <p className="text-zinc-400 flex items-center gap-2">
                                <MapPin size={16} className="text-orange-400" />
                                {loading ? 'Loading...' : `${cityHotels.length} ${cityHotels.length === 1 ? 'property' : 'properties'} found`}
                                {' '}— Hotels, Resorts, Homestays & more
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder={`Search in ${cityName}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl py-6">
                {/* ─── Filter Bar ─── */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Property Type Chips */}
                    <div className="flex-1 overflow-x-auto pb-2 no-scrollbar">
                        <div className="flex gap-2">
                            {PROPERTY_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPropertyType(type)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                        propertyType === type
                                            ? 'bg-white text-black font-bold shadow-lg'
                                            : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {type === 'All' ? 'All Types' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 shrink-0">
                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-400 hover:text-white transition-colors relative"
                        >
                            <SlidersHorizontal size={14} /> Filters
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <select
                            value={budgetRange}
                            onChange={(e) => setBudgetRange(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer [color-scheme:dark]"
                        >
                            {BUDGET_RANGES.map(range => (
                                <option key={range.id} value={range.id} className="bg-zinc-900">{range.label}</option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer [color-scheme:dark]"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id} className="bg-zinc-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Amenity Filters (desktop) */}
                <div className="hidden lg:flex flex-wrap gap-2 mb-6">
                    {AMENITY_FILTERS.map(af => {
                        const Icon = af.icon;
                        const isActive = selectedAmenities.includes(af.id);
                        return (
                            <button
                                key={af.id}
                                onClick={() => toggleAmenity(af.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    isActive
                                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                        : 'bg-white/5 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <Icon size={12} /> {af.label}
                            </button>
                        );
                    })}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={() => { setPropertyType('All'); setBudgetRange('all'); setSelectedAmenities([]); }}
                            className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-2 transition-colors"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>

                {/* Active Filter Pills */}
                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {propertyType !== 'All' && (
                            <span className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                {propertyType}
                                <button onClick={() => setPropertyType('All')}><X size={12} /></button>
                            </span>
                        )}
                        {budgetRange !== 'all' && (
                            <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20">
                                {BUDGET_RANGES.find(b => b.id === budgetRange)?.label}
                                <button onClick={() => setBudgetRange('all')}><X size={12} /></button>
                            </span>
                        )}
                        {selectedAmenities.map(a => (
                            <span key={a} className="flex items-center gap-1.5 text-xs bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20">
                                {AMENITY_FILTERS.find(af => af.id === a)?.label}
                                <button onClick={() => toggleAmenity(a)}><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                )}

                {/* ─── Results ─── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-2xl h-80 animate-pulse" />
                        ))}
                    </div>
                ) : cityHotels.length === 0 ? (
                    <div className="text-center py-20">
                        <Building2 size={48} className="mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No properties found in {cityName}</h3>
                        <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                            {activeFilterCount > 0
                                ? 'Try adjusting your filters or search criteria.'
                                : "We're expanding to new cities every week. Check back soon!"}
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={() => { setPropertyType('All'); setBudgetRange('all'); setSearchQuery(''); setSelectedAmenities([]); }}
                                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            )}
                            <Link to="/hotels/all" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
                                Browse All Hotels
                            </Link>
                            <a
                                href={`https://wa.me/919265799325?text=${encodeURIComponent(`Hi, I'm looking for hotels in ${cityName}. Can you help?`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                            >
                                <MessageCircle size={16} /> Ask on WhatsApp
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cityHotels.map((hotel, i) => (
                            <motion.div
                                key={hotel.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                            >
                                <HotelCard {...hotel} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ─── Other Cities ─── */}
                {otherCities.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-white/5">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-orange-400" />
                            Explore Other Destinations
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {otherCities.map(city => (
                                <Link
                                    key={city.name}
                                    to={`/hotels/city/${citySlugify(city.name)}`}
                                    className="group relative overflow-hidden rounded-xl border border-white/5 hover:border-white/20 transition-all"
                                >
                                    {city.image ? (
                                        <div className="h-24 overflow-hidden">
                                            <img src={city.image} alt={city.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                        </div>
                                    ) : (
                                        <div className="h-24 bg-gradient-to-br from-blue-900/30 to-purple-900/20" />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">{city.name}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-zinc-400">{city.count} stay{city.count > 1 ? 's' : ''}</p>
                                            {city.minPrice < Infinity && (
                                                <p className="text-[10px] text-zinc-400">from ₹{city.minPrice.toLocaleString()}</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* ─── Mobile Filters Bottom Sheet ─── */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="absolute bottom-0 left-0 right-0 bg-[#111] rounded-t-3xl max-h-[85vh] overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-[#111] border-b border-white/10 p-4 flex items-center justify-between z-10">
                            <h3 className="font-bold text-white text-lg">Filters</h3>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <X size={20} className="text-zinc-400" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Budget */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Budget</h4>
                                <div className="space-y-2">
                                    {BUDGET_RANGES.map(range => (
                                        <button
                                            key={range.id}
                                            onClick={() => setBudgetRange(range.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                                                budgetRange === range.id
                                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium'
                                                    : 'bg-white/5 text-zinc-400 border border-white/5'
                                            }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amenities */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Amenities</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {AMENITY_FILTERS.map(af => {
                                        const Icon = af.icon;
                                        const isActive = selectedAmenities.includes(af.id);
                                        return (
                                            <button
                                                key={af.id}
                                                onClick={() => toggleAmenity(af.id)}
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all ${
                                                    isActive
                                                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium'
                                                        : 'bg-white/5 text-zinc-400 border border-white/5'
                                                }`}
                                            >
                                                <Icon size={14} /> {af.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-[#111] border-t border-white/10 p-4 flex gap-3">
                            <button
                                onClick={() => { setPropertyType('All'); setBudgetRange('all'); setSelectedAmenities([]); }}
                                className="flex-1 py-3 bg-white/5 text-zinc-400 rounded-xl font-medium text-sm hover:bg-white/10 transition-colors"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
                            >
                                Show {cityHotels.length} Result{cityHotels.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
};

export default CityHotels;
