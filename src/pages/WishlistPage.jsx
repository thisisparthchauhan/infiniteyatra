import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import Destinations from '../components/Destinations';
import SEO from '../components/SEO';
import { packages } from '../data/packages';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const WishlistPage = () => {
    const { wishlist } = useWishlist();

    return (
        <div className="pt-24 pb-12 bg-black min-h-screen relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

            <SEO
                title="My Wishlist"
                description="Your saved dream destinations."
                url="/wishlist"
            />
            <div className="container mx-auto px-6 relative z-10">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Your Wishlist
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Your saved dream destinations.
                    </p>
                </div>

                {wishlist.length > 0 ? (
                    <Destinations
                        packages={wishlist}
                        title="Saved Journeys"
                        showViewAll={false}
                        variant="dark"
                    />
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-white/10 p-6 rounded-full inline-block mb-6 shadow-lg border border-white/10">
                            <Heart size={48} className="text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is empty</h2>
                        <p className="text-slate-400 mb-12">Start exploring and save your favorite packages!</p>

                        <div className="text-left">
                            <Destinations
                                packages={packages.slice(0, 4)}
                                title="Recommended For You"
                                showViewAll={true}
                                variant="dark"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
