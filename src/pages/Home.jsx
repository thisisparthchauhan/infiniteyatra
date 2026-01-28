import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import Destinations from '../components/Destinations';
import About from '../components/About';
import TravelStories from '../components/TravelStories';

import SEO from '../components/SEO';
import InstagramFeed from '../components/InstagramFeed';
import RevealOnScroll from '../components/RevealOnScroll';
import { usePackages } from '../context/PackageContext';

const Home = () => {
    const { getFeaturedPackages, packages } = usePackages();
    const [homepagePackages, setHomepagePackages] = useState([]);

    useEffect(() => {
        // Get featured packages from context
        const featured = getFeaturedPackages();

        // If no featured packages, fallback to first 4 packages
        if (featured && featured.length > 0) {
            setHomepagePackages(featured);
        } else {
            setHomepagePackages(packages.slice(0, 4));
        }
    }, [getFeaturedPackages, packages]);

    useEffect(() => {
        // Handle hash scrolling when page loads with a hash (e.g., /#about)
        const hash = window.location.hash;
        if (hash) {
            const scrollToHash = () => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            };

            // Initial scroll
            setTimeout(scrollToHash, 100);

            // Retry after potential data loading/layout shifts
            setTimeout(scrollToHash, 500);
            setTimeout(scrollToHash, 1000);
        }
    }, []);

    return (
        <>
            <SEO
                title="Home"
                description="Welcome to Infinite Yatra. Discover your next adventure with our curated travel packages and expert guides."
            />
            <Hero />

            <div className="flex flex-col items-center w-full">
                <RevealOnScroll width="100%">
                    <Destinations packages={homepagePackages} />
                </RevealOnScroll>

                <RevealOnScroll width="100%">
                    <TravelStories featuredOnly={true} limitCount={4} />
                </RevealOnScroll>

                <RevealOnScroll width="100%">
                    <About />
                </RevealOnScroll>

                <RevealOnScroll width="100%">
                    <InstagramFeed />
                </RevealOnScroll>


            </div>
        </>
    );
};

export default Home;
