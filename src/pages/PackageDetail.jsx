import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronDown, Check, X, Phone, MessageCircle, Plus, Minus, Car } from 'lucide-react';
import { usePackages } from '../context/PackageContext';
import { db } from '../firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import SEO from '../components/SEO';
import AnimatedBanner from '../components/AnimatedBanner';
import PhotoGallery from '../components/PhotoGallery';
import './PackageDetail.css';

const PackageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState(null);
    const [expandedDay, setExpandedDay] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [guests, setGuests] = useState(1);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showFullPackingList, setShowFullPackingList] = useState(false);
    const [transportOptions, setTransportOptions] = useState([]);
    const { getPackageById, loading } = usePackages();

    useEffect(() => {
        if (loading) return;
        const packageData = getPackageById(id);
        if (packageData) {
            setPkg(packageData);
            // Set first available date if exists
            if (packageData.availableDates && packageData.availableDates.length > 0) {
                setSelectedDate(packageData.availableDates[0]);
            }
            window.scrollTo(0, 0);

            // Fetch cross-sell transport
            const fetchTransportOptions = async () => {
                try {
                    const citySearch = packageData.pickupDrop?.split(',')[0] || packageData.location.split(',')[0];
                    if (!citySearch) return;

                    const q = query(
                        collection(db, 'transport_vehicles'),
                        where('city', '==', citySearch.trim()),
                        where('isActive', '==', true),
                        limit(3)
                    );
                    const snap = await getDocs(q);
                    setTransportOptions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch (err) {
                    console.error('Failed to fetch cross-sell transport', err);
                }
            };
            fetchTransportOptions();
        } else {
            navigate('/');
        }
    }, [id, navigate, loading, getPackageById]);

    const toggleDay = (dayIndex) => {
        setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const toggleFaq = (faqId) => {
        setExpandedFaq(expandedFaq === faqId ? null : faqId);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    const handleBookNow = () => {
        navigate(`/booking/${id}`);
    };

    const handleSendEnquiry = () => {
        navigate('/contact');
    };

    const handleWhatsApp = () => {
        const message = `Hi, I'm interested in ${pkg.title}`;
        window.open(`https://wa.me/919265799325?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!pkg) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-slate-400">Loading package details...</p>
                </div>
            </div>
        );
    }

    const thingsToCarry = [
        { category: 'Shoe', icon: '👟' },
        { category: 'Essentials', icon: '🎒' },
        { category: 'Travel Documents', icon: '📄' }
    ];

    return (
        <div className="package-detail-page">
            <SEO
                title={pkg.title}
                description={pkg.description}
                image={pkg.image}
                url={`/package/${id}`}
            />

            {/* Hero Section with Image Gallery */}
            {/* Hero Section with Image Gallery */}
            <div className="hero-section">
                <div className="hero-title">
                    <h1>Experience <span className="font-handwritten text-yellow-400">{pkg.title}</span></h1>
                </div>
                <div className="image-gallery group">
                    {/* Mobile: Horizontal Scroll Snap */}
                    <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
                        {pkg.images && pkg.images.map((image, index) => (
                            <div
                                key={index}
                                className="snap-center shrink-0 w-[90vw] h-80 rounded-2xl overflow-hidden relative shadow-lg"
                                onClick={() => setShowGallery(true)}
                            >
                                <img src={image} alt={`${pkg.title} - ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Grid Layout (Dynamic) */}
                    <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-4 h-[500px]">
                        {pkg.images && pkg.images.slice(0, 5).map((image, index) => {
                            const total = Math.min(pkg.images.length, 5);
                            let spanClass = '';

                            if (total === 1) spanClass = 'col-span-4 row-span-2';
                            else if (total === 2) spanClass = 'col-span-2 row-span-2';
                            else if (total === 3) {
                                spanClass = index === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-2';
                            }
                            else if (total === 4) {
                                if (index === 0) spanClass = 'col-span-2 row-span-2';
                                else spanClass = 'col-span-1 row-span-2'; // 1 Big, 3 Strips
                            }
                            else {
                                // Default 5+ (Bento Grid)
                                spanClass = index === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1';
                            }

                            return (
                                <div
                                    key={index}
                                    className={`relative overflow-hidden rounded-2xl cursor-pointer group/item ${spanClass}`}
                                    onClick={() => setShowGallery(true)}
                                >
                                    <img
                                        src={image}
                                        alt={`${pkg.title}`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors"></div>

                                    {index === total - 1 && (
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100">
                                            <button className="flex items-center gap-2 text-white font-bold bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full backdrop-blur-md transition-all">
                                                <Plus size={20} /> View Gallery
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="content-container">
                {/* Left Column - Main Content */}
                <div className="main-content">
                    {/* Summary Section */}
                    <section className="summary-section">
                        <h2>Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="label">Pickup & Drop</span>
                                <span className="value">{pkg.pickupDrop || pkg.location.split(',')[0]}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Overall</span>
                                <span className="value">{pkg.location.split(',')[0]}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Duration</span>
                                <span className="value">{pkg.duration}</span>
                            </div>
                        </div>
                    </section>

                    {/* Trip Highlights */}
                    <section className="highlights-section">
                        <h2>Trip Highlights</h2>
                        <ul className="highlights-list">
                            {pkg.highlights.map((highlight, index) => (
                                <li key={index}>
                                    <span className="highlight-icon">🎿</span>
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* About This Trip */}
                    <section className="about-section">
                        <h2>About this trip</h2>
                        <div className={`about-content ${showFullDescription ? 'expanded' : ''}`}>
                            <p>{pkg.description}</p>
                        </div>
                        {pkg.description && pkg.description.length > 200 && (
                            <button
                                className="view-more-btn"
                                onClick={() => setShowFullDescription(!showFullDescription)}
                            >
                                {showFullDescription ? 'View Less' : 'View More'}
                            </button>
                        )}
                    </section>

                    {/* What You'll Do - Itinerary */}
                    <section className="itinerary-section">
                        <h2>What you'll do</h2>
                        <div className="itinerary-list">
                            {pkg.itinerary.map((day, index) => (
                                <div key={index} className="itinerary-item">
                                    <button
                                        className="itinerary-header"
                                        onClick={() => toggleDay(index)}
                                    >
                                        <div className="itinerary-left">
                                            <span className="day-label">Day {day.day}</span>
                                            <div className="day-title-main">{day.title}</div>
                                        </div>
                                        <ChevronDown className={`chevron ${expandedDay === index ? 'expanded' : ''}`} />
                                    </button>
                                    {expandedDay === index && (
                                        <div className="itinerary-content">
                                            <p>{day.description}</p>

                                            {/* Day Stats */}
                                            {day.stats && (
                                                <div className="day-stats">
                                                    {day.stats.distance && (
                                                        <div className="stat-item" title="Distance">
                                                            <span>🚗/🥾</span> {day.stats.distance}
                                                        </div>
                                                    )}
                                                    {day.stats.time && (
                                                        <div className="stat-item" title="Time">
                                                            <span>⏱</span> {day.stats.time}
                                                        </div>
                                                    )}
                                                    {day.stats.altitude && (
                                                        <div className="stat-item" title="Altitude">
                                                            <span>⛰</span> {day.stats.altitude}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stay and Meals */}
                                            {(day.stay || day.meals) && (
                                                <div className="day-logistics">
                                                    {day.stay && (
                                                        <div className="logistics-item">
                                                            <strong>Stay:</strong> {day.stay}
                                                        </div>
                                                    )}
                                                    {day.meals && (
                                                        <div className="logistics-item">
                                                            <strong>Meals:</strong> {day.meals}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {day.activities && day.activities.length > 0 && (
                                                <div className="activities">
                                                    {day.activities.map((activity, actIndex) => (
                                                        <span key={actIndex} className="activity-tag">{activity}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* What's Included / Not Included */}
                    <section className="inclusions-section">
                        <div className="inclusions-grid">
                            <div className="inclusions-column">
                                <h3>What's included</h3>
                                <ul>
                                    {pkg.inclusions.map((item, index) => (
                                        <li key={index}>
                                            <Check className="icon-small" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="exclusions-column">
                                <h3>What's not included</h3>
                                <ul>
                                    {pkg.exclusions.map((item, index) => (
                                        <li key={index}>
                                            <X className="icon-small" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Good to Know Section */}
                    {pkg.goodToKnow && pkg.goodToKnow.length > 0 && (
                        <section className="good-to-know-section">
                            <h2>Good to Know</h2>
                            <ul className="info-list">
                                {pkg.goodToKnow.map((item, index) => (
                                    <li key={index}>
                                        <span className="info-bullet">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Who is this trek for Section */}
                    {pkg.whoIsThisFor && pkg.whoIsThisFor.length > 0 && (
                        <section className="who-is-this-for-section">
                            <h2>Who is this trek for?</h2>
                            <ul className="info-list">
                                {pkg.whoIsThisFor.map((item, index) => (
                                    <li key={index}>
                                        <span className="info-bullet">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Things to Carry */}
                    <section className="things-to-carry">
                        <h2>Things to carry</h2>
                        {pkg.packingList ? (
                            <div className="packing-list-container">
                                {pkg.packingList.slice(0, showFullPackingList ? undefined : 2).map((category, index) => (
                                    <div key={index} className="packing-category">
                                        <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            {category.icon && <span>{category.icon}</span>}
                                            {category.category}
                                        </h3>
                                        <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                                            {category.items.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                {pkg.packingList.length > 2 && (
                                    <button
                                        className="view-more-btn"
                                        onClick={() => setShowFullPackingList(!showFullPackingList)}
                                        style={{ marginTop: '1rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        {showFullPackingList ? (
                                            <>
                                                View Less <Minus size={16} />
                                            </>
                                        ) : (
                                            <>
                                                View More <Plus size={16} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="carry-tags">
                                {(pkg.thingsToCarry || thingsToCarry).map((item, index) => (
                                    <span key={index} className="carry-tag">
                                        <span className="carry-icon">{item.icon}</span>
                                        {item.category}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* General Policy */}
                    <section className="policy-section">
                        <button
                            className="policy-header"
                            onClick={() => toggleSection('general')}
                        >
                            <span>General Policy</span>
                            <ChevronDown className={`chevron ${expandedSection === 'general' ? 'expanded' : ''}`} />
                        </button>
                        {expandedSection === 'general' && (
                            <div className="policy-content">
                                <p>All participants must carry valid ID proof. Follow trek leader instructions at all times. Respect local culture and environment.</p>
                            </div>
                        )}
                    </section>

                    {/* Cancellation Policy */}
                    {pkg.cancellationPolicy && pkg.cancellationPolicy.length > 0 && (
                        <section className="policy-section">
                            <button
                                className="policy-header"
                                onClick={() => toggleSection('cancellation')}
                            >
                                <span>Cancellation Policy</span>
                                <ChevronDown className={`chevron ${expandedSection === 'cancellation' ? 'expanded' : ''}`} />
                            </button>
                            {expandedSection === 'cancellation' && (
                                <div className="policy-content">
                                    <ul className="info-list policy-list">
                                        {pkg.cancellationPolicy.map((item, index) => (
                                            <li key={index} style={{ alignItems: 'flex-start', display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <span className="info-bullet" style={{ color: '#ef4444' }}>•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    )}

                    {/* FAQs */}
                    {pkg.faqs && pkg.faqs.length > 0 && (
                        <section className="faq-section">
                            <h2>FAQs</h2>
                            <div className="faq-list">
                                {pkg.faqs.map((faq) => (
                                    <div key={faq.id} className="faq-item">
                                        <button
                                            className="faq-question"
                                            onClick={() => toggleFaq(faq.id)}
                                        >
                                            <span>{faq.question}</span>
                                            <ChevronDown className={`chevron ${expandedFaq === faq.id ? 'expanded' : ''}`} />
                                        </button>
                                        {expandedFaq === faq.id && (
                                            <div className="faq-answer">
                                                <p>{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Transport Cross-Sell */}
                    {transportOptions.length > 0 && (
                        <section className="transport-cross-sell mt-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative z-10">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2"><Car className="text-blue-500 border border-blue-500/20 p-1.5 rounded-lg bg-blue-500/10" size={36} /> Need transport?</h2>
                                    <p className="text-slate-400">Rentals available for your trip in {pkg.pickupDrop?.split(',')[0] || pkg.location.split(',')[0]}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/transport?city=${encodeURIComponent(pkg.pickupDrop?.split(',')[0] || pkg.location.split(',')[0])}`)}
                                    className="hidden md:inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-colors"
                                >
                                    View All Options →
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
                                {transportOptions.map(vehicle => (
                                    <div
                                        key={vehicle.id}
                                        onClick={() => navigate(`/transport/book/${vehicle.id}`)}
                                        className="bg-[#0a0a0a] border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/40 transition-all duration-300 group shadow-lg"
                                    >
                                        <div className="h-40 overflow-hidden relative">
                                            <img src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0e2b'} alt={vehicle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">{vehicle.type}</div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-white text-lg truncate mb-1 group-hover:text-blue-400 transition-colors">{vehicle.name}</h3>
                                            <p className="text-slate-400 text-sm font-medium">₹{vehicle.pricePerDay || vehicle.pricePerHour}<span className="text-xs text-slate-500 font-normal"> / {vehicle.pricePerDay ? 'day' : 'hour'}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate(`/transport?city=${encodeURIComponent(pkg.pickupDrop?.split(',')[0] || pkg.location.split(',')[0])}`)}
                                className="md:hidden mt-6 w-full flex justify-center items-center gap-2 text-white bg-blue-600 hover:bg-blue-500 font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                            >
                                View All Transport
                            </button>
                        </section>
                    )}
                </div>

                {/* Right Column - Sticky Booking Sidebar */}
                <div className="booking-sidebar">
                    <div className="booking-card">
                        {/* Pricing */}
                        <div className="pricing-section">
                            <div className="price-display">
                                <span className="from-text">From</span>
                                <span className="price">₹{pkg.price.toLocaleString()}</span>
                                <span className="per-person">/person</span>
                            </div>
                        </div>

                        {/* Date Selection */}
                        {pkg.availableDates && pkg.availableDates.length > 0 && (
                            <div className="date-selection">
                                {pkg.availableDates.slice(0, 2).map((date, index) => (
                                    <div
                                        key={index}
                                        className={`date-option ${selectedDate === date ? 'selected' : ''}`}
                                        onClick={() => setSelectedDate(date)}
                                    >
                                        <div className="date-radio">
                                            {selectedDate === date && <div className="radio-dot"></div>}
                                        </div>
                                        <div className="date-info">
                                            <div className="date-range">{formatDate(date)}</div>
                                            <div className="date-price">₹{pkg.price.toLocaleString()} <span>/ person • {pkg.duration.split('/')[0].trim()} left</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}



                        {/* Book Now Button */}
                        <button className="book-now-btn" onClick={handleBookNow}>
                            Book Now
                        </button>

                        {/* Questions Section */}
                        <div className="questions-section">
                            <span className="questions-label">Questions?</span>
                            <div className="question-buttons">
                                <button className="question-btn" onClick={handleSendEnquiry}>
                                    Send Enquiry
                                </button>
                                <button className="question-btn whatsapp" onClick={handleWhatsApp}>
                                    WhatsApp Us
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Banner at the end */}
            <AnimatedBanner />

            {/* Full Screen Gallery Overlay */}
            {showGallery && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur-sm absolute top-0 left-0 w-full z-10">
                        <h2 className="text-white text-lg font-semibold">{pkg.title} Gallery</h2>
                        <button
                            onClick={() => setShowGallery(false)}
                            className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="max-w-6xl mx-auto w-full pt-16">
                            <PhotoGallery
                                images={pkg.images.map((url, i) => ({ id: i, url: url, alt: `${pkg.title} ${i + 1}` }))}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackageDetail;
