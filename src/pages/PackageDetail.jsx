import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar, TrendingUp, Mountain, Check, X, ArrowLeft, Phone, Mail, MessageCircle, Heart, Share2 } from 'lucide-react';
import { getPackageById } from '../data/packages';
import PhotoGallery from '../components/PhotoGallery';
import Reviews from '../components/Reviews';
import FAQ from '../components/FAQ';
import SEO from '../components/SEO';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import SmartPricing from '../components/SmartPricing';
import PackageBookingCounter from '../components/PackageBookingCounter';
import RecentPackageBookings from '../components/RecentPackageBookings';

const PackageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState(null);
    const [activeDay, setActiveDay] = useState(null);
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { addToast } = useToast();

    useEffect(() => {
        const packageData = getPackageById(id);
        if (packageData) {
            setPkg(packageData);
            window.scrollTo(0, 0);
        } else {
            navigate('/');
        }
    }, [id, navigate]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: pkg.title,
                    text: `Check out this amazing trip to ${pkg.location} on Infinite Yatra!`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            addToast('Link copied to clipboard!', 'success');
        }
    };

    if (!pkg) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading package details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <SEO
                title={pkg.title}
                description={pkg.description}
                image={pkg.image}
                url={`/package/${id}`}
            />
            {/* Hero Section */}
            <div className="relative h-[70vh] overflow-hidden">
                <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-24 left-6 md:left-12 p-3 bg-white/10 backdrop-blur-md rounded-full 
                             text-white hover:bg-white/20 transition-all duration-300 group border border-white/20 z-10"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="absolute top-24 right-20 md:right-28 p-3 bg-white/10 backdrop-blur-md rounded-full 
                             text-white hover:bg-white/20 transition-all duration-300 group border border-white/20 z-10"
                    title="Share this trip"
                >
                    <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                </button>

                {/* Wishlist Button */}
                <button
                    onClick={() => toggleWishlist(pkg)}
                    className="absolute top-24 right-6 md:right-12 p-3 bg-white/10 backdrop-blur-md rounded-full 
                             text-white hover:bg-white/20 transition-all duration-300 group border border-white/20 z-10"
                >
                    <Heart
                        size={20}
                        className={`transition-colors ${isInWishlist(pkg.id) ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-400'}`}
                    />
                </button>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <div className="container mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center gap-1 text-white text-sm font-medium border border-white/30">
                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                {pkg.rating}
                            </div>
                            <div className="px-3 py-1 bg-blue-600/80 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                                {pkg.difficulty}
                            </div>
                            <div className={`px-3 py-1 backdrop-blur-sm rounded-full text-white text-sm font-medium border border-white/30 ${pkg.type === 'fixed' ? 'bg-orange-600/80' : pkg.type === 'mixed' ? 'bg-purple-600/80' : 'bg-green-600/80'}`}>
                                {pkg.type === 'fixed' ? 'Fixed Departure' : pkg.type === 'mixed' ? 'Fixed & Custom' : 'Customizable'}
                            </div>
                            {pkg.discount && (
                                <div className="px-3 py-1 bg-red-600/90 backdrop-blur-sm rounded-full text-white text-sm font-bold animate-pulse">
                                    {pkg.discount}
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{pkg.title}</h1>

                        <div className="flex items-center gap-2 text-white/90 mb-6">
                            <MapPin size={20} />
                            <span className="text-lg">{pkg.location}</span>
                        </div>

                        <div className="flex flex-wrap gap-6 text-white">
                            <div className="flex items-center gap-2">
                                <Calendar size={20} className="text-blue-400" />
                                <div>
                                    <p className="text-xs text-white/70">Duration</p>
                                    <p className="font-semibold">{pkg.duration}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mountain size={20} className="text-blue-400" />
                                <div>
                                    <p className="text-xs text-white/70">Max Altitude</p>
                                    <p className="font-semibold">{pkg.maxAltitude}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-400" />
                                <div>
                                    <p className="text-xs text-white/70">Best Time</p>
                                    <p className="font-semibold">{pkg.bestTime}</p>
                                </div>
                            </div>
                        </div>

                        {(pkg.type === 'fixed' || pkg.type === 'mixed') && pkg.availableDates && (
                            <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 inline-block">
                                <p className="text-white/80 text-sm mb-2">Upcoming Departures</p>
                                <div className="flex flex-wrap gap-2">
                                    {pkg.availableDates.slice(0, 3).map(date => (
                                        <span key={date} className="px-3 py-1 bg-white/20 rounded-lg text-white text-sm font-medium">
                                            {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        </span>
                                    ))}
                                    {pkg.availableDates.length > 3 && (
                                        <span className="px-3 py-1 bg-white/10 rounded-lg text-white/80 text-sm">
                                            +{pkg.availableDates.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Overview */}
                        <section>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Overview</h2>
                            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{pkg.description}</p>
                        </section>

                        {/* Highlights */}
                        <section>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Highlights</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pkg.highlights.map((highlight, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                                    >
                                        <div className="p-1 bg-blue-600 rounded-full mt-1">
                                            <Check size={14} className="text-white" />
                                        </div>
                                        <span className="text-slate-700 font-medium">{highlight}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Itinerary */}
                        <section>
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Detailed Itinerary</h2>
                            <div className="space-y-4">
                                {pkg.itinerary.map((day, index) => (
                                    <div
                                        key={index}
                                        className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all duration-300"
                                    >
                                        <button
                                            onClick={() => setActiveDay(activeDay === index ? null : index)}
                                            className="w-full p-6 bg-white hover:bg-slate-50 transition-colors text-left flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {day.day}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">{day.title}</h3>
                                                    <p className="text-sm text-slate-500">Day {day.day}</p>
                                                </div>
                                            </div>
                                            <div className={`transform transition-transform ${activeDay === index ? 'rotate-180' : ''}`}>
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-slate-400">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </button>

                                        {activeDay === index && (
                                            <div className="p-6 bg-slate-50 border-t border-slate-200">
                                                <p className="text-slate-700 leading-relaxed mb-4">{day.description}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {day.activities.map((activity, actIndex) => (
                                                        <span
                                                            key={actIndex}
                                                            className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600"
                                                        >
                                                            {activity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Inclusions & Exclusions */}
                        <section>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Inclusions */}
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Check size={20} className="text-green-600" />
                                        </div>
                                        Inclusions
                                    </h3>
                                    <ul className="space-y-3">
                                        {pkg.inclusions.map((item, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <Check size={18} className="text-green-600 mt-1 flex-shrink-0" />
                                                <span className="text-slate-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Exclusions */}
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <X size={20} className="text-red-600" />
                                        </div>
                                        Exclusions
                                    </h3>
                                    <ul className="space-y-3">
                                        {pkg.exclusions.map((item, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <X size={18} className="text-red-600 mt-1 flex-shrink-0" />
                                                <span className="text-slate-700">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Photo Gallery */}
                        {pkg.gallery && pkg.gallery.length > 0 && (
                            <section>
                                <h2 className="text-3xl font-bold text-slate-900 mb-6">Photo Gallery</h2>
                                <PhotoGallery images={pkg.gallery} />
                            </section>
                        )}

                        {/* Reviews */}
                        {pkg.reviews && pkg.reviews.length > 0 && (
                            <section>
                                <Reviews reviews={pkg.reviews} />
                            </section>
                        )}

                        {/* FAQ */}
                        {pkg.faqs && pkg.faqs.length > 0 && (
                            <section>
                                <FAQ faqs={pkg.faqs} />
                            </section>
                        )}
                    </div>

                    {/* Right Column - Booking Card */}
                    <div className="lg:col-span-1 hidden md:block">
                        <div className="sticky top-24 space-y-6">
                            {/* Smart Pricing Card */}
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                                <SmartPricing packageData={pkg} />

                                <div className="p-6 space-y-4">
                                    <button
                                        onClick={() => navigate(`/booking/${id}`)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                                                 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300
                                                 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40
                                                 flex items-center justify-center gap-2 group"
                                    >
                                        <Calendar size={20} className="group-hover:scale-110 transition-transform" />
                                        Book Now
                                    </button>

                                    {pkg.pdf && (
                                        <a
                                            href={pkg.pdf}
                                            download
                                            className="w-full bg-white border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600
                                                     text-slate-600 px-6 py-4 rounded-xl font-semibold transition-all duration-300
                                                     flex items-center justify-center gap-2 group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            Download Itinerary
                                        </a>
                                    )}

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-slate-500">or contact us</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <a
                                            href="tel:+919265799325"
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                                        >
                                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                <Phone size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Call us</p>
                                                <p className="font-semibold text-slate-900">+91 9265799325</p>
                                            </div>
                                        </a>

                                        <a
                                            href="mailto:infiniteyatra@gmail.com"
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                                        >
                                            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                                <Mail size={18} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Email us</p>
                                                <p className="font-semibold text-slate-900 text-sm">infiniteyatra@gmail.com</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Counter */}
                            <PackageBookingCounter packageId={id} packageTitle={pkg.title} />

                            {/* Recent Bookings */}
                            <RecentPackageBookings packageTitle={pkg.title} />

                            {/* Info Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                                <h4 className="font-bold text-slate-900 mb-4">Need Help?</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Our travel experts are available 24/7 to help you plan your perfect trip.
                                    Contact us for customized packages and group bookings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Mobile Fixed Booking Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 md:hidden flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div>
                    <p className="text-xs text-slate-500">Starting from</p>
                    <p className="text-xl font-bold text-slate-900">₹{pkg.price.toLocaleString()}</p>
                </div>
                <button
                    onClick={() => navigate(`/booking/${id}`)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30"
                >
                    Book Now
                </button>
            </div>
        </div>
    );
};

export default PackageDetail;
