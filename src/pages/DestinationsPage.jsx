import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import SEO from '../components/SEO';
import { usePackages } from '../context/PackageContext';

import HeroSection from '../components/destinations/HeroSection';
import SeasonFilterStrip from '../components/destinations/SeasonFilterStrip';
import EditorsPick from '../components/destinations/EditorsPick';
import CategorizedDestinations from '../components/destinations/CategorizedDestinations';
import InspirationStrip from '../components/destinations/InspirationStrip';

// Lazy-load the heavy map component
const WorldMapView = lazy(() => import('../components/destinations/WorldMapView'));

const gridRef = React.createRef();

const DestinationsPage = () => {
    const { packages, loading } = usePackages();

    const [activeSeason, setActiveSeason] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Scroll to grid when "Explore All Destinations" is clicked in hero
    const handleExploreClick = () => {
        const el = document.getElementById('packages-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // We don't need seasonFilteredPackages here anymore since CategorizedDestinations handles it
    // just pass raw packages, loading, and activeSeason down.

    return (
        <div
            className="min-h-screen"
            style={{ background: '#0a0a0a' }}
        >
            <SEO
                title="Destinations"
                description="Explore our curated collection of treks, tours, and spiritual journeys. Find your dream journey with Infinite Yatra."
                url="/destinations"
            />

            {/* ── Section 1: Cinematic Hero ── */}
            <HeroSection onExploreClick={handleExploreClick} />

            {/* ── Section 2: Season Filter Strip (sticky) ── */}
            <SeasonFilterStrip
                activeSeason={activeSeason}
                setActiveSeason={setActiveSeason}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            {/* ── Section 3: Editor's Pick ── */}
            {viewMode === 'grid' && <EditorsPick />}

            {/* ── Section 4 / 5: Grid or Map ── */}
            <div id="packages-section">
                {viewMode === 'grid' ? (
                    <CategorizedDestinations
                        packages={packages}
                        loading={loading}
                        activeSeason={activeSeason}
                    />
                ) : (
                    <Suspense
                        fallback={
                            <div
                                className="flex items-center justify-center"
                                style={{ height: '65vh', background: '#0a0a0a' }}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"
                                    />
                                    <p className="text-gray-600 text-sm">Loading map…</p>
                                </div>
                            </div>
                        }
                    >
                        <WorldMapView />
                    </Suspense>
                )}
            </div>

            {/* ── Section 6: Inspiration Strip ── */}
            <InspirationStrip />
        </div>
    );
};

export default DestinationsPage;
