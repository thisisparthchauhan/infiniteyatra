import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Heart } from 'lucide-react';
import { usePackages } from '../context/PackageContext';
import { useWishlist } from '../context/WishlistContext';

const DestinationCard = ({ dest, cardClass, isLight, textPrimary, isInWishlist, toggleWishlist }) => {
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [transformStyle, setTransformStyle] = useState('perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    const [transitionStyle, setTransitionStyle] = useState('transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)');

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        setTransformStyle(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`);
        setTransitionStyle('transform 0.05s linear');
    };

    const handleMouseLeave = () => {
        setTransformStyle('perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
        setTransitionStyle('transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)');
    };

    const handleWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(dest);
    };

    return (
        <div
            ref={cardRef}
            onClick={() => navigate(`/package/${dest.id}`)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group cursor-pointer block relative transition-all"
        >
            <div 
                className={`${cardClass} p-3 h-full flex flex-col`}
                style={{
                    transform: transformStyle,
                    transition: transitionStyle,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform'
                }}
            >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl mb-4" style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}>
                    <img
                        src={dest.image}
                        alt={dest.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button
                            onClick={handleWishlistClick}
                            className="bg-black/40 backdrop-blur-md p-2 rounded-full hover:scale-110 transition-transform group/heart border border-white/10"
                        >
                            <Heart
                                size={18}
                                className={`transition-colors ${isInWishlist(dest.id) ? 'fill-red-500 text-red-500' : 'text-white/70 group-hover/heart:text-red-500'}`}
                            />
                        </button>
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium text-white shadow-sm h-[34px] border border-white/10">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            {dest.rating}
                        </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <span className="glass-btn text-xs !py-2 !px-4">
                            View Details <ArrowRight size={14} className="ml-1" />
                        </span>
                    </div>
                </div>

                <div className="space-y-2 px-1 pb-2 flex-grow flex flex-col justify-between" style={{ transform: 'translateZ(30px)' }}>
                    <div>
                        <div className="flex items-start justify-between">
                            <h3 className={`text-xl font-bold group-hover:text-blue-500 transition-colors font-handwritten tracking-wide leading-tight ${textPrimary}`}>
                                {dest.title}
                            </h3>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                            <div className={`flex items-center gap-1.5 text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                <MapPin size={14} className="text-blue-400" />
                                {dest.location}
                            </div>
                            <span className={`font-bold text-lg ${textPrimary}`}>{dest.priceDisplay}</span>
                        </div>
                    </div>
                    
                    {/* Hidden Explore Button */}
                    <div className="mt-2 overflow-hidden">
                        <div className={`flex items-center font-semibold text-sm transition-all duration-300 transform translate-y-[10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                            Explore Package <ArrowRight size={16} className="ml-1" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Destinations = ({ packages: propPackages, title = "Explore Infinite", subtitle, showViewAll = true, disableHeader = false, variant = 'dark' }) => {
    const { packages } = usePackages();
    const displayPackages = propPackages || packages;
    const { isInWishlist, toggleWishlist } = useWishlist();
    const navigate = useNavigate();

    const isLight = variant === 'light';
    const textPrimary = isLight ? 'text-slate-900' : 'text-white';
    const textSecondary = isLight ? 'text-slate-600' : 'text-white/70';
    const cardClass = isLight
        ? 'bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl'
        : 'glass-card hover:bg-white/10 transition-colors';


    return (
        <section id="destinations" className="py-24 relative z-10">
            <div className="container mx-auto px-6">
                {!disableHeader && (
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${textPrimary}`}>{title}</h2>
                            <p className={`text-xl max-w-xl font-light ${textSecondary}`}>
                                {subtitle || "Curated journeys designed for explorers who want more than just a trip."}
                            </p>
                        </div>
                        {showViewAll && (
                            <Link to="/destinations" className="hidden md:flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors">
                                View all <ArrowRight size={20} />
                            </Link>
                        )}
                    </div>
                )}

                {displayPackages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {displayPackages.map((dest) => (
                            <DestinationCard
                                key={dest.id}
                                dest={dest}
                                cardClass={cardClass}
                                isLight={isLight}
                                textPrimary={textPrimary}
                                isInWishlist={isInWishlist}
                                toggleWishlist={toggleWishlist}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className={`text-xl ${isLight ? 'text-slate-400' : 'text-white/50'}`}>No packages found matching your criteria.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 text-blue-400 font-medium hover:underline"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {showViewAll && (
                    <div className="mt-12 md:hidden text-center">
                        <Link to="/destinations" className={`glass-btn ${isLight ? '!bg-blue-500 !text-white' : ''}`}>
                            View all <ArrowRight size={20} />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Destinations;
