import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, Shield, Users, Database, Server, Smartphone, Layout, ChevronRight,
    X, ExternalLink, MapPin, Calendar, Package, CreditCard, Hotel, Car,
    PenTool, Image, TrendingUp, BarChart3, Compass, BookOpen, Home,
    Lock, Unlock, FileText, Settings, UserCheck, Layers, ArrowRight,
    Monitor, Cloud, HardDrive, Zap, Search, Heart
} from 'lucide-react';

// ===== COMPLETE SITE DATA =====
const SITE_DATA = {
    architecture: {
        id: 'architecture',
        label: 'System Architecture',
        icon: Server,
        color: 'from-blue-500 to-cyan-500',
        description: 'How the entire platform is built and connected',
        details: 'React 18 SPA built with Vite, hosted on Hostinger (GitHub auto-deploy). All data stored in Firebase (Firestore + Auth + Storage). Apache .htaccess handles SPA routing.',
        nodes: [
            { id: 'frontend', label: 'Frontend', tech: 'React 18 + Vite', icon: Monitor, desc: 'Single Page Application with client-side routing via React Router v6. Uses Framer Motion for animations, Lucide for icons.' },
            { id: 'hosting', label: 'Hosting', tech: 'Hostinger', icon: Globe, desc: 'Static hosting with 50GB space. Auto-deploys from GitHub main branch. Apache .htaccess redirects all routes to index.html for SPA.' },
            { id: 'database', label: 'Database', tech: 'Firebase Firestore', icon: Database, desc: 'NoSQL cloud database. Stores all bookings, users, hotels, packages, transport data. Real-time listeners for live updates.' },
            { id: 'auth', label: 'Authentication', tech: 'Firebase Auth', icon: Lock, desc: 'Email/password + Google Sign-In. Role-based access control (Admin, Ops, Finance, Partner). Protected routes enforce login.' },
            { id: 'storage', label: 'File Storage', tech: 'Firebase Storage', icon: HardDrive, desc: 'Stores uploaded ID documents (Aadhaar, PAN, Passport), hotel images, and media library assets.' },
            { id: 'github', label: 'Version Control', tech: 'GitHub', icon: Cloud, desc: 'Source code stored at thisisparthchauhan/infiniteyatra. Push to main → auto-deploy to Hostinger.' },
        ]
    },
    publicPages: {
        id: 'publicPages',
        label: 'Public Pages',
        icon: Globe,
        color: 'from-emerald-500 to-green-500',
        description: 'Pages accessible without login',
        details: 'All public-facing pages visible to every visitor. No authentication required. Includes main navigation, content pages, and partner onboarding.',
        nodes: [
            { id: 'home', label: 'Home', route: '/', icon: Home, desc: 'Landing page with hero banner, featured packages, testimonials, transport section, stats. Homepage content managed from Admin > Homepage Manager.' },
            { id: 'destinations', label: 'Destinations', route: '/destinations', icon: MapPin, desc: 'Browse all tour packages with filters (location, price, duration). Packages loaded from Firestore "packages" collection + hardcoded data file.' },
            { id: 'packageDetail', label: 'Package Detail', route: '/package/:id', icon: Package, desc: 'Full package info: itinerary, inclusions, gallery, pricing. "Book Now" → redirects to /booking/:id (login required). "Send Enquiry" and "WhatsApp Us" alternatives.' },
            { id: 'hotels', label: 'Hotels', route: '/hotels', icon: Hotel, desc: 'Browse all partner hotels. Data from Firestore "hotels" collection. Shows name, location, star rating, starting price.' },
            { id: 'hotelDetail', label: 'Hotel Detail', route: '/hotels/:id', icon: Hotel, desc: 'Room types, amenities, policies, reviews, pricing. "Book Now" starts hotel booking flow.' },
            { id: 'transport', label: 'Transport', route: '/transport', icon: Car, desc: 'Vehicle rental landing. Browse available vehicles by city. Data from "transport_vehicles" and "transport_cities" collections.' },
            { id: 'transportSearch', label: 'Transport Search', route: '/transport/search', icon: Search, desc: 'Filter vehicles by city, date, vehicle type. Displays pricing per km and per day.' },
            { id: 'blog', label: 'Blog', route: '/blog', icon: BookOpen, desc: 'Travel articles and guides. Admin-created content from "blogs" collection.' },
            { id: 'blogPost', label: 'Blog Post', route: '/blog/:id', icon: FileText, desc: 'Individual blog article with rich content, images, and share buttons.' },
            { id: 'stories', label: 'Stories', route: '/stories', icon: PenTool, desc: 'Community travel stories written by users. Anyone logged in can create stories. Admin can edit/delete any story.' },
            { id: 'storyDetail', label: 'Story Detail', route: '/story/:id', icon: FileText, desc: 'Individual travel story with comments and reactions.' },
            { id: 'contact', label: 'Contact Us', route: '/contact', icon: Smartphone, desc: 'Contact form, WhatsApp link (+91 9265799325), email (info@infiniiteyatra.com), office address, embedded map.' },
            { id: 'careers', label: 'Careers', route: '/careers', icon: Users, desc: 'Job listings with "Apply Now" buttons that open mailto: links. "Send your resume" section at bottom.' },
            { id: 'tripPlanner', label: 'AI Trip Planner', route: '/trip-planner', icon: Compass, desc: 'AI-powered itinerary generator using Google Gemini API. Users describe preferences → get custom trip plan.' },
            { id: 'wishlist', label: 'Wishlist', route: '/wishlist', icon: Heart, desc: 'Saved/favorited packages. Uses WishlistContext (localStorage-based). No login required to save.' },
            { id: 'terms', label: 'Terms & Conditions', route: '/terms', icon: FileText, desc: 'Legal terms, privacy policy, refund policy.' },
            { id: 'qrLanding', label: 'QR Connect', route: '/connect', icon: Zap, desc: 'Special landing page for QR codes. Shows all social links, contact info, quick actions. No navbar/footer — standalone page.' },
            { id: 'partnerOnboard', label: 'Hotel Partner Onboarding', route: '/partner/hotel-onboarding', icon: Hotel, desc: 'Form for hotel partners to register their property. Submits to Firestore for admin review.' },
            { id: 'login', label: 'Login', route: '/login', icon: Lock, desc: 'Email/password login + Google Sign-In. Redirects to dashboard after successful login.' },
            { id: 'signup', label: 'Sign Up', route: '/signup', icon: UserCheck, desc: 'Create new account with email + password. Auto-creates user profile in Firestore "users" collection.' },
        ]
    },
    protectedPages: {
        id: 'protectedPages',
        label: 'Protected Pages',
        icon: Lock,
        color: 'from-amber-500 to-orange-500',
        description: 'Pages requiring user login',
        details: 'These pages are wrapped with <ProtectedRoute> — if not logged in, user gets redirected to /login. After login, they return to the originally requested page.',
        nodes: [
            { id: 'dashboard', label: 'User Dashboard', route: '/dashboard', icon: Layout, desc: 'Welcome page with user\'s name, quick navigation to bookings, trips, profile.' },
            { id: 'profile', label: 'Profile', route: '/profile', icon: Users, desc: 'Edit display name, phone, profile picture. View account details.' },
            { id: 'bookingPage', label: 'Booking Page', route: '/booking/:id', icon: CreditCard, desc: '3-step booking: Step 1 (Date, travelers, lead contact, bundle hotel) → Step 2 (Traveler details: name, DOB, gender, nationality, contacts, ID docs upload, emergency contacts) → Step 3 (Review & confirm with price breakdown). Saves to "bookings" collection.' },
            { id: 'bookingSuccess', label: 'Booking Success', route: '/booking-success', icon: FileText, desc: 'Confirmation page with booking ID, package name, amount, date. Auto-generates PDF invoice. WhatsApp & email confirmation links.' },
            { id: 'myBookings', label: 'My Bookings', route: '/my-bookings', icon: Calendar, desc: 'All user\'s tour bookings from Firestore. Shows status (confirmed/pending), price, date, "View Package" link.' },
            { id: 'myTrips', label: 'My Trips', route: '/my-trips', icon: Compass, desc: 'Planned/saved trip itineraries from AI Trip Planner.' },
            { id: 'tripDetail', label: 'Trip Details', route: '/trip/:tripId', icon: MapPin, desc: 'Individual trip itinerary with day-by-day plan.' },
            { id: 'hotelBooking', label: 'Hotel Booking', route: '/hotels/book/:id', icon: Hotel, desc: 'Hotel room booking form with date selection, guest details, pricing.' },
            { id: 'hotelSuccess', label: 'Hotel Booking Success', route: '/hotels/success', icon: FileText, desc: 'Hotel reservation confirmation with booking reference.' },
            { id: 'transportBook', label: 'Transport Booking', route: '/transport/book/:id', icon: Car, desc: 'Vehicle rental booking with pickup/drop details, pricing calculator.' },
            { id: 'myTransport', label: 'My Transport Bookings', route: '/profile/transport-bookings', icon: Car, desc: 'User\'s vehicle rental history and active bookings.' },
        ]
    },
    adminPanel: {
        id: 'adminPanel',
        label: 'Admin Panel',
        icon: Shield,
        color: 'from-purple-500 to-pink-500',
        description: 'Role-restricted admin dashboard (/admin)',
        details: 'Single-page admin panel at /admin with sidebar navigation. Access controlled by RoleRoute — only admin, ops, finance roles allowed. RBAC (Role-Based Access Control) uses workspace model from roles.js config.',
        nodes: [
            { id: 'adminOverview', label: 'Snapshot', tab: 'overview', icon: BarChart3, desc: 'KPI cards: Total Revenue, Bookings Today, Active Packages, Total Users. Quick links to other sections. Transport revenue + booking cards.' },
            { id: 'adminBookings', label: 'Tour Bookings', tab: 'bookings', icon: Calendar, desc: 'All tour bookings with status management (confirm, cancel, refund). Search, filter by date/status. View full booking details.' },
            { id: 'adminPackages', label: 'Package Inventory', tab: 'packages', icon: Package, desc: 'Create, edit, delete tour packages. Set pricing, itinerary, images, inclusions/exclusions. Publish/unpublish control.' },
            { id: 'adminOps', label: 'Operations', tab: 'operations', icon: Compass, desc: 'Trip dispatch center. Assign drivers, manage pickup logistics, track trip status. Operational workflow management.' },
            { id: 'adminFinance', label: 'Financials (Tours)', tab: 'finance', icon: TrendingUp, desc: 'Revenue tracking, expenses, P&L analysis for tour operations. Commission calculations.' },
            { id: 'adminCRM', label: 'Tour Clients', tab: 'crm', icon: Users, desc: 'Customer profiles, booking history, communication log. View all client interactions.' },
            { id: 'adminHomepage', label: 'Homepage Manager', tab: 'homepage', icon: Home, desc: 'Edit hero section content, featured packages, testimonials. Control what appears on the homepage.' },
            { id: 'adminContent', label: 'Blog & Stories', tab: 'stories', icon: PenTool, desc: 'Create/edit blog posts. Moderate user stories. Manage content calendar.' },
            { id: 'adminExperiences', label: 'Experiences', tab: 'experiences', icon: BookOpen, desc: 'Curate special travel experiences. Rich content editing.' },
            { id: 'adminMedia', label: 'Media Library', tab: 'media', icon: Image, desc: 'Upload, organize, and manage all images used across the site. Cloud-stored in Firebase Storage.' },
            { id: 'adminInfluencer', label: 'Influencer ROI', tab: 'influencers', icon: TrendingUp, desc: 'Track influencer campaigns, measure ROI, manage partnerships and payout tracking.' },
            { id: 'adminAnalytics', label: 'Live Dashboard', tab: 'analytics', icon: BarChart3, desc: 'Real-time command center. Live visitor count, conversion tracking, revenue graphs, heat maps.' },
            { id: 'adminStaff', label: 'Staff & Roles', tab: 'staff', icon: Settings, desc: 'Invite team members, assign roles (Tour Manager, Finance Manager, Content Manager, etc.). RBAC control.' },
            { id: 'adminHotels', label: 'Hotel Manager', tab: 'hotels', icon: Hotel, desc: 'Add/edit hotel properties, manage rooms, amenities, images, pricing. Partner hotel onboarding review.' },
            { id: 'adminHotelBookings', label: 'Hotel Bookings', tab: 'hotel-bookings', icon: Calendar, desc: 'All hotel reservations. Manage check-in/out status, cancellations.' },
            { id: 'adminHotelFinance', label: 'Hotel Financials', tab: 'hotel-finance', icon: CreditCard, desc: 'Hotel revenue breakdown. Commission split (IY 15% / Hotel 85%). Payout management.' },
            { id: 'adminTransOverview', label: 'Transport Overview', tab: 'transport-overview', icon: Car, desc: 'Transport KPIs: Revenue, Bookings, Active Vehicles, Top Cities.' },
            { id: 'adminTransVehicles', label: 'Manage Vehicles', tab: 'transport-vehicles', icon: Car, desc: 'Add/edit vehicles: name, type, capacity, pricing (per km/day), availability, images.' },
            { id: 'adminTransCities', label: 'Manage Cities', tab: 'transport-cities', icon: MapPin, desc: 'Configure service areas — which cities/routes are available for transport.' },
            { id: 'adminTransBookings', label: 'Transport Bookings', tab: 'transport-bookings', icon: Calendar, desc: 'All vehicle rental reservations. Status tracking, driver assignment.' },
            { id: 'adminTransSettings', label: 'Transport Settings', tab: 'transport-settings', icon: Settings, desc: 'Global transport config: base pricing formulas, GST settings, cancellation policy.' },
        ]
    },
    dataFlow: {
        id: 'dataFlow',
        label: 'Data & Storage',
        icon: Database,
        color: 'from-red-500 to-rose-500',
        description: 'Firestore collections and what they store',
        details: 'All data stored in Firebase Firestore (NoSQL). Each collection maps to a feature. Documents uploaded to Firebase Storage. Authentication managed by Firebase Auth.',
        nodes: [
            { id: 'colBookings', label: 'bookings', icon: Calendar, desc: 'Tour package bookings. Fields: userId, packageId, packageTitle, bookingDate, travelers, contactName/Email/Phone, travelersList (detailed), totalPrice, status, paymentStatus, specialRequests, bundledHotelId.' },
            { id: 'colBookingDocs', label: 'bookings/{id}/documents', icon: FileText, desc: 'Sub-collection: Uploaded ID documents for each booking. Stores download URLs from Firebase Storage.' },
            { id: 'colHotelBookings', label: 'hotel_bookings', icon: Hotel, desc: 'Hotel reservations. Fields: hotelId, hotelName, roomId, userId, checkIn, checkOut, totalAmount, paymentStatus, bookingStatus.' },
            { id: 'colHotelFinance', label: 'hotel_finance', icon: CreditCard, desc: 'Financial records for hotel bookings. Fields: bookingId, hotelId, grossAmount, iyCommission (15%), hotelPayout (85%).' },
            { id: 'colHotels', label: 'hotels', icon: Hotel, desc: 'Hotel listings. Fields: name, location, image, rooms (array of {name, price, amenities}), starRating, description.' },
            { id: 'colPackages', label: 'packages', icon: Package, desc: 'Tour packages. Fields: title, location, price, duration, image, itinerary, inclusions, exclusions, highlights.' },
            { id: 'colTransVehicles', label: 'transport_vehicles', icon: Car, desc: 'Vehicle fleet. Fields: name, type, city, pricePerKm, pricePerDay, capacity, images, available.' },
            { id: 'colTransBookings', label: 'transport_bookings', icon: Calendar, desc: 'Vehicle rental bookings. Fields: vehicleId, userId, pickupDate, dropDate, totalAmount, status.' },
            { id: 'colTransCities', label: 'transport_cities', icon: MapPin, desc: 'Service areas for transport. Fields: cityName, state, active.' },
            { id: 'colUsers', label: 'users', icon: Users, desc: 'User profiles. Fields: uid, email, displayName, phone, role, createdAt. Created on signup.' },
            { id: 'colStories', label: 'stories', icon: PenTool, desc: 'Community travel stories. Fields: title, content, authorId, authorName, likes, createdAt.' },
            { id: 'colEnquiries', label: 'enquiries', icon: Smartphone, desc: 'Contact form submissions. Fields: name, email, phone, message, createdAt.' },
        ]
    },
    globalComponents: {
        id: 'globalComponents',
        label: 'Global Components',
        icon: Layers,
        color: 'from-indigo-500 to-violet-500',
        description: 'Components present on every page',
        details: 'Layout wrapper renders Navbar, Footer, EnquiryPopup, WhatsApp button, and MaintenanceBanner on all public pages. Admin pages (/admin) and QR page (/connect) skip these.',
        nodes: [
            { id: 'navbar', label: 'Navbar', icon: Layout, desc: 'Mega-menu navigation: Home, Destinations, Hotels, Transport, AI Trip Planner, Stories, About Us, Contact. User profile dropdown when logged in. "Live" badges on active pages.' },
            { id: 'footer', label: 'Footer', icon: Layout, desc: 'Company info, quick links (Destinations, Hotels, Blog, Contact, Careers), contact details (phone, email), social media links (Instagram, YouTube, WhatsApp).' },
            { id: 'whatsappBtn', label: 'WhatsApp Button', icon: Smartphone, desc: 'Green floating button (bottom-right). Opens WhatsApp chat with +91 9265799325. "Chat with us" tooltip on hover. Pulse animation.' },
            { id: 'enquiryPopup', label: 'Enquiry Popup', icon: FileText, desc: 'Slide-in popup for quick enquiries. Name, phone, message fields. Submits to Firestore "enquiries" collection.' },
            { id: 'maintenanceBanner', label: 'Maintenance Banner', icon: Settings, desc: '"Under Active Development" dismissible banner at bottom of all public pages. Hidden on admin.' },
            { id: 'scrollToTop', label: 'Scroll To Top', icon: ArrowRight, desc: 'Auto-scrolls to top on every route change. Ensures clean page transitions.' },
            { id: 'seo', label: 'SEO Component', icon: Search, desc: 'React Helmet for dynamic <title> and <meta> tags on every page. Proper Open Graph tags for social sharing.' },
        ]
    }
};

