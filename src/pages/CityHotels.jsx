import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MapPin, Search, SlidersHorizontal, ArrowUpDown, Star,
    ChevronLeft, Building2, Home as HomeIcon, Tent, Trees,
    Castle, Bed, Filter, X, MessageCircle
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { hotels as staticHotels } from '../data/hotels';
import HotelCard from '../components/Hotels/HotelCard';
import SEO from '../components/SEO';

const PROPERTY_TYPES = [
    'All', 'Hotel', 'Resort', 'Homestay', 'Villa', 'Cottage',
    'Dormitory', 'Guest House', 'Camp'
];

const SORT_OPTIONS = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'price-low', label: 'Price: Low → High' },
    { id: 'price-high', label: 'Price: High → Low' },
    { id: 'rating', label: 'Highest Rated' }
];

const BUDGET_RANGES = [
    { id: 'all', label: 'All Budgets' },
    { id: 'budget', label: 'Under ₹2,000', min: 0, max: 2000 },
    { id: 'mid', label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
    { id: 'premium', label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
    { id: 'luxury', label: '₹10,000+', min: 10000, max: Infinity }
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
    const [showFilters, setShowFilters] = useState(false);

    // Convert slug to city name
    const cityName = useMemo(() => {
        return citySlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }, [citySlug]);

    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true);
            try {
                let fetchedHotels = [];
                try {
                    const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                    const querySnapshot = await getDocs(q);
                    fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (indexErr) {
                    const allSnapshot = await getDocs(collection(db, 'hotels'));
                    fetchedHotels = allSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(h => h.isVisible !== false);
                }

                if (fetchedHotels.length === 0) {
                    fetchedHotels = staticHotels;
                }

                setAllHotels(fetchedHotels);
            } catch (error) {
                console.error('Error fetching hotels:', error);
                setAllHotels(staticHotels);
            } finally {
                setLoading(false);
            }
        };

        fetchHotels();
    }, []);

    // Filter hotels for this city
    const cityHotels = useMemo(() => {
        let result = allHotels.filter(hotel => {
            const hotelCity = (hotel.city || '').toLowerCase();
            const hotelLocation = (hotel.location || '').toLowerCase();
            const search = cityName.toLowerCase();
            return hotelCity.includes(search) || hotelLocation.includes(search);
        });

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(h =>
                (h.name || '').toLowerCase().includes(q) ||
                (h.category || '').toLowerCase().includes(q) ||
                (h.description || '').toLowerCase().includes(q)
            );
        }

        // Property type filter
        if (propertyType !== 'All') {
            result = result.filter(h =>
                (h.category || '').toLowerCase() === propertyType.toLowerCase() ||
                (h.hotelType || []).some(t => t.toLowerCase() === propertyType.toLowerCase())
            );
        }

        // Budget filter
        if (budgetRange !== 'all') {
            const range = BUDGET_RANGES.find(b => b.id === budgetRange);
            if (range) {
                result = result.filter(h => {
                    const price = h.price || h.rooms?.[0]?.price || 0;
                    return price >= range.min && price < range.max;
                });
            }
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
    }, [allHotels, cityName, searchQuery, propertyType, sortBy, budgetRange]);

    // Get other cities for suggestions
    const otherCities = useMemo(() => {
        const cityMap = {};
        allHotels.forEach(hotel => {
            const city = (hotel.city || '').trim();
            if (city && city.toLowerCase() !== cityName.toLowerCase()) {
                if (!cityMap[city]) cityMap[city] = 0;
                cityMap[city]++;
            }
        });
        return Object.entries(cityMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count]) => ({ name, count }));
    }, [allHotels, cityName]);

    const citySlugify = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <SEO
                title={`Hotels in ${cityName} - Infinite Yatra | Best Stays & Deals`}
                description={`Find the best hotels, resorts, homestays, and dormitories in ${cityName}. Book verified stays at the best prices with Infinite Yatra.`}
                url={`/hotels/city/${citySlug}`}
            />

            {/* Hero Banner */}
            <div className="relative bg-gradient-to-b from-blue-900/30 to-[#0a0a0a] pt-28 pb-12">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
                        <Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link>
                        <span>/</span>
                        <span className="text-white">{cityName}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <MapPin size={24} className="text-blue-400" />
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    Hotels in {cityName}
                                </h1>
                            </div>
                            <p className="text-zinc-400">
                                {loading ? 'Loading...' : `${cityHotels.length} ${cityHotels.length === 1 ? 'property' : 'properties'} found`}
                                {' '}— Hotels, Resorts, Homestays & more
                            </p>
                        </div>

                        {/* Search within city */}
                        <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder={`Search in ${cityName}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-8">
                    {/* Property Type Chips */}
                    <div className="flex-1 overflow-x-auto pb-2">
                        <div className="flex gap-2">
                            {PROPERTY_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPropertyType(type)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${propertyType === type
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500'
                                    }`}
                                >
                                    {type === 'All' ? 'All Types' : type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget + Sort */}
                    <div className="flex gap-3 shrink-0">
                        <select
                            value={budgetRange}
                            onChange={(e) => setBudgetRange(e.target.value)}
                            className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:border-blue-500/50 appearance-none"
                        >
                            {BUDGET_RANGES.map(range => (
                                <option key={range.id} value={range.id} className="bg-zinc-900">{range.label}</option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:border-blue-500/50 appearance-none"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id} className="bg-zinc-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading hotels in {cityName}...</div>
                ) : cityHotels.length === 0 ? (
                    <div className="text-center py-20">
                        <MapPin size={48} className="mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No properties found in {cityName}</h3>
                        <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                            We're expanding to new cities every week. Check back soon or browse other destinations.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link
                                to="/hotels/all"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                            >
                                Browse All Hotels
                            </Link>
                            <a
                                href={`https://wa.me/919265799325?text=${encodeURIComponent(`Hi, I'm looking for hotels in ${cityName}. Can you help?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
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
                                transition={{ delay: i * 0.05 }}
                            >
                                <HotelCard {...hotel} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Explore Other Cities */}
                {otherCities.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-zinc-800">
                        <h3 className="text-xl font-bold text-white mb-6">Explore Other Destinations</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {otherCities.map(city => (
                                <Link
                                    key={city.name}
                                    to={`/hotels/city/${citySlugify(city.name)}`}
                                    className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group"
                                >
                                    <MapPin size={16} className="text-blue-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{city.name}</p>
                                        <p className="text-[10px] text-zinc-500">{city.count} stays</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
};

export default CityHotels;
