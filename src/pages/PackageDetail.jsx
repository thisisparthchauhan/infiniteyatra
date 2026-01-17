import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronDown, Check, X, Phone, MessageCircle, Plus, Minus } from 'lucide-react';
import { usePackages } from '../context/PackageContext';
import SEO from '../components/SEO';
import AnimatedBanner from '../components/AnimatedBanner';
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
            <div className="hero-section">
                <div className="hero-title">
                    <h1>Experience {pkg.title.split(' ')[0]}</h1>
                </div>
                <div className="image-gallery">
                    {pkg.images && pkg.images.slice(0, 5).map((image, index) => (
                        <div key={index} className={`gallery-item item-${index + 1}`}>
                            <img src={image} alt={`${pkg.title} - ${index + 1}`} />
                            {index === 4 && pkg.images.length > 5 && (
                                <div className="see-all-overlay">
                                    <span>See all</span>
                                </div>
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
                                <span className="label">Pickup</span>
                                <span className="value">{pkg.location.split(',')[0]}</span>
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
                                <h3><Check className="icon-check" /> What's included</h3>
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
                                <h3><X className="icon-x" /> What's not included</h3>
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
                                <p>Cancellations made 15+ days before departure: 90% refund. 7-14 days: 50% refund. Less than 7 days: No refund.</p>
                            </div>
                        )}
                    </section>

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

                        {/* Guest Counter */}
                        <div className="guest-counter">
                            <span className="guest-label">Guests</span>
                            <div className="counter-controls">
                                <button
                                    className="counter-btn"
                                    onClick={() => setGuests(Math.max(1, guests - 1))}
                                    disabled={guests <= 1}
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="guest-count">{guests}</span>
                                <button
                                    className="counter-btn"
                                    onClick={() => setGuests(Math.min(pkg.maxGroupSize || 20, guests + 1))}
                                    disabled={guests >= (pkg.maxGroupSize || 20)}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

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
        </div>
    );
};

export default PackageDetail;