const CATEGORY_ORDER = ['architecture', 'publicPages', 'protectedPages', 'adminPanel', 'dataFlow', 'globalComponents'];

// ===== DETAIL PANEL =====
const DetailPanel = ({ node, category, onClose }) => {
    if (!node) return null;
    const cat = SITE_DATA[category];
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-[#0d0d0d] border-l border-white/10 z-50 overflow-y-auto shadow-2xl"
        >
            <div className="p-6 md:p-8">
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="mb-6 pb-6 border-b border-white/10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 shadow-lg`}>
                        {React.createElement(node.icon, { size: 24, className: 'text-white' })}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{node.label}</h2>
                    {node.route && (
                        <div className="flex items-center gap-2 mt-2">
                            <code className="text-sm bg-white/5 text-blue-400 px-3 py-1 rounded-lg border border-white/10 font-mono">{node.route}</code>
                            {node.route.startsWith('/') && (
                                <a href={`http://localhost:5173${node.route.replace(':id', 'demo').replace(':tripId', 'demo')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                                    <ExternalLink size={12} /> Open
                                </a>
                            )}
                        </div>
                    )}
                    {node.tab && <p className="text-xs text-slate-500 mt-2">Admin Tab: <code className="text-purple-400">{node.tab}</code></p>}
                    {node.tech && <p className="text-sm text-slate-400 mt-2 font-medium">{node.tech}</p>}
                </div>

                {/* Description */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">How It Works</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{node.desc}</p>
                    </div>

                    {/* Category Info */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Part of</p>
                        <p className="text-sm font-medium text-white">{cat.label}</p>
                        <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                    </div>

                    {/* Access Level */}
                    {category === 'protectedPages' && (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                            <Lock size={16} className="text-amber-400" />
                            <p className="text-xs text-amber-300">Requires user login (ProtectedRoute)</p>
                        </div>
                    )}
                    {category === 'adminPanel' && (
                        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                            <Shield size={16} className="text-purple-400" />
                            <p className="text-xs text-purple-300">Admin only (RoleRoute: admin, ops, finance)</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ===== MAIN COMPONENT =====
const AdminSitemap = () => {
    const [activeCategory, setActiveCategory] = useState('architecture');
    const [selectedNode, setSelectedNode] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const currentCategory = SITE_DATA[activeCategory];

    const filteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return currentCategory.nodes;
        const q = searchQuery.toLowerCase();
        return currentCategory.nodes.filter(n =>
            n.label.toLowerCase().includes(q) ||
            n.desc.toLowerCase().includes(q) ||
            (n.route && n.route.toLowerCase().includes(q)) ||
            (n.tab && n.tab.toLowerCase().includes(q))
        );
    }, [searchQuery, activeCategory, currentCategory]);

    // Stats
    const totalPages = SITE_DATA.publicPages.nodes.length + SITE_DATA.protectedPages.nodes.length;
    const totalAdminTabs = SITE_DATA.adminPanel.nodes.length;
    const totalCollections = SITE_DATA.dataFlow.nodes.length;

    return (
        <div className="space-y-8 relative">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Site Architecture Map</h1>
                <p className="text-slate-400 text-sm">Interactive blueprint of the entire Infinite Yatra platform. Click any node for full details.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Pages', value: totalPages, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Admin Modules', value: totalAdminTabs, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                    { label: 'DB Collections', value: totalCollections, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                    { label: 'Components', value: SITE_DATA.globalComponents.nodes.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                ].map((s, i) => (
                    <div key={i} className={`${s.bg} border rounded-xl p-4 text-center`}>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                {CATEGORY_ORDER.map(key => {
                    const cat = SITE_DATA[key];
                    const Icon = cat.icon;
                    const isActive = activeCategory === key;
                    return (
                        <button
                            key={key}
                            onClick={() => { setActiveCategory(key); setSearchQuery(''); setSelectedNode(null); }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={14} />
                            <span className="hidden sm:inline">{cat.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${currentCategory.label}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
            </div>

            {/* Category Header */}
            <div className={`bg-gradient-to-r ${currentCategory.color} p-[1px] rounded-2xl`}>
                <div className="bg-[#0a0a0a] rounded-2xl p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentCategory.color} flex items-center justify-center shrink-0`}>
                        {React.createElement(currentCategory.icon, { size: 22, className: 'text-white' })}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{currentCategory.label}</h2>
                        <p className="text-sm text-slate-400 mt-1">{currentCategory.details}</p>
                        <p className="text-xs text-slate-600 mt-2">{filteredNodes.length} items</p>
                    </div>
                </div>
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredNodes.map((node, idx) => {
                    const Icon = node.icon;
                    return (
                        <motion.button
                            key={node.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => setSelectedNode(node)}
                            className="text-left group bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] rounded-xl p-4 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${currentCategory.color} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${currentCategory.color} bg-opacity-20 flex items-center justify-center`}>
                                        <Icon size={16} className="text-white" />
                                    </div>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors mt-1" />
                                </div>
                                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{node.label}</h3>
                                {node.route && <p className="text-[10px] font-mono text-slate-500 mt-0.5">{node.route}</p>}
                                {node.tab && <p className="text-[10px] text-purple-400 mt-0.5">tab: {node.tab}</p>}
                                {node.tech && <p className="text-[10px] text-cyan-400 mt-0.5">{node.tech}</p>}
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{node.desc}</p>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {filteredNodes.length === 0 && (
                <div className="text-center py-12">
                    <Search size={40} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">No results for "{searchQuery}"</p>
                </div>
            )}

            {/* Connection Map — Visual flowchart */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mt-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">User Journey Flow</h3>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                    {[
                        { label: 'Visit Site', color: 'bg-blue-500', icon: Globe },
                        { label: 'Browse Destinations', color: 'bg-emerald-500', icon: MapPin },
                        { label: 'View Package', color: 'bg-green-500', icon: Package },
                        { label: 'Login/Signup', color: 'bg-amber-500', icon: Lock },
                        { label: 'Book Package', color: 'bg-orange-500', icon: CreditCard },
                        { label: 'Add Travelers', color: 'bg-pink-500', icon: Users },
                        { label: 'Review & Pay', color: 'bg-red-500', icon: FileText },
                        { label: 'Success!', color: 'bg-purple-500', icon: Zap },
                    ].map((step, i, arr) => (
                        <React.Fragment key={i}>
                            <div className={`${step.color} text-white px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium shadow-lg`}>
                                {React.createElement(step.icon, { size: 12 })}
                                {step.label}
                            </div>
                            {i < arr.length - 1 && <ArrowRight size={14} className="text-slate-600" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 text-xs mt-6 pt-4 border-t border-white/5">
                    <span className="text-slate-600 mr-2">Alt flows:</span>
                    {[
                        { label: 'Hotels', color: 'bg-cyan-600', icon: Hotel },
                        { label: 'Transport', color: 'bg-teal-600', icon: Car },
                        { label: 'AI Planner', color: 'bg-violet-600', icon: Compass },
                        { label: 'Stories', color: 'bg-indigo-600', icon: PenTool },
                    ].map((flow, i) => (
                        <div key={i} className={`${flow.color} text-white px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium shadow-lg`}>
                            {React.createElement(flow.icon, { size: 12 })}
                            {flow.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Panel Overlay */}
            <AnimatePresence>
                {selectedNode && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setSelectedNode(null)}
                        />
                        <DetailPanel
                            node={selectedNode}
                            category={activeCategory}
                            onClose={() => setSelectedNode(null)}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSitemap;
