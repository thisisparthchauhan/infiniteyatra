'use client';

import React from 'react';
import Hero from '@/components/ui/Hero';
import HotelCard from '@/components/ui/HotelCard';

// Mock Data
const HOTELS = [
    {
        id: '1',
        slug: 'grand-iy-resort',
        name: 'The Grand IY Resort',
        city: 'Goa',
        rating: 4.8,
        price: 12000,
        imageUrl: 'https://images.unsplash.com/photo-1571896349842-6e53ce41be03?auto=format&fit=crop&q=80'
    },
    {
        id: '2',
        slug: 'himalayan-sanctuary',
        name: 'Himalayan Sanctuary',
        city: 'Manali',
        rating: 4.9,
        price: 8500,
        imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700206dee6?auto=format&fit=crop&q=80'
    },
    {
        id: '3',
        slug: 'urban-escape',
        name: 'IY Urban Escape',
        city: 'Mumbai',
        rating: 4.5,
        price: 9000,
        imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80'
    },
    {
        id: '4',
        slug: 'desert-camp',
        name: 'Thar Desert Luxury Camp',
        city: 'Jaisalmer',
        rating: 4.7,
        price: 15000,
        imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80'
    }
];

export default function HotelsPage() {
    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-black">
            <Hero />

            <section className="container mx-auto px-4 py-20">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Featured Stays</h2>
                        <p className="text-zinc-500">Handpicked collections for your next journey.</p>
                    </div>
                    <button className="text-zinc-900 dark:text-white font-semibold underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900 dark:hover:decoration-white transition-all">
                        View All Hotels
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {HOTELS.map((hotel) => (
                        <HotelCard key={hotel.id} {...hotel} />
                    ))}
                </div>
            </section>
        </main>
    );
}
