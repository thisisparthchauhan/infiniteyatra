import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronDown, Check, X, Phone, MessageCircle, Plus, Minus } from 'lucide-react';
import { usePackages } from '../context/PackageContext';
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
                <div className="image-gallery">
                    {pkg.images && pkg.images.slice(0, 3).map((image, index) => (
                        <div
                            key={index}
                            className={`gallery-item item-${index + 1}`}
                            onClick={() => setShowGallery(true)}
                        >
                            <img src={image} alt={`${pkg.title} - ${index + 1}`} />
                            {index === 2 && (
                                <button className="see-all-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                                    See all
                                </button>
                            )}
                        </div>
                    ))}
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
                        <div className="carry-tags">
                            {thingsToCarry.map((item, index) => (
                                <span key={index} className="carry-tag">
                                    <span className="carry-icon">{item.icon}</span>
                                    {item.category}
                                </span>
                            ))}
                        </div>
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
