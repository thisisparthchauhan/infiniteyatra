import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SearchFilter = ({ filters, setFilters, minPrice, maxPrice, variant = 'light' }) => {
    const isDark = variant === 'dark';
    const containerClass = isDark
        ? 'glass-card border border-white/10 text-white'
        : 'bg-white rounded-2xl shadow-lg border border-slate-100';

    const inputClass = isDark
        ? 'bg-white/5 border-white/10 text-white placeholder-slate-400 focus:border-blue-500/50 focus:bg-white/10'
        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-200';

    const labelClass = isDark ? 'text-slate-300' : 'text-slate-700';
    const subTextClass = isDark ? 'text-slate-500' : 'text-slate-400';

    const categories = ['All', 'Trek', 'Tour', 'Spiritual', 'Adventure', 'International'];
    const durations = ['All', 'Short (< 5 days)', 'Medium (5-8 days)', 'Long (> 8 days)'];
    const sortOptions = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Duration: Shortest', 'Duration: Longest'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (category) => {
        setFilters(prev => ({ ...prev, category }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            priceRange: maxPrice,
            category: 'All',
            duration: 'All',
            sortBy: 'Recommended'
        });
    };

    return (
        <div className={`${containerClass} p-6 mb-8 transition-all duration-300`}>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
                {/* Search Bar */}
                <div className="relative w-full md:w-1/2">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-slate-400'}`} size={20} />
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleInputChange}
                        placeholder="Search destinations, locations..."
                        className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none transition-all border focus:ring-2 ${inputClass}`}
                    />
                </div>

                {/* Filter Header / Clear Button */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <SlidersHorizontal size={18} />
                        <span>Filters</span>
                    </div>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                {/* Price Range */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className={`text-sm font-semibold ${labelClass}`}>Max Price</label>
                        <span className="text-sm font-bold text-blue-500">₹{parseInt(filters.priceRange).toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        name="priceRange"
                        min={minPrice}
                        max={maxPrice}
                        step="1000"
                        value={filters.priceRange}
                        onChange={handleInputChange}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}
                    />
                    <div className={`flex justify-between text-xs ${subTextClass}`}>
                        <span>₹{minPrice.toLocaleString()}</span>
                        <span>₹{maxPrice.toLocaleString()}</span>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                    <label className={`text-sm font-semibold ${labelClass}`}>Category</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${filters.category === cat
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                    <label className={`text-sm font-semibold ${labelClass}`}>Duration</label>
                    <select
                        name="duration"
                        value={filters.duration}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 outline-none cursor-pointer ${inputClass}`}
                    >
                        {durations.map(dur => (
                            <option key={dur} value={dur}>{dur}</option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                    <label className={`text-sm font-semibold ${labelClass}`}>Sort By</label>
                    <select
                        name="sortBy"
                        value={filters.sortBy || 'Recommended'}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 outline-none cursor-pointer ${inputClass}`}
                    >
                        {sortOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default SearchFilter;
