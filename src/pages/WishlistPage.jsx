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
        <div className="pt-24 pb-12 bg-slate-50 min-h-screen">
            <SEO
                title="My Wishlist"
                description="Your saved dream destinations."
                url="/wishlist"
            />
            <div className="container mx-auto px-6">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Your Wishlist
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Your saved dream destinations.
                    </p>
                </div>

                {wishlist.length > 0 ? (
                    <Destinations
                        packages={wishlist}
                        title="Saved Journeys"
                        showViewAll={false}
                    />
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-white p-6 rounded-full inline-block mb-6 shadow-lg">
                            <Heart size={48} className="text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-700 mb-2">Your wishlist is empty</h2>
                        <p className="text-slate-500 mb-12">Start exploring and save your favorite packages!</p>

                        <div className="text-left">
                            <Destinations
                                packages={packages.slice(0, 4)}
                                title="Recommended For You"
                                showViewAll={true}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
