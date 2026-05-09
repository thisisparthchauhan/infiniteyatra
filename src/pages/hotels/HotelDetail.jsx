import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Star, Wifi, Utensils, Car, ShieldCheck, ChevronRight, Plus, Share2,
    Heart, Users, Bed, CheckCircle2, ChevronDown, Calendar, Search, User,
    Phone, MessageCircle, Mail, Clock, Ban, Beer, Info, Coffee, Waves,
    Dumbbell, Wind, UtensilsCrossed, ConciergeBell, WashingMachine, Dog,
    Zap, Mountain, Stethoscope, Truck, Package, Sparkles, Award, ThumbsUp,
    Shield, BadgeCheck, X, ArrowRight, Home, Building2, TreePine, Copy,
    ExternalLink, Navigation, ChevronLeft, ImageIcon, Flame, TrendingUp
} from 'lucide-react';
import { calculateDynamicPrice } from '../../utils/pricingEngine';
import SEO from '../../components/SEO';
import RoomCard from '../../components/RoomCard';
import HotelInquiryModal from '../../components/hotels/HotelInquiryModal';
import HotelReviews from '../../components/hotels/HotelReviews';
import HotelGallery from '../../components/hotels/HotelGallery';

// ─── MOCK DATA FOR DEV/PREVIEW ──────────────────────────────
const MOCK_HOTEL = {
    id: 'mock-1',
    name: 'Zostel Homes Shimla',
    location: 'Shimla, Himachal Pradesh',
    city: 'Shimla',
    address: 'House No 15, IAS Colony, Panthaghati Sargeen, Shimla, Himachal Pradesh - 171013',
    description: "Less than a 30 mins drive from Shimla city centre, Zostel Homes Shimla is settled in a posh locale overlooking the Shimla valley. The entry doors open into an aesthetically decorated living and dining area, with beautiful portraits gracing its main wall. The Homes is spread over three storeys, and visitors are spoilt with spacious rooms that come with a balcony.\n\nSoaking in the sun while scrutinizing the Shimla valley is the idle way to spend your time here. For the workaholics, this homestay offers good WiFi and workspace options to make for a perfect workstation. The humble staff makes you feel at home with home-cooked meals (available only on order) and readily available assistance.",
    price: 3499,
    rating: 4.8,
    reviewCount: 128,
    category: 'Homestay',
    badges: ['Bestseller', 'Mountain View'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1925&q=80',
        'https://images.unsplash.com/photo-1590490360182-c8729931f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80',
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1590490359683-65813c23c985?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80'
    ],
    highlights: ['Mountain View', 'Private Balcony', 'Home-cooked Meals', 'WiFi'],
    amenities: ['Wifi', 'Parking', 'Heater', 'Caretaker', 'Restaurant', 'Room Service', 'Laundry'],
    inclusions: ['Breakfast', 'WiFi', 'Parking'],
    exclusions: ['Lunch/Dinner (Extra)', 'Heater (₹300/night)', 'Bonfire'],
    whoIsThisFor: ['Couples', 'Remote Workers', 'Families'],
    thingsToCarry: ['Warm Clothes', 'Valid ID', 'Personal Medicines'],
    rooms: [
        {
            id: 'r1', name: 'Deluxe Room (with Balcony)', price: 3499, occupancy: 2,
            bedType: 'Double Bed', size: '22 m²', count: 3,
            description: 'Artsy and airy, this room gives off a strong sense of warmth and modernity. Comes with a double bed, a cupboard, a balcony with a mountain view, and an en-suite washroom.',
            images: ['https://images.unsplash.com/photo-1590490360182-c8729931f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80'],
            bathroom: ['Walk-in shower', 'Hair dryer', 'Bathrobe', 'Towels', 'Free toiletries'],
            dining: ['Mini-bar', 'Tea/Coffee maker', 'Bottled water'],
            general: ['WiFi', 'Air Conditioning', 'Safe', 'Ironing facilities', 'Wardrobe', 'Desk'],
            media: ['Flat-screen TV', 'Cable channels'],
            variants: [
                { id: 'v1', name: 'Room Only - Non Refundable', price: 3499, originalPrice: 4500, tags: ['Non-refundable', 'Saver Deal'], inclusions: ['Room Only', 'Free WiFi'] },
                { id: 'v2', name: 'Breakfast Included - Free Cancellation', price: 4299, originalPrice: 5500, tags: ['Free Cancellation', 'Breakfast Included'], inclusions: ['Breakfast', 'Free WiFi', 'Welcome Drink'] }
            ]
        },
        {
            id: 'r2', name: 'Superior Deluxe Room', price: 3999, occupancy: 2,
            bedType: 'King Bed', size: '27 m²', count: 2,
            description: 'Green and serene, this room is perfect for nature lovers and sky gazers.',
            images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'],
            bathroom: ['Bathtub', 'Walk-in shower', 'Hair dryer', 'Bathrobe', 'Slippers'],
            dining: ['Mini-bar', 'Electric kettle', 'Tea/Coffee maker'],
            general: ['WiFi', 'Air Conditioning', 'Safe', 'Seating Area', 'Private Entrance'],
            media: ['Flat-screen TV', 'Streaming services'],
            variants: [
                { id: 'v1', name: 'Room Only', price: 3999, originalPrice: 5000, tags: ['Free Cancellation'], inclusions: ['Room Only', 'Free WiFi'] },
                { id: 'v2', name: 'Breakfast & Dinner', price: 5499, originalPrice: 7000, tags: ['Free Cancellation', 'Half Board'], inclusions: ['Breakfast', 'Dinner', 'Free WiFi'] }
            ]
        },
        {
            id: 'r3', name: 'Family Suite', price: 5999, occupancy: 4,
            bedType: '2 Double Beds', size: '35 m²', count: 1,
            description: 'A quad for your squad, this room is perfectly designed for a close-knit stay.',
            images: ['https://images.unsplash.com/photo-1590490359683-65813c23c985?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80'],
            bathroom: ['2 Bathrooms', 'Shower', 'Hair dryer', 'Towels'],
            dining: ['Dining table', 'Kitchenette', 'Refrigerator', 'Tea/Coffee maker'],
            general: ['WiFi', 'Air Conditioning', 'Safe', 'Wardrobe', 'Sofa'],
            media: ['Flat-screen TV', 'Cable channels'],
            variants: [
                { id: 'v1', name: 'Standard Rate', price: 5999, tags: ['Free Cancellation'], inclusions: ['Room Only', 'Free WiFi'] }
            ]
        }
    ],
    goodToKnow: [
        { label: 'Age Restriction', value: 'Only 18+', icon: 'Ban' },
        { label: 'Check-in', value: '01:00 PM', icon: 'Clock' },
        { label: 'Check-out', value: '10:00 AM', icon: 'Clock' },
        { label: 'Alcohol', value: 'Allowed only in common area', icon: 'Beer' },
        { label: 'Food', value: 'In-house Cafe', icon: 'Utensils' }
    ],
    contact: { phone: '+91 98765 43210', whatsapp: '+91 98765 43210', email: 'info@infiniteyatra.com' },
    cancellationPolicy: "No date modifications (date changes or stay duration reductions) are allowed within the 7-day window prior to the check-in date. Any such requests will be treated as cancellations.",
    propertyPolicy: "Guests are required to show a photo identification and credit card upon check-in.",
    policies: {
        cancellation: 'Free cancellation until 7 days before check-in. 50% refund until 3 days before check-in.',
        child: 'Children above 5 years are chargeable.',
        pet: 'No pets allowed.'
    },
    faqs: [
        { question: 'Is parking available?', answer: 'Yes, free private parking is available on site.' },
        { question: 'Is there WiFi?', answer: 'Yes, high-speed WiFi is available throughout the property.' },
        { question: 'Are pets allowed?', answer: 'No, pets are not allowed at this property.' }
    ]
};

