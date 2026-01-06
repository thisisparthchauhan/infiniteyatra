import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Heart } from 'lucide-react';
import { packages } from '../data/packages';
import { useWishlist } from '../context/WishlistContext';


const Destinations = ({ packages: propPackages, title = "Explore Infinite", subtitle, showViewAll = true, disableHeader = false }) => {
    const displayPackages = propPackages || packages;
    const { isInWishlist, toggleWishlist } = useWishlist();
    const navigate = useNavigate();

    const handleWishlistClick = (e, pkg) => {
        e.preventDefault(); // Prevent navigating to package detail
        e.stopPropagation();
        toggleWishlist(pkg);
    };

    return (
        <section id="destinations" className="py-24 bg-white relative z-10">
            <div className="container mx-auto px-6">
                {!disableHeader && (
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">{title}</h2>
                            <p className="text-slate-500 text-lg max-w-xl">
                                {subtitle || "Curated journeys designed for explorers who want more than just a trip."}
                            </p>
                        </div>
                        {showViewAll && (
                            <Link to="/destinations" className="hidden md:flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">
                                View all <ArrowRight size={20} />
                            </Link>
                        )}
                    </div>
                )}

                {displayPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {displayPackages.map((dest) => (
                            <Link
                                key={dest.id}
                                to={`/package/${dest.id}`}
                                className="group cursor-pointer block relative"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl mb-4">
                                    <img
                                        src={dest.image}
                                        alt={dest.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={(e) => handleWishlistClick(e, dest)}
                                            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 transition-transform group/heart"
                                        >
                                            <Heart
                                                size={18}
                                                className={`transition-colors ${isInWishlist(dest.id) ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/heart:text-red-500'}`}
                                            />
                                        </button>
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium text-slate-900 shadow-sm h-[34px]">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                            {dest.rating}
                                        </div>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <span className="text-white font-semibold flex items-center gap-2">
                                            View Details <ArrowRight size={18} />
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                                            {dest.title}
                                        </h3>
                                        <span className="text-slate-950 font-bold">{dest.priceDisplay}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                                        <MapPin size={16} />
                                        {dest.location}
                                    </div>


                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-xl text-slate-500">No packages found matching your criteria.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 text-blue-600 font-medium hover:underline"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {showViewAll && (
                    <div className="mt-12 md:hidden text-center">
                        <Link to="/destinations" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">
                            View all <ArrowRight size={20} />
                        </Link>
                    </div>
                )}
            </div>


        </section>
    );
};

export default Destinations;
