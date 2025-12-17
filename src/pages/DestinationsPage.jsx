import React, { useState, useEffect, useMemo } from 'react';
import Destinations from '../components/Destinations';
import SearchFilter from '../components/SearchFilter';
import SEO from '../components/SEO';
import { packages } from '../data/packages';

const DestinationsPage = () => {
    const minPrice = Math.min(...packages.map(p => p.price));
    const maxPrice = Math.max(...packages.map(p => p.price));

    const [filters, setFilters] = useState({
        search: '',
        priceRange: maxPrice,
        category: 'All',
        duration: 'All',
        sortBy: 'Recommended'
    });

    const [filteredPackages, setFilteredPackages] = useState(packages);

    useEffect(() => {
        // Scroll to top when page loads
        window.scrollTo(0, 0);
    }, []);

    // Filter Logic
    useEffect(() => {
        const result = packages.filter(pkg => {
            // 1. Search (Title or Location)
            const searchMatch =
                pkg.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                pkg.location.toLowerCase().includes(filters.search.toLowerCase());

            // 2. Price
            const priceMatch = pkg.price <= filters.priceRange;

            // 3. Category
            let categoryMatch = true;
            if (filters.category !== 'All') {
                const isTrek = pkg.title.toLowerCase().includes('trek');
                const isSpiritual = pkg.title.toLowerCase().includes('yatra') || pkg.title.toLowerCase().includes('temple') || pkg.id === 'kedarnath' || pkg.id === 'tungnath';
                const isTour = !isTrek && !isSpiritual; // Fallback for tours
                const isAdventure = isTrek || pkg.difficulty === 'Moderate' || pkg.difficulty === 'Hard';

                if (filters.category === 'Trek') categoryMatch = isTrek;
                else if (filters.category === 'Tour') categoryMatch = isTour;
                else if (filters.category === 'Spiritual') categoryMatch = isSpiritual;
                else if (filters.category === 'Adventure') categoryMatch = isAdventure;
            }

            // 4. Duration
            let durationMatch = true;
            if (filters.duration !== 'All') {
                const days = parseInt(pkg.duration); // "6 Days / 5 Nights" -> 6
                if (filters.duration === 'Short (< 5 days)') durationMatch = days < 5;
                else if (filters.duration === 'Medium (5-8 days)') durationMatch = days >= 5 && days <= 8;
                else if (filters.duration === 'Long (> 8 days)') durationMatch = days > 8;
            }

            return searchMatch && priceMatch && categoryMatch && durationMatch;
        });



        // Sorting Logic
        const sortedResult = [...result].sort((a, b) => {
            if (filters.sortBy === 'Price: Low to High') {
                return a.price - b.price;
            } else if (filters.sortBy === 'Price: High to Low') {
                return b.price - a.price;
            } else if (filters.sortBy === 'Duration: Shortest') {
                return parseInt(a.duration) - parseInt(b.duration);
            } else if (filters.sortBy === 'Duration: Longest') {
                return parseInt(b.duration) - parseInt(a.duration);
            }
            return 0; // Recommended (Default order)
        });

        setFilteredPackages(sortedResult);
    }, [filters]);

    return (
        <div className="pt-24 pb-12 bg-slate-50 min-h-screen">
            <SEO
                title="Destinations"
                description="Explore our curated collection of treks, tours, and spiritual journeys. Find your dream journey with Infinite Yatra."
                url="/destinations"
            />
            <div className="container mx-auto px-6">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Find Your Dream Journey
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Explore our curated collection of treks, tours, and spiritual journeys.
                        Use the filters below to find the perfect package for you.
                    </p>
                </div>

                <SearchFilter
                    filters={filters}
                    setFilters={setFilters}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                />

                <Destinations
                    packages={filteredPackages}
                    title="Available Packages"
                    showViewAll={false}
                />
            </div>
        </div>
    );
};

export default DestinationsPage;
