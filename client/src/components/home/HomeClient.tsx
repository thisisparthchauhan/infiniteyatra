'use client';
import Hero from '@/components/home/Hero';
import Destinations from '@/components/home/Destinations';
import About from '@/components/home/About';
import TravelStories from '@/components/home/TravelStories';
import { useEffect } from 'react';

interface HomeClientProps {
    featuredTours: Record<string, unknown>[];
}

export default function HomeClient({ featuredTours }: HomeClientProps) {
    // Handle hash scrolling on page load (e.g. /#about from Navbar)
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) return;
        const scrollToHash = () => {
            const el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        };
        setTimeout(scrollToHash, 100);
        setTimeout(scrollToHash, 500);
        setTimeout(scrollToHash, 1000);
    }, []);

    // Cast server-fetched tours to the shape Destinations expects
    const packages = featuredTours as {
        id: string;
        title?: string;
        image?: string;
        rating?: number;
        location?: string;
        priceDisplay?: string;
    }[];

    return (
        <>
            <Hero />
            <div className="flex flex-col items-center w-full">
                <Destinations packages={packages} />
                <TravelStories featuredOnly limitCount={4} />
                <About />
            </div>
        </>
    );
}
