import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SearchFilter = ({ filters, setFilters, minPrice, maxPrice }) => {
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
        <div className="glass-card p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
                {/* Search Bar */}
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleInputChange}
                        placeholder="Search destinations, locations..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>

                {/* Filter Header / Clear Button */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2 text-white font-medium">
                        <SlidersHorizontal size={18} />
                        <span>Filters</span>
                    </div>
                    <button
                        onClick={clearFilters}
                        className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-6 border-t border-white/10">
                {/* Price Range */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-slate-200">Max Price</label>
                        <span className="text-sm font-bold text-blue-400">₹{parseInt(filters.priceRange).toLocaleString()}</span>
                    </div>
                    <input
                        type="range"
                        name="priceRange"
                        min={minPrice}
                        max={maxPrice}
                        step="1000"
                        value={filters.priceRange}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>₹{minPrice.toLocaleString()}</span>
                        <span>₹{maxPrice.toLocaleString()}</span>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-200">Category</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${filters.category === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-200">Duration</label>
                    <select
                        name="duration"
                        value={filters.duration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                    >
                        {durations.map(dur => (
                            <option key={dur} value={dur} className="bg-slate-900 text-slate-200">{dur}</option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-200">Sort By</label>
                    <select
                        name="sortBy"
                        value={filters.sortBy || 'Recommended'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                    >
                        {sortOptions.map(option => (
                            <option key={option} value={option} className="bg-slate-900 text-slate-200">{option}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default SearchFilter;
