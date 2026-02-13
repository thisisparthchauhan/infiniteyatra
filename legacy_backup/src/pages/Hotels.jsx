import React from 'react';
import Hero from '../components/Hotels/Hero';
import HotelCard from '../components/Hotels/HotelCard';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { hotels as staticHotels } from '../data/hotels';
import { useEffect, useState } from 'react';

const Hotels = () => {
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                // Fetch only visible hotels
                const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
                const querySnapshot = await getDocs(q);
                const fetchedHotels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (fetchedHotels.length > 0) {
                    setHotels(fetchedHotels);
                } else {
                    // Fallback to static data if DB is empty
                    setHotels(staticHotels);
                }
            } catch (error) {
                console.error("Error fetching hotels:", error);
                setHotels(staticHotels);
            } finally {
                setLoading(false);
            }
        };

        fetchHotels();
    }, []);

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

                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading stays...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {hotels.map((hotel) => (
                            <HotelCard key={hotel.id} {...hotel} />
                        ))}
                    </div>
                )}
            </section>

            {/* NEW: Trust & Verification Section */}
            <section className="py-20 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a]">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Why Book with Infinite Yatra?</h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-lg">We don't just list hotels; we curate experiences. Every stay is verified for quality, safety, and comfort.</p>
                </div>

                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-blue-500/50 transition-colors group">
                        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">Verified Partners</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            Every hotel is physically verified by our ground team to ensure 5-star hygiene and service standards.
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-purple-500/50 transition-colors group">
                        <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">Curated Experiences</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            We handpick stays that offer more than a bed—think bonfire nights, guided treks, and local culinary delights.
                        </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-green-500/50 transition-colors group">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Users size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">24/7 Journey Support</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            From booking to check-out, our dedicated team is just a call away to assist with any special requests.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Hotels;
