import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Filter, SlidersHorizontal, MapPin, Car } from 'lucide-react';
import { getVehicles, getCities } from '../../services/transportService';
import TransportVehicleCard from '../../components/transport/TransportVehicleCard';

const TransportListings = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const initialCity = searchParams.get('city') || '';
    const initialType = searchParams.get('type') || 'all';

    const [vehicles, setVehicles] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        city: initialCity,
        type: initialType,
        minPrice: '',
        maxPrice: '',
        driverIncluded: false,
        fuelIncluded: false,
    });

    const [layout, setLayout] = useState('grid'); // 'grid' | 'list'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vData, cData] = await Promise.all([
                getVehicles(),
                getCities()
            ]);
            setVehicles(vData.filter(v => v.isActive && v.isVisible));
            setCities(cData.filter(c => c.isActive));
        } catch (error) {
            console.error('Error fetching data for listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const filteredVehicles = vehicles.filter(v => {
        if (filters.city && filters.city !== 'all' && v.city !== filters.city) return false;
        if (filters.type && filters.type !== 'all' && v.type !== filters.type) return false;
        if (filters.minPrice && v.pricePerDay < Number(filters.minPrice)) return false;
        if (filters.maxPrice && v.pricePerDay > Number(filters.maxPrice)) return false;
        if (filters.driverIncluded && !v.driverIncluded) return false;
        if (filters.fuelIncluded && !v.fuelIncluded) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-20">
            <div className="container mx-auto px-6 lg:px-8 max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Available Fleet
                    </h1>
                    <p className="text-slate-400 font-medium">
                        {filteredVehicles.length} vehicles found matching your criteria.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-1/4">
                        <div className="bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-800 sticky top-28">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                                <Filter size={20} className="text-blue-500" />
                                <h3 className="font-bold text-lg text-white">Filters</h3>
                            </div>

                            <div className="space-y-6">

                                {/* City Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <select
                                            name="city"
                                            value={filters.city}
                                            onChange={handleFilterChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors"
                                        >
                                            <option value="all">All Cities</option>
                                            {cities.map(c => <option key={c.id} value={c.cityName}>{c.cityName}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Vehicle Type</label>
                                    <select
                                        name="type"
                                        value={filters.type}
                                        onChange={handleFilterChange}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="car">Car</option>
                                        <option value="bike">Bike / Scooter</option>
                                        <option value="cycle">Cycle</option>
                                        <option value="traveller">Traveller / Van</option>
                                    </select>
                                </div>

                                {/* Price Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Daily Price (₹)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number" name="minPrice" placeholder="Min"
                                            value={filters.minPrice} onChange={handleFilterChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-base focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors placeholder:text-slate-500"
                                        />
                                        <span className="text-slate-600">-</span>
                                        <input
                                            type="number" name="maxPrice" placeholder="Max"
                                            value={filters.maxPrice} onChange={handleFilterChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-white text-base focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-colors placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-3">Options</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox" name="driverIncluded"
                                                checked={filters.driverIncluded} onChange={handleFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-slate-800 rounded border-slate-700 focus:ring-blue-500/50"
                                            />
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">With Driver</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox" name="fuelIncluded"
                                                checked={filters.fuelIncluded} onChange={handleFilterChange}
                                                className="w-4 h-4 text-blue-600 bg-slate-800 rounded border-slate-700 focus:ring-blue-500/50"
                                            />
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Fuel Included</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                <button
                                    onClick={() => setFilters({ city: 'all', type: 'all', minPrice: '', maxPrice: '', driverIncluded: false, fuelIncluded: false })}
                                    className="w-full py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mt-4 border border-transparent hover:border-slate-700"
                                >
                                    Clear All Filters
                                </button>

                            </div>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <main className="w-full lg:w-3/4">

                        {/* Toolbar */}
                        <div className="flex justify-between items-center mb-6 bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-800">
                            <p className="text-sm font-bold text-slate-400 px-3">
                                Showing <span className="text-white">{filteredVehicles.length}</span> results
                            </p>
                            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setLayout('grid')}
                                    className={`p-1.5 rounded-lg transition-colors ${layout === 'grid' ? 'bg-slate-700 shadow text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Filter size={18} />
                                </button>
                                <button
                                    onClick={() => setLayout('list')}
                                    className={`p-1.5 rounded-lg transition-colors ${layout === 'list' ? 'bg-slate-700 shadow text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <SlidersHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="flex justify-center flex-col items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                <p className="font-semibold text-slate-400 animate-pulse">Searching fleet...</p>
                            </div>
                        ) : filteredVehicles.length > 0 ? (
                            <div className={layout === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
                                {filteredVehicles.map(vehicle => (
                                    <TransportVehicleCard key={vehicle.id} vehicle={vehicle} layout={layout} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 shadow-sm flex flex-col items-center">
                                <Car size={48} className="text-slate-600 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No vehicles found</h3>
                                <p className="text-slate-400 font-medium">Try adjusting your filters to see more results.</p>
                                <button
                                    onClick={() => setFilters({ city: 'all', type: 'all', minPrice: '', maxPrice: '', driverIncluded: false, fuelIncluded: false })}
                                    className="mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors border border-slate-700"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </main>

                </div>
            </div>
        </div>
    );
};

export default TransportListings;