// ─── ICON MAPS ──────────────────────────────
const AMENITY_ICON_MAP = {
    'Wifi': Wifi, 'WiFi': Wifi, 'Breakfast Included': Coffee, 'Swimming Pool': Waves,
    'Gym / Fitness Centre': Dumbbell, 'Parking': Car, 'Air Conditioning': Wind,
    'Restaurant': UtensilsCrossed, 'Room Service': ConciergeBell, 'Spa': Sparkles,
    'Bar/Lounge': Beer, 'Conference Room': Users, 'Laundry': WashingMachine,
    'Pet Friendly': Dog, 'EV Charging': Zap, 'Bonfire Area': Mountain,
    'Doctor on Call': Stethoscope, 'Trek Gear Storage': Package, 'Airport Shuttle': Truck,
    'Heater': Wind, 'Caretaker': User
};

const KNOW_ICON_MAP = {
    'Ban': Ban, 'Clock': Clock, 'Beer': Beer, 'Utensils': Utensils, 'Info': Info
};

const NAV_SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'location', label: 'Location' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'policies', label: 'Policies' },
    { id: 'faqs', label: 'FAQs' }
];

// ─── RATING LABELS ──────────────────────────
const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Exceptional';
    if (rating >= 4.0) return 'Excellent';
    if (rating >= 3.5) return 'Very Good';
    if (rating >= 3.0) return 'Good';
    return 'Pleasant';
};

