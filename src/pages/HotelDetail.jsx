import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, MapPin, Star, Wifi, Utensils, Car, TreePine, Accessibility, ShieldCheck, ChevronRight, Info, Plus, Share2, Heart, Users, Bed, CheckCircle2, XCircle, ChevronDown, Calendar, Search, User, Package, Sparkles, LayoutDashboard, LogOut, Phone, MessageCircle, Mail, Clock, Ban, Beer, FileText } from 'lucide-react';
import { calculateDynamicPrice } from '../utils/pricingEngine';
import RecommendationEngine from '../components/common/RecommendationEngine';
import SEO from '../components/SEO';
import RoomCard from '../components/RoomCard';

// MOCK DATA FOR DEV/PREVIEW
const MOCK_HOTEL = {
    id: 'mock-1',
    name: 'Zostel Homes Shimla',
    location: 'Shimla, Himachal Pradesh',
    address: 'House No 15, IAS Colony, Panthaghati Sargeen, Shimla, Himachal Pradesh - 171013',
    description: "Less than a 30 mins drive from Shimla city centre, Zostel Homes Shimla is settled in a posh locale overlooking the Shimla valley. The entry doors open into an aesthetically decorated living and dining area, with beautiful portraits gracing its main wall. The Homes is spread over three storeys, and visitors are spoilt with spacious rooms that come with a balcony. \n\nSoaking in the sun while scrutinizing the Shimla valley is the idle way to spend your time here. For the workaholics, this homestay offers good WiFi and workspace options to make for a perfect workstation. The humble staff makes you feel at home with home-cooked meals (available only on order) and readily available assistance.",
    price: 3499,
    rating: 4.8,
    reviews: 128,
    category: 'Homestay',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1925&q=80',
        'https://images.unsplash.com/photo-1590490360182-c8729931f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80',
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1590490359683-65813c23c985?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80'
    ],
    highlights: ['Mountain View', 'Private Balcony', 'Home-cooked Meals', 'WiFi'],
    amenities: ['Wifi', 'Parking', 'Heater', 'Caretaker'],
    inclusions: ['Breakfast', 'WiFi', 'Parking'],
    exclusions: ['Lunch/Dinner (Extra)', 'Heater (₹300/night)', 'Bonfire'],
    rooms: [
        {
            id: 'r1',
            name: 'Deluxe Room (with Balcony)',
            price: 3499,
            occupancy: 2,
            bedType: 'Double Bed',
            description: 'Artsy and airy, this room gives off a strong sense of warmth and modernity. Comes with a double bed, a cupboard, a balcony with a mountain view, and an en-suite washroom.',
            images: ['https://images.unsplash.com/photo-1590490360182-c8729931f548?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80'],
            count: 3,
            size: '22 m²',
            bathroom: ['Walk-in shower', 'Hair dryer', 'Bathrobe', 'Towels', 'Free toiletries', 'Shower cap'],
            dining: ['Mini-bar', 'Tea/Coffee maker', 'Bottled water'],
            general: ['WiFi', 'Air Conditioning', 'Safe', 'Ironing facilities', 'Wardrobe', 'Desk'],
            media: ['Flat-screen TV', 'Cable channels'],
            variants: [
                {
                    id: 'v1',
                    name: 'Room Only - Non Refundable',
                    price: 3499,
                    originalPrice: 4500,
                    tags: ['Non-refundable', 'Saver Deal'],
                    inclusions: ['Room Only', 'Free WiFi']
                },
                {
                    id: 'v2',
                    name: 'Breakfast Included - Free Cancellation',
                    price: 4299,
                    originalPrice: 5500,
                    tags: ['Free Cancellation', 'Breakfast Included'],
                    inclusions: ['Breakfast', 'Free WiFi', 'Welcome Drink']
                }
            ]
        },
        {
            id: 'r2',
            name: 'Superior Deluxe Room',
            price: 3999,
            occupancy: 2,
            bedType: 'King Bed',
            description: 'Green and serene, this room is perfect for nature lovers and sky gazers. Comes with a double bed, a balcony with a private garden, and an en-suite washroom.',
            images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'],
            count: 2,
            size: '27 m²',
            bathroom: ['Bathtub', 'Walk-in shower', 'Hair dryer', 'Bathrobe', 'Slippers', 'Towels', 'Free toiletries'],
            dining: ['Mini-bar', 'Electric kettle', 'Tea/Coffee maker', 'Bottled water'],
            general: ['WiFi', 'Air Conditioning', 'Safe', 'Ironing facilities', 'Desk', 'Seating Area', 'Private Entrance'],
            media: ['Flat-screen TV', 'Streaming services', 'Cable channels'],
            variants: [
                {
                    id: 'v1',
                    name: 'Room Only',
                    price: 3999,
                    originalPrice: 5000,
                    tags: ['Free Cancellation'],
                    inclusions: ['Room Only', 'Free WiFi']
                },
                {
                    id: 'v2',
                    name: 'Breakfast & Dinner',
                    price: 5499,
                    originalPrice: 7000,
                    tags: ['Free Cancellation', 'Half Board'],
                    inclusions: ['Breakfast', 'Dinner', 'Free WiFi']
                }
            ]
        },
        {
            id: 'r3',
            name: 'Family Suite',
            price: 5999,
            occupancy: 4,
            bedType: '2 Double Beds',
            description: 'A quad for your squad, this room is perfectly designed for a close-knit stay. Comes with 2 double beds (1 in the attic), a cupboard, a mountain view, and an en-suite washroom.',
            images: ['https://images.unsplash.com/photo-1590490359683-65813c23c985?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80'],
            count: 1,
            size: '35 m²',
            bathroom: ['2 Bathrooms', 'Shower', 'Hair dryer', 'Towels', 'Free toiletries'],
            dining: ['Dining table', 'Kitchenette', 'Refrigerator', 'Microwave', 'Tea/Coffee maker'],
            general: ['WiFi', 'Air Conditioning', 'Safe', 'Wardrobe', 'Sofa', 'Sitting area'],
            media: ['Flat-screen TV', 'Cable channels'],
            variants: [
                {
                    id: 'v1',
                    name: 'Standard Rate',
                    price: 5999,
                    tags: ['Free Cancellation'],
                    inclusions: ['Room Only', 'Free WiFi']
                }
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
    contact: {
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        email: 'stay@infiniteyatra.com'
    },
    cancellationPolicy: "No date modifications (date changes or stay duration reductions) are allowed within the 7-day window prior to the check-in date. Any such requests will be treated as cancellations.",
    propertyPolicy: "Guests are required to show a photo identification and credit card upon check-in. Please note that all Special Requests are subject to availability and additional charges may apply.",
    whoIsThisFor: ['Couples', 'Remote Workers', 'Families'],
    thingsToCarry: ['Warm Clothes', 'Valid ID', 'Personal Medicines'],
    policies: {
        cancellation: 'Free cancellation until 7 days before check-in. 50% refund until 3 days before check-in.',
        child: 'Children above 5 years are chargeable.',
    },
    faqs: [
        { question: 'Is parking available?', answer: 'Yes, free private parking is available on site.' },
        { question: 'Is there WiFi?', answer: 'Yes, high-speed WiFi is available throughout the property.' },
        { question: 'Are pets allowed?', answer: 'No, pets are not allowed at this property.' }
    ]
};

const HotelDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('about');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);

    // Booking State - MOVED UP TO FIX HOOK ERROR
    const [checkIn, setCheckIn] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    });
    const [guests, setGuests] = useState(2);

    // Fetch data
    useEffect(() => {
        const fetchHotel = async () => {
            // For Dev/Redesign: Use Mock data immediately if ID is 'mock' or if fetch fails
            // For Dev/Redesign: Use Mock data immediately if ID is 'mock'
            if (id === 'mock') {
                // Simulate loading
                setTimeout(() => {
                    setHotel(MOCK_HOTEL);
                    setLoading(false);
                }, 800);
                return;
            }

            try {
                const docRef = doc(db, 'hotels', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setHotel({ id: docSnap.id, ...docSnap.data() });
                } else {
                    // Fallback to MOCK if real data not found (for dev experience)
                    console.log("Hotel ID not found, falling back to mock data for UI review");
                    setHotel(MOCK_HOTEL);
                }
            } catch (err) {
                console.error(err);
                // Fallback to MOCK on error
                setHotel(MOCK_HOTEL);
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 140;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            setActiveSection(sectionId);
        }
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error || !hotel) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
            <h1 className="text-2xl font-bold mb-4">Hotel Not Available</h1>
            <p className="text-slate-400 mb-6">{error || "We couldn't find the property you're looking for."}</p>
            <Link to="/hotels" className="px-6 py-2 bg-blue-600 rounded-full font-bold">Browse Hotels</Link>
        </div>
    );

    // Derived Data for UI
    const heroImages = [hotel.image, ...(hotel.images || [])].filter(Boolean);
    const rating = hotel.rating || 4.5;

    // Calculate Total Price based on Date Range and Room Pricing
    const calculateStayCost = (basePrice, pricing = []) => {
        if (!checkIn || !checkOut) return basePrice;

        let total = 0;
        let currentDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (currentDate >= endDate) return basePrice; // Invalid range fallback

        while (currentDate < endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const specificRate = pricing.find(p => p.date === dateStr);

            if (specificRate) {
                total += parseInt(specificRate.price);
            } else {
                total += parseInt(basePrice);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return total;
    };

    // Determine the "Display Price" for the Sidebar
    // Use the first room's pricing if available, else hotel base price
    const displayRoom = hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms[0] : null;
    const nightlyPrice = displayRoom ? parseInt(displayRoom.price) : parseInt(hotel.price);
    const pricingData = displayRoom ? (displayRoom.pricing || []) : [];

    const totalStayPrice = calculateStayCost(nightlyPrice, pricingData);

    // Calculate number of nights
    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const avgNightlyPrice = Math.round(totalStayPrice / nights);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans pb-20 selection:bg-orange-500/30">
            <SEO
                title={`${hotel.name} | Infinite Yatra`}
                description={`Book your stay at ${hotel.name} in ${hotel.location}. Best rates guaranteed.`}
                image={hotel.image}
            />

            {/* HEADER - Navbar */}
            <div className="bg-[#0a0a0a] border-b border-white/5 py-4 sticky top-0 z-50">
                <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center">
                    <Link to="/" className="flex flex-col items-center leading-none gap-1 group">
                        <span className="text-xl md:text-2xl font-bold tracking-[0.25em] text-white uppercase group-hover:text-orange-500 transition-colors duration-300">Infinite Yatra</span>
                        <span className="text-[10px] md:text-[10px] tracking-[0.5em] text-zinc-400 uppercase font-medium group-hover:text-white transition-colors duration-300">Explore Infinite</span>
                    </Link>

                    {/* Quick Search Placeholder */}
                    <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-colors cursor-pointer">
                        <Search size={16} className="text-zinc-400" />
                        <span className="text-sm text-zinc-400">Search for another stay...</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        {currentUser ? (
                            <div className="relative group">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-all cursor-pointer">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white max-w-[100px] truncate hidden md:block">
                                        {currentUser.displayName || currentUser.email.split('@')[0]}
                                    </span>
                                </div>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                    <div className="p-3 border-b border-white/10 opacity-100 visible">
                                        <p className="text-sm font-bold text-white truncate">{currentUser.displayName || 'User'}</p>
                                        <p className="text-xs text-zinc-500 truncate">{currentUser.email}</p>
                                    </div>
                                    <div className="p-1.5 space-y-0.5">
                                        <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                                            <User size={16} className="text-green-500" />
                                            My Profile
                                        </Link>
                                        <Link to="/my-bookings" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                                            <Package size={16} className="text-blue-500" />
                                            My Bookings
                                        </Link>
                                        <Link to="/my-trips" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                                            <Sparkles size={16} className="text-purple-500" />
                                            AI Trips
                                        </Link>

                                        {currentUser.isAdmin && (
                                            <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                                                <LayoutDashboard size={16} className="text-indigo-500" />
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <div className="my-1.5 border-t border-white/10"></div>

                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to log out?')) {
                                                    await logout();
                                                    navigate('/');
                                                }
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-left"
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="text-sm font-semibold hover:text-orange-400 px-4 py-2 rounded-full border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="container mx-auto px-4 max-w-7xl pt-8">

                {/* BREADCRUMBS & TITLE HEADER */}
                <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight size={12} />
                        <Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link>
                        <ChevronRight size={12} />
                        <span className="text-orange-500">{hotel.location?.split(',')[0]}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3 font-display">
                                {hotel.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-orange-500" />
                                    {hotel.googleMapsUrl ? (
                                        <a href={hotel.googleMapsUrl} target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-all">
                                            {hotel.location}
                                        </a>
                                    ) : (
                                        hotel.location
                                    )}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold text-white">{rating}</span>
                                    <span className="text-zinc-500 font-normal">(128 Reviews)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95">
                                <Share2 size={18} /> Share
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 hover:text-red-500">
                                <Heart size={18} /> Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* HERO GRID - BENTO STYLE */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[50vh] min-h-[400px] mb-12 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-700 delay-100">
                    {/* Main Image (Large) */}
                    <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden cursor-pointer">
                        <img
                            src={heroImages[0]}
                            alt={hotel.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    </div>

                    {/* Side Images */}
                    <div className="md:col-span-1 md:row-span-2 flex flex-col gap-3">
                        <div className="flex-1 relative group overflow-hidden cursor-pointer rounded-2xl md:rounded-none">
                            <img src={heroImages[1] || heroImages[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="flex-1 relative group overflow-hidden cursor-pointer rounded-2xl md:rounded-none">
                            <img src={heroImages[2] || heroImages[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                    </div>

                    <div className="md:col-span-1 md:row-span-2 flex flex-col gap-3">
                        <div className="flex-1 relative group overflow-hidden cursor-pointer rounded-2xl md:rounded-none">
                            <img src={heroImages[3] || heroImages[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="flex-1 relative group overflow-hidden cursor-pointer rounded-2xl md:rounded-none">
                            <img src={heroImages[4] || heroImages[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-colors group-hover:bg-black/40">
                                <span className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all flex items-center gap-2">
                                    <Plus size={16} /> View all photos
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* STICKY SUB-NAV */}
                <div className={`sticky top-[73px] z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-y border-white/10 mb-8 transition-all ${isScrolled ? 'py-2 shadow-2xl shadow-black' : 'py-4'}`}>
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {['About', 'Know Before You Go', 'Select Room', 'Amenities', 'Location', 'Contact', 'Policies', 'Reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => scrollToSection(tab.toLowerCase().replace(/ /g, '-'))}
                                className={`text-sm font-bold whitespace-nowrap transition-colors px-2 py-1 relative ${activeSection === tab.toLowerCase().replace(/ /g, '-')
                                    ? 'text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab}
                                {activeSection === tab.toLowerCase().replace(/ /g, '-') && (
                                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-500 rounded-full layout-id-underline"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TWO COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative items-start">
                    {/* LEFT CONTENT COLUMN */}
                    <div className="lg:col-span-2 space-y-12">


                        {/* About Section */}
                        <section id="about" className="space-y-4">
                            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                                <Sparkles className="text-orange-500" size={20} />
                                About
                            </h2>
                            <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
                                {isAboutExpanded ? hotel.description : (hotel.description?.slice(0, 300) + (hotel.description?.length > 300 ? '...' : ''))}
                                {hotel.description?.length > 300 && (
                                    <button
                                        onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                                        className="ml-2 text-orange-500 hover:text-orange-400 text-sm font-bold underline"
                                    >
                                        {isAboutExpanded ? "View Less" : "View More"}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {hotel.highlights?.map((highlight, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300">
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <hr className="border-white/10" />

                        {/* Know Before You Go Section */}
                        <section id="know-before-you-go">
                            <h2 className="text-2xl font-bold font-display mb-6">Know Before You Go</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {hotel.goodToKnow && hotel.goodToKnow.map((item, idx) => {
                                    const isString = typeof item === 'string';
                                    const label = isString ? 'Info' : item.label;
                                    const value = isString ? item : item.value;
                                    const iconName = isString ? 'Info' : item.icon;

                                    const IconComponent = {
                                        'Ban': Ban,
                                        'Clock': Clock,
                                        'Beer': Beer,
                                        'Utensils': Utensils,
                                        'Info': Info
                                    }[iconName] || Info;

                                    return (
                                        <div key={idx} className='flex items-start gap-4'>
                                            <div className='bg-white/5 p-2 rounded-lg text-orange-500'>
                                                <IconComponent size={20} />
                                            </div>
                                            <div>
                                                <p className='text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1'>{label}</p>
                                                <p className='text-sm text-zinc-200 font-medium'>{value}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

                        <hr className="border-white/10" />

                        {/* Room Types Section */}
                        <section id="select-room">
                            <h2 className="text-2xl font-bold font-display mb-6">Select Room</h2>
                            <div className="space-y-6">
                                {hotel.rooms?.map((room) => (
                                    <RoomCard key={room.id} room={room} hotelImage={hotel.image} />
                                ))}
                            </div>
                        </section>

                        <hr className="border-white/10" />

                        {/* Amenities Section */}
                        <section id="amenities">
                            <h2 className="text-2xl font-bold font-display mb-6">Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {hotel.amenities?.map((amenity, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group">
                                        <div className="p-2 bg-black/40 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300">{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <hr className="border-white/10" />

                        {/* Location Section */}
                        <section id="location">
                            <h2 className="text-2xl font-bold font-display mb-6">Location</h2>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 h-80 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
                                    <MapPin size={48} className="text-zinc-600 mb-2" />
                                </div>
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    {hotel.googleMapsUrl ? (
                                        <a
                                            href={hotel.googleMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white text-black px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                        >
                                            <MapPin size={18} /> View location on Maps
                                        </a>
                                    ) : (
                                        <span className="text-zinc-400 text-sm">Map unavailable</span>
                                    )}
                                </div>
                            </div>
                            <p className="mt-4 text-zinc-400 text-sm">
                                Located in the peaceful area of {hotel.location?.split(',')[0]}, close to major attractions yet away from the noise.
                            </p>
                        </section>

                        <hr className="border-white/10" />

                        {/* Contact Section */}
                        <section id="contact">
                            <h2 className="text-2xl font-bold font-display mb-6">Contact</h2>
                            <div className="flex flex-wrap gap-4">
                                {hotel.contact?.phone && (
                                    <a href={`tel:${hotel.contact.phone}`} className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                        <Phone size={20} className="text-green-500" />
                                        <span className="font-medium text-white">Call Property</span>
                                    </a>
                                )}
                                {hotel.contact?.whatsapp && (
                                    <a href={`https://wa.me/${hotel.contact.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                        <MessageCircle size={20} className="text-green-500" />
                                        <span className="font-medium text-white">WhatsApp</span>
                                    </a>
                                )}
                                {hotel.contact?.email && (
                                    <a href={`mailto:${hotel.contact.email}`} className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                        <Mail size={20} className="text-blue-500" />
                                        <span className="font-medium text-white">Email</span>
                                    </a>
                                )}
                            </div>
                        </section>

                        <hr className="border-white/10" />

                        {/* Policies Section */}
                        <section id="policies">
                            <div id="cancellation-policy" className="mb-8">
                                <h2 className="text-2xl font-bold font-display mb-4 flex items-center justify-between cursor-pointer group">
                                    Cancellation Policy
                                    <ChevronDown className="text-zinc-500 group-hover:text-white transition-colors" />
                                </h2>
                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                                    <p className="text-white font-medium mb-3">
                                        {hotel.cancellationPolicy?.split('.')[0]}.
                                    </p>
                                    <p className="text-sm text-zinc-400">
                                        {hotel.cancellationPolicy}
                                    </p>
                                </div>
                            </div>

                            <div id="property-policy">
                                <h2 className="text-2xl font-bold font-display mb-4 flex items-center justify-between cursor-pointer group">
                                    Property Policy
                                    <ChevronDown className="text-zinc-500 group-hover:text-white transition-colors" />
                                </h2>
                                <div className="text-zinc-400 text-sm leading-relaxed space-y-2">
                                    <p>{hotel.propertyPolicy || "Standard property policies apply."}</p>
                                    <p>{hotel.policies?.child}</p>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* RIGHT COLUMN - STICKY BOOKING SIDEBAR */}
                    <div className="hidden lg:block">
                        <div className="sticky top-28 bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black ring-1 ring-white/5">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-sm text-zinc-400 line-through">₹{parseInt(avgNightlyPrice * 1.2).toLocaleString()}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-white">₹{parseInt(avgNightlyPrice).toLocaleString()}</span>
                                        <span className="text-sm text-zinc-500">/ night</span>
                                    </div>
                                    <div className="text-[10px] text-green-400 mt-1 uppercase font-bold tracking-wider">
                                        {nights} {nights === 1 ? 'Night' : 'Nights'} Selection
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-1 rounded-md text-xs font-bold border border-green-500/20">
                                        <Star size={12} fill="currentColor" /> {hotel.rating}
                                    </div>
                                    <span className="text-xs text-zinc-500 mt-1">128 reviews</span>
                                </div>
                            </div>

                            {/* Booking Inputs */}
                            <div className="border border-zinc-700 rounded-xl overflow-hidden mb-4">
                                <div className="grid grid-cols-2 border-b border-zinc-700">
                                    <div className="p-3 border-r border-zinc-700 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group relative">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Check-In</label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                            className="w-full bg-transparent text-sm font-medium text-white focus:outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                        {/* Fallback Display if needed or just use input styling */}
                                    </div>
                                    <div className="p-3 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group relative">
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Check-Out</label>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            options={{ min: checkIn }}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                            className="w-full bg-transparent text-sm font-medium text-white focus:outline-none appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex justify-between items-center">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Guests</label>
                                        <select
                                            value={guests}
                                            onChange={(e) => setGuests(parseInt(e.target.value))}
                                            className="bg-transparent text-sm font-medium text-white focus:outline-none"
                                        >
                                            <option value={1} className="bg-zinc-900">1 Guest</option>
                                            <option value={2} className="bg-zinc-900">2 Guests</option>
                                            <option value={3} className="bg-zinc-900">3 Guests</option>
                                            <option value={4} className="bg-zinc-900">4 Guests</option>
                                        </select>
                                    </div>
                                    <ChevronDown size={16} className="text-zinc-500" />
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-3 mb-6">
                                <button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-95">
                                    Check Availability
                                </button>
                                <p className="text-center text-xs text-zinc-500">You won't be charged yet</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-300">
                                <div className="flex justify-between">
                                    <span className="underline decoration-zinc-600">₹{parseInt(avgNightlyPrice).toLocaleString()} x {nights} night{nights > 1 ? 's' : ''}</span>
                                    <span>₹{parseInt(totalStayPrice).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="underline decoration-zinc-600">Cleaning fee</span>
                                    <span>₹850</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="underline decoration-zinc-600">Service fee</span>
                                    <span>₹450</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10 font-bold text-white text-lg">
                                <span>Total before taxes</span>
                                <span>₹{(parseInt(totalStayPrice) + 1300).toLocaleString()}</span>
                            </div>

                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                            <ShieldCheck size={14} />
                            <span>Secure transaction</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Dummy Theme Toggle Component for now */}
            <div className="hidden">
                <ThemeToggle />
            </div>

            {/* RECOMMENDATIONS (Keep existing logic) */}
            <div className="container mx-auto px-4 max-w-7xl mt-20 pt-12 border-t border-white/5">
                <h3 className="text-2xl font-bold font-display mb-8">More places to stay</h3>
                {hotel && (
                    <RecommendationEngine
                        currentId={hotel.id}
                        type="hotel"
                        location={hotel.location}
                        budget={Number(hotel.price)}
                        tags={hotel.highlights}
                    />
                )}
            </div>

        </div >
    );

};

const PolicyCard = ({ title, items, icon }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4 font-bold text-white">
                {icon} <h3>{title}</h3>
            </div>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Icon Helper
const Briefcase = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

const ThemeToggle = () => <div className="w-6 h-6 rounded-full bg-white/10 cursor-pointer"></div>;

const btnIconLabelStyle = "flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-slate-300";

export default HotelDetail;
