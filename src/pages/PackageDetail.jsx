import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronDown, Check, X, Phone, MessageCircle, Plus, Minus, Car } from 'lucide-react';
import { usePackages } from '../context/PackageContext';
import { db } from '../firebase';
import { collection, query, where, limit, getDocs, documentId } from 'firebase/firestore';
import SEO from '../components/common/SEO';
import AnimatedBanner from '../components/AnimatedBanner';
import PhotoGallery from '../components/PhotoGallery';
import LinkedVehicleCard from '../components/LinkedVehicleCard';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './PackageDetail.css';

const LinkedHotelCard = ({ hotel, navigate }) => {
    const topAmenities = (hotel.amenities || []).slice(0, 3);
  
    return (
      <div className="linked-hotel-card" onClick={() => navigate(`/hotels/${hotel.id}`)}>
        {/* Cover Image */}
        <div className="hotel-card-image">
          <img
            src={hotel.coverImage || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
            alt={hotel.name}
            loading="lazy"
          />
          {/* IY Partner Badge */}
          <div className="iy-partner-badge">★ IY PARTNER</div>
        </div>
  
        {/* Card Body */}
        <div className="hotel-card-body">
          <h3 className="hotel-card-name">{hotel.name}</h3>
          <p className="hotel-card-location">📍 {hotel.city}</p>
  
          {/* Star Category */}
          <p className="hotel-card-category">⭐ {hotel.category}</p>
  
          {/* Top Amenities */}
          {topAmenities.length > 0 && (
            <div className="hotel-card-amenities">
              {topAmenities.map(amenity => (
                <span key={amenity} className="amenity-pill">{amenity}</span>
              ))}
            </div>
          )}
  
          {/* Price */}
          <div className="hotel-card-price">
            <span className="price-label">From</span>
            <span className="price-value">₹{hotel.startingPrice?.toLocaleString('en-IN') || hotel.price?.toLocaleString('en-IN')}</span>
            <span className="price-unit">/night</span>
          </div>
  
          {/* CTA */}
          <button
            className="hotel-card-cta"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/hotels/${hotel.id}`);
            }}
          >
            View & Book →
          </button>
        </div>
      </div>
    );
};

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
    const [linkedHotels, setLinkedHotels] = useState([]);
    const [linkedVehicles, setLinkedVehicles] = useState([]);
    const [selectedLocationIdx, setSelectedLocationIdx] = useState(0);
    const { getPackageById, loading } = usePackages();

    useEffect(() => {
        if (loading) return;
        const packageData = getPackageById(id);
        if (packageData) {
            setPkg(packageData);
            // Set first available date if exists
            if (packageData.batchDates && packageData.batchDates.length > 0) {
                const sorted = [...packageData.batchDates].sort((a,b) => new Date(a.date) - new Date(b.date));
                const firstAvailable = sorted.find(d => d.availableSeats > 0);
                setSelectedDate(firstAvailable ? new Date(firstAvailable.date) : new Date(sorted[0].date));
            } else if (packageData.availableDates && packageData.availableDates.length > 0) {
                setSelectedDate(new Date(packageData.availableDates[0]));
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

    // Fetch Linked Hotels
    useEffect(() => {
        const fetchLinkedHotels = async () => {
            if (!pkg?.linkedHotelIds || pkg.linkedHotelIds.length === 0) {
                setLinkedHotels([]);
                return;
            }

            try {
                // Firestore 'in' query supports up to 10 IDs
                const hotelsSnap = await getDocs(query(
                    collection(db, 'hotels'),
                    where(documentId(), 'in', pkg.linkedHotelIds.slice(0, 10)),
                    where('isVisible', '==', true)
                ));

                setLinkedHotels(hotelsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Failed to fetch linked hotels:", err);
            }
        };

        fetchLinkedHotels();
    }, [pkg?.linkedHotelIds]);

    // Fetch Linked Vehicles
    useEffect(() => {
        const fetchLinkedVehicles = async () => {
            if (!pkg?.linkedVehicleIds || pkg.linkedVehicleIds.length === 0) {
                setLinkedVehicles([]);
                return;
            }

            try {
                // Firestore 'in' query supports up to 10 IDs
                const vehiclesSnap = await getDocs(query(
                    collection(db, 'transportation'),
                    where(documentId(), 'in', pkg.linkedVehicleIds.slice(0, 10)),
                    where('isActive', '==', true)
                ));

                setLinkedVehicles(vehiclesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Failed to fetch linked vehicles:", err);
            }
        };

        fetchLinkedVehicles();
    }, [pkg?.linkedVehicleIds]);

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
        const hasLocations = pkg?.pickupLocations && pkg.pickupLocations.length > 0;
        const selectedLoc = hasLocations ? pkg.pickupLocations[selectedLocationIdx] : null;
        navigate(`/booking/${id}`, {
            state: {
                selectedLocation: selectedLoc ? selectedLoc.location : null,
                locationPrice: selectedLoc ? selectedLoc.price : null,
                selectedDate: selectedDate ? selectedDate.toLocaleDateString('en-CA') : null,
            }
        });
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

                                            {/* Day Stats — only shown if admin filled them */}
                                            {(day.distance || day.time || day.trekDistance || day.trekTime || day.altitude) && (
                                                <div className="day-stats">
                                                    {day.distance && <div className="stat-item" title="Drive Distance"><span>🚗</span> {day.distance}</div>}
                                                    {day.time && <div className="stat-item" title="Drive Time"><span>⏱</span> {day.time}</div>}
                                                    {day.trekDistance && <div className="stat-item" title="Trek Distance"><span>🥾</span> {day.trekDistance}</div>}
                                                    {day.trekTime && <div className="stat-item" title="Trek Time"><span>⏱</span> {day.trekTime}</div>}
                                                    {day.altitude && <div className="stat-item" title="Altitude"><span>⛰</span> {day.altitude}</div>}
                                                </div>
                                            )}

                                            {/* Stay & Meals — only shown if admin filled them */}
                                            {(day.stay || day.meals) && (
                                                <div className="day-logistics">
                                                    {day.stay && <div className="logistics-item"><strong>Stay:</strong> {day.stay}</div>}
                                                    {day.meals && <div className="logistics-item"><strong>Meals:</strong> {day.meals}</div>}
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
                                {(pkg.thingsToCarry && pkg.thingsToCarry.length > 0 ? pkg.thingsToCarry : thingsToCarry).map((item, index) => {
                                    // Support both plain strings (from admin) and legacy {icon, category} objects
                                    const label = typeof item === 'string' ? item : item.category;
                                    const icon = typeof item === 'string' ? null : item.icon;
                                    return (
                                        <span key={index} className="carry-tag">
                                            {icon && <span className="carry-icon">{icon}</span>}
                                            {label}
                                        </span>
                                    );
                                })}
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
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '12px',
                                        padding: '4px 0'
                                    }}>
                                        {pkg.cancellationPolicy.map((item, index) => {
                                            // Replace any hardcoded ₹ token amount with the actual tokenPrice from admin
                                            let displayItem = item;
                                            if (pkg.tokenPrice && /token/i.test(item)) {
                                                const formatted = `₹${Number(pkg.tokenPrice).toLocaleString('en-IN')}`;
                                                displayItem = item.replace(/₹[\d,]+/, formatted);
                                            }
                                            return (
                                                <div key={index} style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '10px'
                                                }}>
                                                    <span style={{ color: '#ef4444', fontSize: '18px', lineHeight: '1.4', flexShrink: 0 }}>•</span>
                                                    <span style={{ fontSize: '14px', lineHeight: '1.5', color: 'inherit' }}>{displayItem}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
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

                    {/* Linked Hotels Section — only renders if hotels exist */}
                    {linkedHotels.length > 0 && (
                        <section className="linked-hotels-section">
                            <div className="section-header">
                                <h2>🏨 Where to Stay</h2>
                                <p>Recommended by Infinite Yatra for this destination</p>
                            </div>

                            <div className="linked-hotels-grid">
                                {linkedHotels.map(hotel => (
                                    <LinkedHotelCard key={hotel.id} hotel={hotel} navigate={navigate} />
                                ))}
                            </div>

                            {/* WhatsApp CTA */}
                            <div className="hotels-whatsapp-cta">
                                <p>Need help choosing the right hotel?</p>
                                <a
                                    href={`https://wa.me/919265799325?text=${encodeURIComponent(`Hi! I'm interested in booking accommodation for the *${pkg.title}* package. Can you suggest the best hotel option?`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="whatsapp-btn"
                                >
                                    💬 Chat with us on WhatsApp
                                </a>
                            </div>
                        </section>
                    )}

                    {/* Linked Vehicles Section — only renders if vehicles are linked */}
                    {linkedVehicles.length > 0 && (
                        <section className="linked-vehicles-section">
                            <div className="section-header">
                                <h2>🚗 Getting There</h2>
                                <p>IY-managed transport options for this trip</p>
                            </div>

                            {/* Route badge */}
                            {pkg.packageRoute && (
                                <div className="route-badge">
                                    📍 Common route: {pkg.packageRoute}
                                </div>
                            )}

                            <div className="linked-vehicles-grid">
                                {linkedVehicles.map(vehicle => (
                                    <LinkedVehicleCard
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        routeHint={pkg.packageRoute}
                                        packageName={pkg.title || pkg.name}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column - Sticky Booking Sidebar */}
                <div className="booking-sidebar">
                    <div className="booking-card">
                        {/* Pricing — dynamic based on selected location */}
                        {(() => {
                            const hasLocations = pkg.pickupLocations && pkg.pickupLocations.length > 0;
                            const activeLoc = hasLocations ? pkg.pickupLocations[selectedLocationIdx] : null;
                            const displayPrice = activeLoc ? activeLoc.price : pkg.price;
                            return (
                                <>
                                    {/* Pickup Location Selector */}
                                    {hasLocations && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 Select Pickup Location</label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {pkg.pickupLocations.map((loc, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setSelectedLocationIdx(idx)}
                                                        style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${selectedLocationIdx === idx ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                                                            background: selectedLocationIdx === idx ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.2)',
                                                            cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left'
                                                        }}
                                                    >
                                                        <span style={{ color: selectedLocationIdx === idx ? '#93c5fd' : '#cbd5e1', fontSize: '14px', fontWeight: 500 }}>{loc.location}</span>
                                                        <span style={{ color: selectedLocationIdx === idx ? '#60a5fa' : '#94a3b8', fontSize: '15px', fontWeight: 700 }}>₹{Number(loc.price).toLocaleString('en-IN')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Price Display */}
                                    <div className="pricing-section">
                                        <div className="price-display">
                                            <span className="from-text">From</span>
                                            <span className="price">₹{Number(displayPrice).toLocaleString()}</span>
                                            <span className="per-person">/person</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Departure Type Badge */}
                        {pkg.departureType && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                                    {pkg.departureType === 'daily' && '📅 Daily Departures'}
                                    {pkg.departureType === 'weekly' && '📆 Weekly Departures'}
                                    {pkg.departureType === 'minimum-clients' && `👥 Min. ${pkg.minimumClients || ''} clients required`}
                                </span>
                            </div>
                        )}

                        {/* Season Dates Badge */}
                        {(pkg.seasonStartDate || pkg.seasonEndDate) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>
                                <span style={{ fontSize: '13px', color: '#86efac' }}>
                                    🗓 Season: {pkg.seasonStartDate ? new Date(pkg.seasonStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                    {pkg.seasonStartDate && pkg.seasonEndDate ? ' – ' : ''}
                                    {pkg.seasonEndDate ? new Date(pkg.seasonEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                </span>
                            </div>
                        )}

                        {/* Date Selection */}
                        <div className="date-selection-calendar">
                            <h3 className="calendar-title">Select Departure Date</h3>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                inline
                                minDate={pkg.seasonStartDate ? new Date(pkg.seasonStartDate) : undefined}
                                maxDate={pkg.seasonEndDate ? new Date(pkg.seasonEndDate) : undefined}
                                renderDayContents={(day, date) => {
                                    if (!pkg?.batchDates) return <span>{day}</span>;
                                    const dateString = date.toLocaleDateString('en-CA');
                                    const batch = pkg.batchDates.find(b => b.date === dateString);

                                    let indicatorClass = '';
                                    let tooltipText = '';

                                    if (batch) {
                                        if (batch.availableSeats === 0) {
                                            indicatorClass = 'sold-out';
                                            tooltipText = 'Sold Out';
                                        } else if (batch.availableSeats <= 10) {
                                            indicatorClass = 'filling-fast';
                                            tooltipText = `Only ${batch.availableSeats} spots left!`;
                                        } else {
                                            indicatorClass = 'available';
                                            tooltipText = 'Available';
                                        }
                                    }

                                    return (
                                        <div className={`custom-day ${indicatorClass}`} title={tooltipText}>
                                            <span>{day}</span>
                                            {batch && <div className="day-indicator"></div>}
                                        </div>
                                    );
                                }}
                                filterDate={(date) => {
                                    // Season window restriction
                                    if (pkg.seasonStartDate && date < new Date(pkg.seasonStartDate)) return false;
                                    if (pkg.seasonEndDate && date > new Date(pkg.seasonEndDate)) return false;
                                    // Batch dates filter (if set)
                                    if (pkg.departureType === 'daily') return true;
                                    if (!pkg?.batchDates || pkg.batchDates.length === 0) {
                                        if (!pkg?.availableDates) return true;
                                        return pkg.availableDates.includes(date.toLocaleDateString('en-CA'));
                                    }
                                    return pkg.batchDates.some(b => b.date === date.toLocaleDateString('en-CA'));
                                }}
                            />
                            {selectedDate && (
                                <div className="selected-date-info">
                                    <div className="date-range">{selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    <div className="date-price">
                                        ₹{(() => {
                                            const hasLoc = pkg.pickupLocations && pkg.pickupLocations.length > 0;
                                            return hasLoc ? Number(pkg.pickupLocations[selectedLocationIdx].price).toLocaleString() : pkg.price.toLocaleString();
                                        })()} <span>/ person</span>
                                    </div>
                                </div>
                            )}
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
