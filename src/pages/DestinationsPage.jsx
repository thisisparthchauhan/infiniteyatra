import React, { useState, useEffect, useMemo } from 'react';
import Destinations from '../components/Destinations';
import SearchFilter from '../components/SearchFilter';
import SEO from '../components/SEO';
import AnimatedBanner from '../components/AnimatedBanner';
import { usePackages } from '../context/PackageContext';

const DestinationsPage = () => {
    const { packages, loading } = usePackages();

    const minPrice = packages.length ? Math.min(...packages.map(p => p.price)) : 0;
    const maxPrice = packages.length ? Math.max(...packages.map(p => p.price)) : 100000;

    const [filters, setFilters] = useState({
        search: '',
        priceRange: 100000, // Default safely high
        category: 'All',
        duration: 'All',
        sortBy: 'Recommended'
    });

    const [filteredPackages, setFilteredPackages] = useState([]);

    // Update filters when packages load
    useEffect(() => {
        if (packages.length > 0) {
            setFilters(prev => ({ ...prev, priceRange: maxPrice }));
            setFilteredPackages(packages);
        }
    }, [packages]);

    useEffect(() => {
        // Scroll to top when page loads
        window.scrollTo(0, 0);
    }, []);

    // Filter Logic
    useEffect(() => {
        if (loading) return;

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
                const isInternational = !pkg.location.includes('India');

                if (filters.category === 'Trek') categoryMatch = isTrek;
                else if (filters.category === 'Tour') categoryMatch = isTour;
                else if (filters.category === 'Spiritual') categoryMatch = isSpiritual;
                else if (filters.category === 'Adventure') categoryMatch = isAdventure;
                else if (filters.category === 'International') categoryMatch = isInternational;
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

            <AnimatedBanner />

            <div className="container mx-auto px-6">
                <div className="mb-10 text-center mt-12">
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

                {/* Show sections only when no filters are active */
                    filters.search === '' && filters.category === 'All' && filters.duration === 'All' ? (
                        <div className="space-y-16">
                            {/* 1. Treks Section */}
                            <Destinations
                                packages={packages.filter(p => p.category === 'trek')}
                                title="Trending Treks"
                                subtitle="Conquer the heights and walk above the clouds."
                                showViewAll={false}
                                disableHeader={false}
                                variant="light"
                            />

                            {/* 2. Spiritual Section */}
                            <Destinations
                                packages={packages.filter(p => p.category === 'spiritual')}
                                title="Spiritual Journeys"
                                subtitle="Find inner peace at the world's holiest shrines."
                                showViewAll={false}
                                disableHeader={false}
                                variant="light"
                            />

                            {/* 3. International Section */}
                            <Destinations
                                packages={packages.filter(p => p.category === 'international')}
                                title="International Getaways"
                                subtitle="Explore iconic destinations beyond boundaries."
                                showViewAll={false}
                                disableHeader={false}
                                variant="light"
                            />
                        </div>
                    ) : (
                        /* Show filtered results as single list */
                        <Destinations
                            packages={filteredPackages}
                            title={filteredPackages.length > 0 ? "Search Results" : "No Results Found"}
                            subtitle={`${filteredPackages.length} packages found matching your criteria`}
                            showViewAll={false}
                            disableHeader={false}
                            variant="light"
                        />
                    )}
            </div>
        </div>
    );
};

export default DestinationsPage;
