import React, { useMemo } from 'react';
import Destinations from '../Destinations';

const CategorizedDestinations = ({ packages, loading, activeSeason }) => {
    // 1. Filter by season
    const seasonFiltered = useMemo(() => {
        if (!packages) return [];
        if (activeSeason === 'all') return packages;
        
        return packages.filter(pkg => {
            if (!pkg.season) return false;
            const seasons = Array.isArray(pkg.season) ? pkg.season : [pkg.season];
            return seasons.map(s => s.toLowerCase()).includes(activeSeason.toLowerCase());
        });
    }, [packages, activeSeason]);

    // Helper to safely check category
    const hasCategory = (pkg, keywords) => {
        if (!pkg.category) return false;
        const cats = Array.isArray(pkg.category) ? pkg.category : [pkg.category];
        const terms = Array.isArray(keywords) ? keywords : [keywords];
        return cats.some(c => 
            terms.some(term => c.toLowerCase().includes(term.toLowerCase()))
        );
    };

    // 2. Group into the three categories
    const treks = useMemo(() => 
        seasonFiltered.filter(pkg => hasCategory(pkg, ['trek'])), 
    [seasonFiltered]);

    const spiritual = useMemo(() => 
        seasonFiltered.filter(pkg => hasCategory(pkg, ['spiritual', 'yatra'])), 
    [seasonFiltered]);

    const international = useMemo(() => 
        seasonFiltered.filter(pkg => hasCategory(pkg, ['international', 'foreign'])), 
    [seasonFiltered]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Loading destinations…</p>
                </div>
            </div>
        );
    }

    if (seasonFiltered.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-[#0a0a0a] text-center px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No journeys found</h3>
                <p className="text-gray-400">Try selecting a different season to explore more destinations.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-[#0a0a0a] pb-12 pt-8">
            {treks.length > 0 && (
                <Destinations 
                    packages={treks} 
                    title="Trending Treks" 
                    subtitle="Conquer the heights and walk above the clouds." 
                    showViewAll={false}
                    disableHeader={false}
                    variant="dark"
                />
            )}
            
            {spiritual.length > 0 && (
                <Destinations 
                    packages={spiritual} 
                    title="Spiritual Journeys" 
                    subtitle="Find inner peace at the world's holiest shrines." 
                    showViewAll={false}
                    disableHeader={false}
                    variant="dark"
                />
            )}

            {international.length > 0 && (
                <Destinations 
                    packages={international} 
                    title="International Getaways" 
                    subtitle="Explore iconic destinations beyond boundaries." 
                    showViewAll={false}
                    disableHeader={false}
                    variant="dark"
                />
            )}

            {/* Display generic category if there's anything left over that isn't in those 3 */}
            {(() => {
                const otherPackages = seasonFiltered.filter(pkg => 
                    !treks.includes(pkg) && 
                    !spiritual.includes(pkg) && 
                    !international.includes(pkg)
                );
                
                if (otherPackages.length > 0) {
                    return (
                        <Destinations 
                            packages={otherPackages} 
                            title="More Incredible Journeys" 
                            subtitle="Discover hidden gems and unique experiences." 
                            showViewAll={false}
                            disableHeader={false}
                            variant="dark"
                        />
                    );
                }
                return null;
            })()}
        </div>
    );
};

export default CategorizedDestinations;