const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'bg-green-500';
    if (rating >= 4.0) return 'bg-green-600';
    if (rating >= 3.5) return 'bg-blue-500';
    return 'bg-yellow-500';
};

// ─── MAIN COMPONENT ──────────────────────────
const HotelDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Core State
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [similarHotels, setSimilarHotels] = useState([]);

    // UI State
    const [activeNav, setActiveNav] = useState('overview');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryStart, setGalleryStart] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [shareToast, setShareToast] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Booking State
    const [checkIn, setCheckIn] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    });
    const [guests, setGuests] = useState(2);
    const [showGuestPicker, setShowGuestPicker] = useState(false);

    // Refs
    const sectionRefs = useRef({});

    // ─── DATA FETCHING ─────────────────────
    useEffect(() => {
        const fetchHotel = async () => {
            if (id === 'mock') {
                setTimeout(() => { setHotel(MOCK_HOTEL); setLoading(false); }, 500);
                return;
            }
            try {
                const docRef = doc(db, 'hotels', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setHotel({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setHotel(MOCK_HOTEL);
                }
            } catch (err) {
                console.error(err);
                setHotel(MOCK_HOTEL);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    // Fetch similar hotels
    useEffect(() => {
        if (!hotel) return;
        const fetchSimilar = async () => {
            try {
                const q = query(collection(db, 'hotels'), where('isVisible', '==', true), limit(6));
                const snap = await getDocs(q);
                const others = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(h => h.id !== hotel.id)
                    .slice(0, 4);
                setSimilarHotels(others);
            } catch { }
        };
        fetchSimilar();
    }, [hotel]);

    // Save to recently viewed
    useEffect(() => {
        if (!hotel) return;
        try {
            const viewed = JSON.parse(localStorage.getItem('iy_recently_viewed_hotels') || '[]');
            const updated = [{ id: hotel.id, name: hotel.name, image: hotel.image, price: hotel.price, city: hotel.city || hotel.location, rating: hotel.rating },
                ...viewed.filter(h => h.id !== hotel.id)].slice(0, 10);
            localStorage.setItem('iy_recently_viewed_hotels', JSON.stringify(updated));
        } catch { }
    }, [hotel]);

    // Check saved status
    useEffect(() => {
        if (!hotel) return;
        try {
            const saved = JSON.parse(localStorage.getItem('iy_saved_hotels') || '[]');
            setIsSaved(saved.includes(hotel.id));
        } catch { }
    }, [hotel]);

    // Scroll spy
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 500);
            // Determine active section
            for (const section of [...NAV_SECTIONS].reverse()) {
                const el = sectionRefs.current[section.id];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 180) {
                        setActiveNav(section.id);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ─── DERIVED DATA ─────────────────────
    const heroImages = useMemo(() => {
        if (!hotel) return [];
        return [hotel.image, ...(hotel.images || [])].filter((v, i, a) => v && a.indexOf(v) === i);
    }, [hotel]);

    const nights = useMemo(() => {
        return Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    }, [checkIn, checkOut]);

    const displayRoom = hotel?.rooms?.[0];
    const nightlyPrice = selectedVariant?.price || selectedRoom?.price || displayRoom?.price || hotel?.price || 0;
    const avgNightlyPrice = parseInt(nightlyPrice);
    const totalStayPrice = avgNightlyPrice * nights;
    const cleaningFee = 850;
    const serviceFee = 450;
    const totalBeforeTaxes = totalStayPrice + cleaningFee + serviceFee;
    const rating = hotel?.rating || 4.5;
    const reviewCount = hotel?.reviewCount || hotel?.reviews || 0;

    // ─── HANDLERS ─────────────────────
    const scrollToSection = (sectionId) => {
        const el = sectionRefs.current[sectionId];
        if (el) {
            const offset = 160;
            const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveNav(sectionId);
        }
    };

    const handleSave = () => {
        try {
            const saved = JSON.parse(localStorage.getItem('iy_saved_hotels') || '[]');
            const updated = isSaved ? saved.filter(id => id !== hotel.id) : [...saved, hotel.id];
            localStorage.setItem('iy_saved_hotels', JSON.stringify(updated));
            setIsSaved(!isSaved);
        } catch { }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: hotel.name, url }); } catch { }
        } else {
            navigator.clipboard?.writeText(url);
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2000);
        }
    };

    const handleRoomSelect = (room, variant) => {
        setSelectedRoom(room);
        setSelectedVariant(variant);
        setShowInquiryModal(true);
    };

    // ─── LOADING & ERROR STATES ─────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <p className="text-zinc-500 text-sm animate-pulse">Loading property details...</p>
            </div>
        </div>
    );

    if (error || !hotel) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white gap-4">
            <Building2 size={48} className="text-zinc-600" />
            <h1 className="text-2xl font-bold">Property Not Found</h1>
            <p className="text-zinc-500 max-w-md text-center">{error || "The property you're looking for doesn't exist or has been removed."}</p>
            <Link to="/hotels" className="px-6 py-3 bg-orange-500 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                Browse Hotels
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-orange-500/30">
            <SEO
                title={`${hotel.name} in ${hotel.city || hotel.location} | Book on Infinite Yatra`}
                description={`Book ${hotel.name} in ${hotel.location}. Starting ₹${nightlyPrice.toLocaleString()}/night. ${hotel.highlights?.slice(0, 3).join(', ')}. Best rates guaranteed.`}
                image={hotel.image}
            />

            {/* ─── STICKY NAV BAR ─────────────── */}
            <AnimatePresence>
                {isScrolled && (
                    <motion.div
                        initial={{ y: -80 }}
                        animate={{ y: 0 }}
                        exit={{ y: -80 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black"
                    >
                        <div className="container mx-auto px-4 max-w-7xl">
                            <div className="flex items-center justify-between h-16">
                                {/* Left: Nav tabs */}
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                    {NAV_SECTIONS.map(section => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                                                activeNav === section.id
                                                    ? 'text-white bg-white/10'
                                                    : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                        >
                                            {section.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Right: Price + CTA */}
                                <div className="hidden md:flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-white">₹{avgNightlyPrice.toLocaleString()}</span>
                                        <span className="text-xs text-zinc-500 ml-1">/ night</span>
                                    </div>
                                    <button
                                        onClick={() => scrollToSection('rooms')}
                                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg shadow-orange-500/20"
                                    >
                                        View Rooms
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── BREADCRUMBS ─────────────── */}
            <div className="container mx-auto px-4 max-w-7xl pt-24 pb-4">
                <nav className="flex items-center gap-2 text-xs text-zinc-500">
                    <Link to="/" className="hover:text-white transition-colors flex items-center gap-1"><Home size={12} /> Home</Link>
                    <ChevronRight size={10} />
                    <Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link>
                    <ChevronRight size={10} />
                    {hotel.city && (
                        <>
                            <Link to={`/hotels/city/${hotel.city.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-white transition-colors">
                                {hotel.city}
                            </Link>
                            <ChevronRight size={10} />
                        </>
                    )}
                    <span className="text-zinc-300 truncate max-w-[200px]">{hotel.name}</span>
                </nav>
            </div>

            {/* ─── HOTEL HEADER ─────────────── */}
            <div className="container mx-auto px-4 max-w-7xl mb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {hotel.category && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {hotel.category}
                                </span>
                            )}
                            {hotel.badges?.map((badge, i) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                                    <Award size={10} /> {badge}
                                </span>
                            ))}
                            {hotel.hotelType?.slice(0, 3).map((type, i) => (
                                <span key={i} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 border border-white/10">
                                    {type}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                            {hotel.name}
                        </h1>

                        {/* Meta Row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            {/* Rating */}
                            <div className="flex items-center gap-2">
                                <span className={`${getRatingColor(rating)} text-white text-sm font-bold px-2.5 py-1 rounded-lg`}>
                                    {rating}
                                </span>
                                <div>
                                    <span className="font-semibold text-white">{getRatingLabel(rating)}</span>
                                    {reviewCount > 0 && (
                                        <span className="text-zinc-500 ml-1">· {reviewCount} reviews</span>
                                    )}
                                </div>
                            </div>

                            <span className="w-1 h-1 rounded-full bg-zinc-700" />

                            {/* Location */}
                            <span className="flex items-center gap-1.5 text-zinc-400">
                                <MapPin size={14} className="text-orange-500" />
                                {hotel.googleMapsUrl ? (
                                    <a href={hotel.googleMapsUrl} target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-all">
                                        {hotel.location || hotel.city}
                                    </a>
                                ) : (
                                    hotel.location || hotel.city
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all active:scale-95"
                        >
                            <Share2 size={16} /> Share
                        </button>
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-all active:scale-95 ${
                                isSaved
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                            }`}
                        >
                            <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Toast */}
            <AnimatePresence>
                {shareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-5 py-3 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2"
                    >
                        <Copy size={14} /> Link copied!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── PHOTO GALLERY GRID (Airbnb-style masonry) ─── */}
            <div className="container mx-auto px-4 max-w-7xl mb-10">
                <div
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[45vh] min-h-[380px] max-h-[520px] rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => { setGalleryStart(0); setGalleryOpen(true); }}
                >
                    {/* Main Large Image */}
                    <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden">
                        <img src={heroImages[0]} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="eager" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>

                    {/* Side Images */}
                    {heroImages.slice(1, 5).map((img, i) => (
                        <div key={i} className="relative group overflow-hidden hidden md:block">
                            <img src={img} alt={`${hotel.name} ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>
                    ))}

                    {/* "Show All" Overlay on Last Image */}
                    {heroImages.length > 5 && (
                        <div className="absolute bottom-4 right-4 md:hidden">
                            <button className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold shadow-xl flex items-center gap-2 hover:bg-zinc-100 transition-colors">
                                <ImageIcon size={14} /> Show all {heroImages.length} photos
                            </button>
                        </div>
                    )}
                </div>

                {/* Show All Photos Button (desktop) */}
                <div className="flex justify-end mt-2">
                    <button
                        onClick={() => { setGalleryStart(0); setGalleryOpen(true); }}
                        className="text-sm text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                        <ImageIcon size={14} /> Show all {heroImages.length} photos
                    </button>
                </div>
            </div>

            {/* ─── MAIN CONTENT: 2 Column Layout ─── */}
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start relative">

                    {/* ─── LEFT CONTENT (2/3) ─── */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* ── OVERVIEW ── */}
                        <section ref={el => sectionRefs.current.overview = el} id="overview">
                            {/* Quick Highlights Strip */}
                            {hotel.highlights?.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {hotel.highlights.map((h, i) => (
                                        <span key={i} className="flex items-center gap-1.5 text-sm text-zinc-300 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                            <Sparkles size={12} className="text-orange-400" />
                                            {h}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Why This Hotel (Booking.com style) */}
                            <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/10 rounded-2xl p-6 mb-8">
                                <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <ThumbsUp size={14} className="text-blue-400" />
                                    Why guests love this place
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {hotel.highlights?.slice(0, 3).map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                            <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                                            {h}
                                        </div>
                                    ))}
                                    {hotel.whoIsThisFor?.slice(0, 2).map((w, i) => (
                                        <div key={`who-${i}`} className="flex items-center gap-2 text-sm text-zinc-300">
                                            <Users size={14} className="text-purple-400 shrink-0" />
                                            Great for {w}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* About / Description */}
                            <h2 className="text-2xl font-bold text-white mb-4">About this property</h2>
                            {(() => {
                                const text = hotel.description || hotel.about || '';
                                if (!text) return <p className="text-zinc-500 italic">No description available.</p>;
                                const truncated = text.length > 400;
                                return (
                                    <div className="text-zinc-300 leading-relaxed text-[15px]">
                                        <p className="whitespace-pre-line">
                                            {isAboutExpanded ? text : text.slice(0, 400) + (truncated ? '...' : '')}
                                        </p>
                                        {truncated && (
                                            <button
                                                onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                                className="mt-2 text-orange-400 hover:text-orange-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                {isAboutExpanded ? 'Show less' : 'Read more'} <ChevronDown size={14} className={isAboutExpanded ? 'rotate-180' : ''} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Inclusions & Exclusions */}
                            {(hotel.inclusions?.length > 0 || hotel.exclusions?.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    {hotel.inclusions?.length > 0 && (
                                        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-5">
                                            <h4 className="font-bold text-green-400 text-sm mb-3 flex items-center gap-2">
                                                <CheckCircle2 size={14} /> What's Included
                                            </h4>
                                            <ul className="space-y-2">
                                                {hotel.inclusions.map((item, i) => (
                                                    <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                                                        <CheckCircle2 size={12} className="text-green-500 shrink-0" /> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {hotel.exclusions?.length > 0 && (
                                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                                            <h4 className="font-bold text-red-400 text-sm mb-3 flex items-center gap-2">
                                                <X size={14} /> Not Included
                                            </h4>
                                            <ul className="space-y-2">
                                                {hotel.exclusions.map((item, i) => (
                                                    <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                                                        <X size={12} className="text-red-500 shrink-0" /> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Know Before You Go */}
                            {hotel.goodToKnow?.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Info size={16} className="text-blue-400" />
                                        Know before you go
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {hotel.goodToKnow.map((item, idx) => {
                                            const isString = typeof item === 'string';
                                            const label = isString ? 'Info' : item.label;
                                            const value = isString ? item : item.value;
                                            const iconName = isString ? 'Info' : item.icon;
                                            const IconComp = KNOW_ICON_MAP[iconName] || Info;
                                            return (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 shrink-0">
                                                        <IconComp size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
                                                        <p className="text-sm text-white font-medium">{value}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>

                        <hr className="border-white/5" />

                        {/* ── ROOMS (Booking.com style) ── */}
                        <section ref={el => sectionRefs.current.rooms = el} id="rooms">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Bed size={22} className="text-orange-400" />
                                    Select Your Room
                                </h2>
                                <span className="text-sm text-zinc-500">{hotel.rooms?.length || 0} room type{hotel.rooms?.length !== 1 ? 's' : ''} available</span>
                            </div>
                            <div className="space-y-6">
                                {hotel.rooms?.map(room => (
                                    <RoomCard
                                        key={room.id}
                                        room={room}
                                        hotelImage={hotel.image}
                                        onSelectVariant={handleRoomSelect}
                                    />
                                ))}
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* ── AMENITIES ── */}
                        <section ref={el => sectionRefs.current.amenities = el} id="amenities">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Sparkles size={22} className="text-orange-400" />
                                Amenities & Facilities
                            </h2>
                            {hotel.amenities?.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(showAllAmenities ? hotel.amenities : hotel.amenities.slice(0, 9)).map((amenity, idx) => {
                                            const IconComp = AMENITY_ICON_MAP[amenity] || CheckCircle2;
                                            return (
                                                <div key={idx} className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-white/10 transition-all">
                                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                                        <IconComp size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium text-zinc-300">{amenity}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {hotel.amenities.length > 9 && (
                                        <button
                                            onClick={() => setShowAllAmenities(!showAllAmenities)}
                                            className="mt-4 text-sm text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition-colors"
                                        >
                                            {showAllAmenities ? 'Show less' : `Show all ${hotel.amenities.length} amenities`}
                                            <ChevronDown size={14} className={showAllAmenities ? 'rotate-180' : ''} />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-zinc-500 italic">No amenities listed yet.</p>
                            )}
                        </section>

                        <hr className="border-white/5" />

                        {/* ── LOCATION ── */}
                        <section ref={el => sectionRefs.current.location = el} id="location">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <MapPin size={22} className="text-orange-400" />
                                Location
                            </h2>
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                                <iframe
                                    src={(() => {
                                        if (hotel.googleMapsUrl?.includes('embed')) return hotel.googleMapsUrl;
                                        const q = encodeURIComponent(`${hotel.name} ${hotel.address || hotel.location || ''}`);
                                        return `https://maps.google.com/maps?q=${q}&output=embed`;
                                    })()}
                                    width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade" title={`Map of ${hotel.name}`}
                                />
                            </div>

                            {hotel.address && (
                                <div className="mt-4 flex items-start gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                                    <MapPin size={16} className="text-orange-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-zinc-300">{hotel.address}</p>
                                        {hotel.googleMapsUrl && (
                                            <a href={hotel.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                               className="text-sm text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 mt-1 transition-colors">
                                                Get Directions <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Contact */}
                            <div className="mt-6 flex flex-wrap gap-3">
                                {(hotel.contactPhone || hotel.contact?.phone) && (
                                    <a href={`tel:${hotel.contactPhone || hotel.contact?.phone}`}
                                       className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-all">
                                        <Phone size={16} className="text-green-500" />
                                        <span className="text-white font-medium">Call Property</span>
                                    </a>
                                )}
                                {(hotel.contactEmail || hotel.contact?.email) && (
                                    <a href={`mailto:${hotel.contactEmail || hotel.contact?.email}`}
                                       className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-all">
                                        <Mail size={16} className="text-blue-400" />
                                        <span className="text-white font-medium">Email</span>
                                    </a>
                                )}
                                <a href="https://wa.me/919265799325?text=Hi%2C%20I%20have%20a%20query%20about%20a%20hotel%20listing%20on%20Infinite%20Yatra."
                                   target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm hover:bg-green-500/20 transition-all">
                                    <MessageCircle size={16} className="text-green-400" />
                                    <span className="text-green-400 font-medium">Chat with IY Support</span>
                                </a>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* ── REVIEWS ── */}
                        <section ref={el => sectionRefs.current.reviews = el} id="reviews">
                            <HotelReviews hotelId={hotel.id} hotelName={hotel.name} />
                        </section>

                        <hr className="border-white/5" />

                        {/* ── POLICIES ── */}
                        <section ref={el => sectionRefs.current.policies = el} id="policies">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Shield size={22} className="text-orange-400" />
                                Policies
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cancellation */}
                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                                    <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                                        <X size={14} className="text-red-400" /> Cancellation Policy
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {hotel.cancellationPolicy || hotel.policies?.cancellation || 'Contact us for cancellation details.'}
                                    </p>
                                </div>

                                {/* Property Policy */}
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-5">
                                    <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                                        <Info size={14} className="text-blue-400" /> Property Rules
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {hotel.propertyPolicy || 'Standard property policies apply.'}
                                    </p>
                                </div>

                                {/* Child Policy */}
                                {hotel.policies?.child && (
                                    <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-5">
                                        <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                                            <Users size={14} className="text-purple-400" /> Children Policy
                                        </h3>
                                        <p className="text-sm text-zinc-400">{hotel.policies.child}</p>
                                    </div>
                                )}

                                {/* Pet Policy */}
                                {hotel.policies?.pet && (
                                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                                        <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                                            <Dog size={14} className="text-amber-400" /> Pet Policy
                                        </h3>
                                        <p className="text-sm text-zinc-400">{hotel.policies.pet}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* ── FAQs ── */}
                        <section ref={el => sectionRefs.current.faqs = el} id="faqs">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <MessageCircle size={22} className="text-orange-400" />
                                Frequently Asked Questions
                            </h2>
                            {hotel.faqs?.length > 0 ? (
                                <div className="space-y-3">
                                    {hotel.faqs.map((faq, idx) => (
                                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                                            >
                                                <span className="font-medium text-white text-sm pr-4">{faq.question}</span>
                                                <ChevronDown size={16} className={`text-zinc-500 shrink-0 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {expandedFaq === idx && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-5 pt-0">
                                                            <p className="text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm">No FAQs available. Contact us for any queries.</p>
                            )}
                        </section>
                    </div>

                    {/* ─── RIGHT SIDEBAR: Sticky Booking Widget (Airbnb-style) ─── */}
                    <div className="hidden lg:block">
                        <div className="sticky top-28 space-y-4">
                            {/* Main Booking Card */}
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50 ring-1 ring-white/5">
                                {/* Price Header */}
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-sm text-zinc-500 line-through">₹{Math.round(avgNightlyPrice * 1.2).toLocaleString()}</span>
                                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                                                {Math.round(((avgNightlyPrice * 1.2 - avgNightlyPrice) / (avgNightlyPrice * 1.2)) * 100)}% off
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-3xl font-bold text-white">₹{avgNightlyPrice.toLocaleString()}</span>
                                            <span className="text-sm text-zinc-500">/ night</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`${getRatingColor(rating)} text-white text-xs font-bold px-2 py-1 rounded-lg`}>
                                            ★ {rating}
                                        </span>
                                        {reviewCount > 0 && (
                                            <span className="text-[10px] text-zinc-500 mt-1">{reviewCount} reviews</span>
                                        )}
                                    </div>
                                </div>

                                {/* Date & Guest Picker */}
                                <div className="border border-zinc-700 rounded-xl overflow-hidden mb-4">
                                    <div className="grid grid-cols-2">
                                        <div className="p-3 border-r border-b border-zinc-700 bg-white/[0.02] hover:bg-white/[0.05] transition-colors relative">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Check-in</label>
                                            <input
                                                type="date"
                                                value={checkIn}
                                                onChange={(e) => {
                                                    setCheckIn(e.target.value);
                                                    // Auto-adjust checkout if needed
                                                    if (new Date(e.target.value) >= new Date(checkOut)) {
                                                        const next = new Date(e.target.value);
                                                        next.setDate(next.getDate() + 1);
                                                        setCheckOut(next.toISOString().split('T')[0]);
                                                    }
                                                }}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="p-3 border-b border-zinc-700 bg-white/[0.02] hover:bg-white/[0.05] transition-colors relative">
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Check-out</label>
                                            <input
                                                type="date"
                                                value={checkOut}
                                                onChange={(e) => setCheckOut(e.target.value)}
                                                min={checkIn}
                                                className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex justify-between items-center relative">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Guests</label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setGuests(Math.max(1, guests - 1))}
                                                    className="w-7 h-7 rounded-full border border-zinc-600 flex items-center justify-center text-zinc-400 hover:border-white hover:text-white transition-colors"
                                                >−</button>
                                                <span className="text-sm font-medium text-white w-8 text-center">{guests}</span>
                                                <button
                                                    onClick={() => setGuests(Math.min(8, guests + 1))}
                                                    className="w-7 h-7 rounded-full border border-zinc-600 flex items-center justify-center text-zinc-400 hover:border-white hover:text-white transition-colors"
                                                >+</button>
                                                <span className="text-xs text-zinc-500">guest{guests > 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => setShowInquiryModal(true)}
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] text-lg"
                                >
                                    Check Availability
                                </button>
                                <p className="text-center text-xs text-zinc-500 mt-2">You won't be charged yet</p>

                                {/* Price Breakdown */}
                                <div className="mt-5 pt-5 border-t border-white/10 space-y-3 text-sm">
                                    <div className="flex justify-between text-zinc-400">
                                        <span className="underline decoration-dotted decoration-zinc-600 cursor-help">
                                            ₹{avgNightlyPrice.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}
                                        </span>
                                        <span>₹{totalStayPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span className="underline decoration-dotted decoration-zinc-600 cursor-help">Cleaning fee</span>
                                        <span>₹{cleaningFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400">
                                        <span className="underline decoration-dotted decoration-zinc-600 cursor-help">Service fee</span>
                                        <span>₹{serviceFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-white/10 font-bold text-white text-lg">
                                        <span>Total</span>
                                        <span>₹{totalBeforeTaxes.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 text-center">Taxes extra as applicable</p>
                                </div>
                            </div>

                            {/* Trust Signals */}
                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <ShieldCheck size={16} className="text-green-400 shrink-0" />
                                    <span>Secure & encrypted transaction</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <BadgeCheck size={16} className="text-blue-400 shrink-0" />
                                    <span>IY Verified Property</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <MessageCircle size={16} className="text-green-400 shrink-0" />
                                    <span>24/7 WhatsApp support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── MOBILE STICKY BOTTOM BAR ─── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 p-4 safe-area-bottom">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-white">₹{avgNightlyPrice.toLocaleString()}</span>
                            <span className="text-xs text-zinc-500">/ night</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">{nights} night{nights > 1 ? 's' : ''} · ₹{totalBeforeTaxes.toLocaleString()} total</p>
                    </div>
                    <button
                        onClick={() => setShowInquiryModal(true)}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
                    >
                        Check Availability
                    </button>
                </div>
            </div>

            {/* ─── SIMILAR HOTELS ─── */}
            {similarHotels.length > 0 && (
                <div className="container mx-auto px-4 max-w-7xl mt-16 pt-12 border-t border-white/5 pb-20">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp size={22} className="text-orange-400" />
                        Similar Properties You May Like
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {similarHotels.map(h => (
                            <Link key={h.id} to={`/hotels/${h.id}`} className="group bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                                <div className="h-40 overflow-hidden">
                                    <img src={h.image || h.imageUrl} alt={h.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-white text-sm mb-1 truncate">{h.name}</h4>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1"><MapPin size={10} /> {h.city || h.location}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm font-bold text-white">₹{(h.price || 0).toLocaleString()}<span className="text-xs text-zinc-500 font-normal">/night</span></span>
                                        {h.rating && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-bold">★ {h.rating}</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── MODALS ─── */}
            <HotelInquiryModal
                isOpen={showInquiryModal}
                onClose={() => setShowInquiryModal(false)}
                hotel={hotel}
                selectedRoom={selectedRoom || hotel?.rooms?.[0]}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                nights={nights}
                totalStayPrice={totalStayPrice}
                avgNightlyPrice={avgNightlyPrice}
            />

            <HotelGallery
                images={heroImages}
                hotelName={hotel.name}
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                startIndex={galleryStart}
            />
        </div>
    );
};

export default HotelDetail;
