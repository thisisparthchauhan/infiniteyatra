import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Hero from '../components/Hotels/Hero';
import HotelCard from '../components/Hotels/HotelCard';
import {
    ShieldCheck, Sparkles, Users, Search, MapPin, Building2,
    Home as HomeIcon, Tent, Trees, Castle, Bed, ChevronRight, Star, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { hotels as staticHotels } from '../data/hotels';
import SEO from '../components/SEO';

// Property type configuration
const PROPERTY_TYPES = [
    { id: 'Hotel', label: 'Hotels', icon: Building2, color: 'from-blue-600 to-blue-400' },
    { id: 'Resort', label: 'Resorts', icon: Castle, color: 'from-purple-600 to-purple-400' },
    { id: 'Homestay', label: 'Homestays', icon: HomeIcon, color: 'from-green-600 to-green-400' },
    { id: 'Villa', label: 'Villas', icon: Trees, color: 'from-amber-600 to-amber-400' },
    { id: 'Cottage', label: 'Cottages', icon: HomeIcon, color: 'from-orange-600 to-orange-400' },
    { id: 'Dormitory', label: 'Dormitories', icon: Bed, color: 'from-cyan-600 to-cyan-400' },
    { id: 'Guest House', label: 'Guest Houses', icon: HomeIcon, color: 'from-pink-600 to-pink-400' },
    { id: 'Camp', label: 'Camps & Tents', icon: Tent, color: 'from-emerald-600 to-emerald-400' },
];

const Hotels = () => {
    const navigate = useNavigate();
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [citySearch, setCitySearch] = useState('');

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                let fetchedHotels = [];
                try {
                    const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                    const querySnapshot = await getDocs(q);
                    fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (indexErr) {
                    console.warn("Index query failed, fetching all hotels:", indexErr);
                    const allSnapshot = await getDocs(collection(db, 'hotels'));
                    fetchedHotels = allSnapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(h => h.isVisible !== false);
                }

                if (fetchedHotels.length > 0) {
                    setHotels(fetchedHotels);
                } else {
                    setHotels(staticHotels);
                }
            } catch (error) {
                console.error("Error fetching hotels:", error);
                setHotels(staticHotels);
            } finally {
                setLoading(false);
            }
        };

        fetchHotels();
    }, []);

    // Extract unique cities from hotels
    const cities = useMemo(() => {
        const cityMap = {};
        hotels.forEach(hotel => {
            const city = (hotel.city || '').trim();
            if (city) {
                if (!cityMap[city]) {
                    cityMap[city] = { name: city, count: 0, minPrice: Infinity, image: null };
                }
                cityMap[city].count++;
                const price = hotel.price || hotel.rooms?.[0]?.price || 0;
                if (price > 0 && price < cityMap[city].minPrice) {
                    cityMap[city].minPrice = price;
                }
                if (!cityMap[city].image) {
                    cityMap[city].image = hotel.image || hotel.imageUrl || hotel.images?.[0] || null;
                }
            }
        });
        return Object.values(cityMap).sort((a, b) => b.count - a.count);
    }, [hotels]);

    // Filter cities by search
    const filteredCities = useMemo(() => {
        if (!citySearch.trim()) return [];
        const q = citySearch.toLowerCase();
        return cities.filter(c => c.name.toLowerCase().includes(q));
    }, [cities, citySearch]);

    // Generate city slug
    const citySlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const handleCitySearch = (e) => {
        if (e.key === 'Enter' && citySearch.trim()) {
            navigate(`/hotels/city/${citySlug(citySearch.trim())}`);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <SEO
                title="Hotels - Infinite Yatra | Budget to Luxury Stays"
                description="Find the best hotels, resorts, homestays, villas, and dormitories across India. From budget-friendly to luxury stays, curated by Infinite Yatra."
                url="/hotels"
            />

            <Hero />

            {/* City Search Section */}
            <section className="relative z-10 -mt-8 container mx-auto px-4">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 max-w-3xl mx-auto shadow-2xl">
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search by city — Rishikesh, Jaipur, Shimla, Manali..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            onKeyDown={handleCitySearch}
                            className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 text-lg"
                        />
                        {citySearch && (
                            <button
                                onClick={() => navigate(`/hotels/city/${citySlug(citySearch.trim())}`)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm"
                            >
                                Search
                            </button>
                        )}
                    </div>

                    {/* City search suggestions */}
                    {filteredCities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {filteredCities.slice(0, 5).map(city => (
                                <Link
                                    key={city.name}
                                    to={`/hotels/city/${citySlug(city.name)}`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                                >
                                    <MapPin size={12} className="text-blue-400" />
                                    {city.name}
                                    <span className="text-zinc-500">({city.count})</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Browse by Property Type */}
            <section className="container mx-auto px-4 py-16">
                <div className="mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Browse by Property Type</h2>
                    <p className="text-zinc-500">From budget dormitories to luxury villas — find your perfect stay.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {PROPERTY_TYPES.map((type, i) => {
                        const Icon = type.icon;
                        const count = hotels.filter(h =>
                            (h.category || '').toLowerCase() === type.id.toLowerCase() ||
                            (h.hotelType || []).some(t => t.toLowerCase() === type.id.toLowerCase())
                        ).length;

                        return (
                            <motion.div
                                key={type.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    to={`/hotels/all?type=${encodeURIComponent(type.id)}`}
                                    className="flex flex-col items-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-600 hover:bg-zinc-800/50 transition-all group text-center"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <Icon size={22} className="text-white" />
                                    </div>
                                    <p className="text-sm font-semibold text-white">{type.label}</p>
                                    {count > 0 && (
                                        <p className="text-[10px] text-zinc-500 mt-1">{count} properties</p>
                                    )}
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Popular Cities */}
            {cities.length > 0 && (
                <section className="container mx-auto px-4 py-12">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Popular Destinations</h2>
                            <p className="text-zinc-500">Explore stays in trending cities across India.</p>
                        </div>
                        <Link
                            to="/hotels/all"
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1 transition-colors"
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {cities.slice(0, 10).map((city, i) => (
                            <motion.div
                                key={city.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    to={`/hotels/city/${citySlug(city.name)}`}
                                    className="group block relative overflow-hidden rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-all"
                                >
                                    <div className="aspect-[4/3] bg-zinc-800 relative">
                                        {city.image ? (
                                            <img
                                                src={city.image}
                                                alt={city.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MapPin size={40} className="text-zinc-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-lg font-bold text-white mb-1">{city.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-zinc-400">{city.count} {city.count === 1 ? 'property' : 'properties'}</p>
                                            {city.minPrice < Infinity && (
                                                <p className="text-xs text-green-400">from ₹{city.minPrice.toLocaleString('en-IN')}</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured Stays */}
            <section className="container mx-auto px-4 py-16">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Featured Stays</h2>
                        <p className="text-zinc-500">Handpicked collections for your next journey.</p>
                    </div>
                    <button
                        onClick={() => navigate('/hotels/all')}
                        className="text-white font-semibold underline decoration-zinc-600 underline-offset-4 hover:decoration-white transition-all"
                    >
                        View All Hotels →
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading stays...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {hotels.slice(0, 6).map((hotel) => (
                            <HotelCard key={hotel.id} {...hotel} />
                        ))}
                    </div>
                )}
            </section>

            {/* Trust Section */}
            <section className="py-20 border-t border-zinc-800 bg-[#0a0a0a]">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Book with Infinite Yatra?</h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-lg">We don't just list hotels; we curate experiences. Every stay is verified for quality, safety, and comfort.</p>
                </div>

                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 text-center hover:border-blue-500/50 transition-colors group">
                        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Verified Partners</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Every hotel is physically verified by our ground team to ensure 5-star hygiene and service standards.
                        </p>
                    </div>
                    <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 text-center hover:border-purple-500/50 transition-colors group">
                        <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">Curated Experiences</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            We handpick stays that offer more than a bed — think bonfire nights, guided treks, and local culinary delights.
                        </p>
                    </div>
                    <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 text-center hover:border-green-500/50 transition-colors group">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Users size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">24/7 Journey Support</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            From booking to check-out, our dedicated team is just a call away to assist with any special requests.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Hotels;
