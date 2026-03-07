import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Car, Compass, Shield, Zap } from 'lucide-react';
import { getCities, getVehicles } from '../../services/transportService';
import TransportVehicleCard from '../../components/transport/TransportVehicleCard';

const TransportHome = () => {
    const navigate = useNavigate();
    const [cities, setCities] = useState([]);
    const [featuredVehicles, setFeaturedVehicles] = useState([]);
    const [filteredFeatured, setFilteredFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    const vehicleTabs = [
        { id: 'all', label: 'All Vehicles', icon: '🚐' },
        { id: 'cycle', label: 'Cycle / E-Bicycle', icon: '🚲' },
        { id: 'bike', label: 'Bike', icon: '🏍️' },
        { id: 'car', label: 'Car', icon: '🚗' },
        { id: 'traveller', label: 'Traveller', icon: '🚐' }
    ];

    const [searchParams, setSearchParams] = useState({
        city: '',
        type: 'all',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const citiesData = await getCities();
                const activeCities = citiesData.filter(c => c.isActive);
                setCities(activeCities);

                const vehiclesData = await getVehicles();
                const activeVehicles = vehiclesData.filter(v => v.isActive && v.isVisible);
                const sorted = activeVehicles.sort((a, b) => b.totalBookings - a.totalBookings);
                setFeaturedVehicles(sorted);
                setFilteredFeatured(sorted.slice(0, 4));
            } catch (error) {
                console.error("Error fetching transport data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (searchParams.city) queryParams.append('city', searchParams.city);
        if (searchParams.type !== 'all') queryParams.append('type', searchParams.type);
        if (searchParams.startDate) queryParams.append('start', searchParams.startDate);
        if (searchParams.endDate) queryParams.append('end', searchParams.endDate);

        navigate(`/transport/search?${queryParams.toString()}`);
    };

    const handleTabClick = (typeId) => {
        setActiveTab(typeId);
        if (typeId === 'all') {
            setFilteredFeatured(featuredVehicles.slice(0, 4));
        } else {
            setFilteredFeatured(featuredVehicles.filter(v => v.type === typeId).slice(0, 4));
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-20">
            {/* Hero Section */}
            <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                    <img
                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80"
                        alt="Road Trip"
                        className="w-full h-full object-cover scale-105 transform transition-transform duration-[20s] hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-[#0a0a0a]"></div>
                </div>

                <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 md:mb-6 tracking-tight drop-shadow-xl leading-tight">
                            Drive Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Own Adventure.</span>
                        </h1>
                        <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium drop-shadow-md px-2">
                            Book cars, bikes, and caravans instantly across India. Unlimited kilometers, zero deposit.
                        </p>
                    </motion.div>

                    {/* Search Component */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-2xl p-3 md:p-4 rounded-3xl shadow-2xl border border-white/10 mx-auto max-w-4xl"
                    >
                        <form onSubmit={handleSearch} className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-inner flex flex-col md:flex-row gap-4 items-end border border-slate-800">

                            <div className="flex-1 w-full relative">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Pick-up City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                                    <select
                                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-semibold focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors appearance-none cursor-pointer"
                                        value={searchParams.city}
                                        onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled className="text-slate-500">Select City</option>
                                        {cities.map(city => (
                                            <option key={city.id} value={city.cityName}>{city.cityName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Vehicle Type</label>
                                <div className="relative">
                                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                                    <select
                                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-semibold focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors appearance-none cursor-pointer"
                                        value={searchParams.type}
                                        onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                                    >
                                        <option value="all">All Vehicles</option>
                                        <option value="car">Cars</option>
                                        <option value="bike">Bikes / Scooters</option>
                                        <option value="cycle">Cycles</option>
                                        <option value="traveller">Travellers / Vans</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 w-full grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                        <input
                                            type="date"
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pl-9 pr-3 py-3.5 text-white font-semibold text-base focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors cursor-text color-scheme-dark"
                                            value={searchParams.startDate}
                                            onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                                        <input
                                            type="date"
                                            className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pl-9 pr-3 py-3.5 text-white font-semibold text-base focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors cursor-text color-scheme-dark"
                                            value={searchParams.endDate}
                                            onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                <Search size={20} />
                                <span>Search</span>
                            </button>
                        </form>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-[#0a0a0a] border-t border-slate-900">
                <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-800/50 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                                <Compass size={28} className="text-blue-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Unlimited Kilometers</h3>
                            <p className="text-slate-400 leading-relaxed font-medium">Drive as much as you want. We don't cap your adventure. Pay for days, not distance.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 border border-purple-800/50 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-300">
                                <Shield size={28} className="text-purple-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Fully Insured</h3>
                            <p className="text-slate-400 leading-relaxed font-medium">Peace of mind comes standard. Comprehensive insurance included with every booking.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 border border-green-800/50 group-hover:scale-110 group-hover:bg-green-600 transition-all duration-300">
                                <Zap size={28} className="text-green-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Instant Booking</h3>
                            <p className="text-slate-400 leading-relaxed font-medium">No waiting for approvals. Book your ride and hit the road in minutes.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Featured Vehicles Section */}
            <section className="py-20 bg-[#0a0a0a]">
                <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-sm font-bold bg-blue-900/30 text-blue-400 border border-blue-800/50 px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">Popular Fleet</h2>
                            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">Most Loved Vehicles</h3>
                        </div>
                        <button
                            onClick={() => navigate('/transport/search')}
                            className="hidden md:flex text-blue-400 font-bold items-center gap-2 hover:text-blue-300 transition-colors"
                        >
                            View All Fleet <span className="text-xl">→</span>
                        </button>
                    </div>

                    {/* Vehicle Type Tabs (Desktop & Mobile horizontal scroll) */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 mb-8 snap-x snap-mandatory pb-4 select-none">
                        {vehicleTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`snap-start shrink-0 min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-slate-800/80 text-slate-300 border-slate-700/50 hover:bg-slate-700'
                                    }`}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredFeatured.map(vehicle => (
                                <TransportVehicleCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                            {filteredFeatured.length === 0 && !loading && (
                                <p className="col-span-full text-center text-slate-500 py-10 font-medium">No vehicles found in this category.</p>
                            )}
                        </div>
                    )}

                    <div className="mt-8 text-center md:hidden">
                        <button
                            onClick={() => navigate('/transport/search')}
                            className="bg-slate-800 text-white font-bold px-6 py-3 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
                        >
                            Explore All Vehicles
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TransportHome;
