import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import Destinations from '../components/Destinations';
import About from '../components/About';
import TravelStories from '../components/TravelStories';
import Contact from '../components/Contact';
import SEO from '../components/SEO';
import InstagramFeed from '../components/InstagramFeed';

const Home = () => {
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
            <Destinations />
            <TravelStories />
            <About />
            <InstagramFeed />
            <Contact />
        </>
    );
};

export default Home;
