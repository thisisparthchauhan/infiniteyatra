import React, { useEffect, useState } from 'react';
import Hero from '../../components/home/Hero';
import Destinations from '../../components/Destinations';
import About from '../../components/home/About';
import TravelStories from '../../components/home/TravelStories';
import HomeHotels from '../../components/home/HomeHotels';
import HomeTransport from '../../components/home/HomeTransport';

import SEO from '../../components/SEO';
import InstagramFeed from '../../components/home/InstagramFeed';
import RevealOnScroll from '../../components/RevealOnScroll';
import { usePackages } from '../../context/PackageContext';

const Home = () => {
    const { featuredPackages, packages, loading } = usePackages();

    const homepagePackages = featuredPackages && featuredPackages.length > 0
        ? featuredPackages
        : packages.slice(0, 4);

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
                description="Plan Kedarnath Yatra, Char Dham Yatra, Himalayan treks and spiritual travel packages with Infinite Yatra. Curated itinerary support, travel assistance and easy enquiry options."
                keywords="Kedarnath Yatra, Char Dham Yatra, Do Dham, Himalayan treks, spiritual travel, Uttarakhand packages, trekking India, group tours"
                url="/"
            />
            <Hero />

            <div className="flex flex-col items-center w-full">
                <RevealOnScroll width="100%">
                    <Destinations packages={homepagePackages} />
                </RevealOnScroll>

                <RevealOnScroll width="100%">
                    <HomeTransport />
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
