import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Globe, Users, Phone, Mail, MessageCircle,
    Shield, Layout, Package, CreditCard, TrendingUp,
    Map, BookOpen, Car, Anchor, Bike, Rocket, ChevronRight,
    CheckCircle, AlertCircle, Star, Zap, Target, Compass,
    ArrowRight, ExternalLink, Home, LogIn
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

const sections = [
    {
        id: 'overview',
        title: 'Company Overview',
        icon: Building2,
        color: 'from-blue-600 to-blue-400'
    },
    {
        id: 'structure',
        title: 'Platform Structure',
        icon: Layout,
        color: 'from-purple-600 to-purple-400'
    },
    {
        id: 'verticals',
        title: 'Business Verticals',
        icon: Package,
        color: 'from-emerald-600 to-emerald-400'
    },
    {
        id: 'admin',
        title: 'Admin Dashboard Guide',
        icon: Shield,
        color: 'from-orange-600 to-orange-400'
    },
    {
        id: 'leads',
        title: 'Lead Management',
        icon: Target,
        color: 'from-yellow-600 to-yellow-400'
    },
    {
        id: 'workflow',
        title: 'Daily Workflow',
        icon: Compass,
        color: 'from-cyan-600 to-cyan-400'
    },
    {
        id: 'tech',
        title: 'Tech Stack',
        icon: Zap,
        color: 'from-pink-600 to-pink-400'
    },
    {
        id: 'vision',
        title: 'Future Vision',
        icon: Rocket,
        color: 'from-indigo-600 to-indigo-400'
    }
];

const TeamGuide = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <OverviewSection />;
            case 'structure':
                return <StructureSection />;
            case 'verticals':
                return <VerticalsSection />;
            case 'admin':
                return <AdminSection />;
            case 'leads':
                return <LeadsSection />;
            case 'workflow':
                return <WorkflowSection />;
            case 'tech':
                return <TechSection />;
            case 'vision':
                return <VisionSection />;
            default:
                return <OverviewSection />;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <SEO title="Team Guide - Infinite Yatra" description="Internal team onboarding guide" />

            {/* Header */}
            <div className="border-b border-white/10 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">INTERNAL</span>
                                <span className="text-xs text-slate-500">Last updated: March 2026</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Team Onboarding Guide
                            </h1>
                            <p className="text-slate-400 mt-2 max-w-xl">
                                Everything a new team member needs to understand about Infinite Yatra's platform, operations, and vision.
                            </p>
                        </div>
                        <div className="hidden md:flex gap-3">
                            <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">
                                <Home size={16} /> Website
                            </Link>
                            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm text-white hover:bg-blue-500 transition-colors">
                                <Shield size={16} /> Admin Panel
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Mobile Navigation */}
                <div className="lg:hidden mb-6 overflow-x-auto pb-2">
                    <div className="flex gap-2">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${activeSection === section.id
                                        ? 'bg-white/10 text-white border border-white/10'
                                        : 'text-slate-400 bg-white/5'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {section.title}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Navigation (desktop only) */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-8 space-y-2">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${isActive
                                            ? 'bg-white/10 text-white border border-white/10'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center shrink-0`}>
                                            <Icon size={16} className="text-white" />
                                        </div>
                                        <span className="text-sm font-medium">{section.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderSection()}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Section Components ---

const Card = ({ children, className = '' }) => (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, color = 'from-blue-600 to-blue-400' }) => (
    <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
        {subtitle && <p className="text-slate-400 mt-2 ml-13">{subtitle}</p>}
    </div>
);

const OverviewSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Building2} title="Company Overview" subtitle="What is Infinite Yatra and what are we building?" />

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">About Infinite Yatra</h3>
            <div className="space-y-3 text-sm text-slate-300">
                <p><strong className="text-white">Company:</strong> Infinite Yatra ("Explore Infinite")</p>
                <p><strong className="text-white">What we do:</strong> Travel platform offering trekking tours, hotel bookings, transportation, and travel experiences across India.</p>
                <p><strong className="text-white">Current Focus:</strong> Spiritual and adventure trekking (Kedarnath, Char Dham, Kedarkantha, etc.)</p>
                <p><strong className="text-white">Website:</strong> <a href="https://www.infiniteyatra.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">www.infiniteyatra.com</a></p>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Phone size={20} className="text-green-400" />
                    <div>
                        <p className="text-xs text-slate-500">Phone / WhatsApp</p>
                        <p className="text-sm text-white">+91 9265799325</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Mail size={20} className="text-blue-400" />
                    <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm text-white">info@infiniteyatra.com</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Globe size={20} className="text-purple-400" />
                    <div>
                        <p className="text-xs text-slate-500">Website</p>
                        <p className="text-sm text-white">infiniteyatra.com</p>
                    </div>
                </div>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Business Model</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { phase: 'Phase 1 (Current)', items: ['Trekking tours', 'Group tours (15+ per batch)', 'Hotel bookings', 'Transport services'], color: 'border-green-500/30 bg-green-500/5' },
                    { phase: 'Phase 2 (Expansion)', items: ['International packages', 'Luxury travel', 'Corporate travel', 'Customized trips'], color: 'border-yellow-500/30 bg-yellow-500/5' },
                    { phase: 'Phase 3 (Future)', items: ['Space tourism (Moon, Mars)', 'Private jet bookings', 'Ultra-premium experiences'], color: 'border-purple-500/30 bg-purple-500/5' }
                ].map((phase) => (
                    <div key={phase.phase} className={`p-4 rounded-xl border ${phase.color}`}>
                        <h4 className="text-sm font-bold text-white mb-3">{phase.phase}</h4>
                        <ul className="space-y-2">
                            {phase.items.map((item) => (
                                <li key={item} className="text-xs text-slate-300 flex items-start gap-2">
                                    <CheckCircle size={12} className="text-green-400 mt-0.5 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Target Audience</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Budget Travelers', desc: 'Middle-class, value seekers' },
                    { label: 'Spiritual Travelers', desc: 'Kedarnath, Char Dham pilgrims' },
                    { label: 'Adventure Seekers', desc: 'Trekkers, thrill lovers' },
                    { label: 'Premium Clients', desc: 'Luxury, customized trips' }
                ].map((audience) => (
                    <div key={audience.label} className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-sm font-semibold text-white">{audience.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{audience.desc}</p>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

const StructureSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Layout} title="Platform Structure" subtitle="How the website is organized" color="from-purple-600 to-purple-400" />

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Public Pages (What Visitors See)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                    { path: '/', name: 'Home', desc: 'Landing page with hero, packages, testimonials' },
                    { path: '/destinations', name: 'Destinations', desc: 'All available travel packages with filters' },
                    { path: '/package/:id', name: 'Package Detail', desc: 'Full itinerary, pricing, WhatsApp booking' },
                    { path: '/hotels', name: 'Hotels', desc: 'Hotel discovery and booking' },
                    { path: '/transportation', name: 'Transportation', desc: 'Transport services hub' },
                    { path: '/blog', name: 'Blog', desc: 'Travel articles, guides, SEO content' },
                    { path: '/stories', name: 'Travel Stories', desc: 'Community travel experiences' },
                    { path: '/contact', name: 'Contact', desc: 'Inquiry form + contact details' },
                    { path: '/careers', name: 'Careers', desc: 'Job openings at Infinite Yatra' },
                    { path: '/trip-planner', name: 'AI Trip Planner', desc: 'AI-powered trip planning (Gemini)' }
                ].map((page) => (
                    <div key={page.path} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <code className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded shrink-0">{page.path}</code>
                        <div>
                            <p className="text-sm font-semibold text-white">{page.name}</p>
                            <p className="text-xs text-slate-500">{page.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">User Pages (Login Required)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                    { path: '/dashboard', name: 'User Dashboard', desc: 'Personal dashboard after login' },
                    { path: '/profile', name: 'Profile', desc: 'User profile management' },
                    { path: '/my-bookings', name: 'My Bookings', desc: 'View all tour bookings' },
                    { path: '/my-trips', name: 'My Trips', desc: 'Trip history and details' },
                    { path: '/wishlist', name: 'Wishlist', desc: 'Saved packages' },
                    { path: '/passport', name: 'IY Passport', desc: 'Loyalty rewards system' }
                ].map((page) => (
                    <div key={page.path} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                        <code className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded shrink-0">{page.path}</code>
                        <div>
                            <p className="text-sm font-semibold text-white">{page.name}</p>
                            <p className="text-xs text-slate-500">{page.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Admin Pages (Staff Only)</h3>
            <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <Shield size={20} className="text-orange-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-white">Admin Dashboard - /admin</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Full operating system for the business. Manage packages, bookings, hotels, transport, leads, content, finances, and more.
                        Access is role-based — each team member sees only what they need.
                    </p>
                </div>
            </div>
        </Card>
    </div>
);

const VerticalsSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Package} title="Business Verticals" subtitle="Our different service lines" color="from-emerald-600 to-emerald-400" />

        {[
            {
                icon: Map, title: 'Tours & Trekking', status: 'Active',
                desc: 'Our core business. Group trekking tours to Kedarnath, Char Dham, Kedarkantha, etc.',
                features: ['Package listings with itinerary', 'WhatsApp-based booking', 'Group management', 'Trip operations tracking']
            },
            {
                icon: Building2, title: 'IY Hotels', status: 'Active',
                desc: 'Hotel discovery, comparison, and booking platform.',
                features: ['Hotel listings with photos/reviews', 'Room availability calendar', 'Hotel partner onboarding', 'Vendor management']
            },
            {
                icon: Car, title: 'IY Transport', status: 'Active',
                desc: 'Transportation services — cars, cabs, vehicles for travel.',
                features: ['Vehicle listings', 'City-wise transport search', 'Booking management', 'Driver assignment']
            },
            {
                icon: Anchor, title: 'IY Cruise', status: 'Coming Soon',
                desc: 'Cruise bookings and waterway travel experiences.',
                features: ['Cruise package listings', 'Cabin booking', 'Route maps']
            },
            {
                icon: Bike, title: 'IY Cycles', status: 'Coming Soon',
                desc: 'Cycle rental for eco-friendly local exploration.',
                features: ['Cycle fleet management', 'Hourly/daily rental', 'Location-based availability']
            },
            {
                icon: Rocket, title: 'IY Space', status: 'Future Vision',
                desc: 'Space tourism waitlist — Moon, Mars exploration trips.',
                features: ['Waitlist registration', 'Space tourism awareness', 'Future booking interest']
            }
        ].map((vertical) => {
            const Icon = vertical.icon;
            return (
                <Card key={vertical.title}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Icon size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{vertical.title}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{vertical.desc}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold ${vertical.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            vertical.status === 'Coming Soon' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                            {vertical.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {vertical.features.map((feature) => (
                            <p key={feature} className="text-xs text-slate-300 flex items-center gap-2">
                                <CheckCircle size={12} className="text-slate-500 shrink-0" />
                                {feature}
                            </p>
                        ))}
                    </div>
                </Card>
            );
        })}
    </div>
);

const AdminSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Shield} title="Admin Dashboard Guide" subtitle="How to use the admin panel" color="from-orange-600 to-orange-400" />

        <Card>
            <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-6">
                <AlertCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-white">How to Access</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Go to <code className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">infiniteyatra.com/admin</code> —
                        You must be logged in with an admin account. Contact Parth for access.
                    </p>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Admin Modules</h3>
            <div className="space-y-3">
                {[
                    { section: 'Core', items: [
                        { name: 'Live Dashboard', desc: 'Real-time analytics and stats' },
                        { name: 'Snapshot', desc: 'Overview of all business metrics' },
                        { name: 'Lead Management', desc: 'All leads from WhatsApp, enquiry forms, contact page' },
                        { name: 'Staff & Roles', desc: 'Manage team members and permissions' }
                    ]},
                    { section: 'Tour Management', items: [
                        { name: 'Tour Bookings', desc: 'All tour/trek bookings' },
                        { name: 'Tour Clients (CRM)', desc: 'Customer lifetime value, segments' },
                        { name: 'Packages', desc: 'Add, edit, delete tour packages' },
                        { name: 'Operations', desc: 'Trip logistics and coordination' }
                    ]},
                    { section: 'Hotel Management', items: [
                        { name: 'Manage Hotels', desc: 'Add/edit hotel listings' },
                        { name: 'Hotel Bookings', desc: 'Track hotel reservations' },
                        { name: 'Hotel Inquiries', desc: 'Hotel-specific lead management' },
                        { name: 'Availability Calendar', desc: 'Room availability management' }
                    ]},
                    { section: 'Content', items: [
                        { name: 'Homepage Manager', desc: 'Edit homepage sections' },
                        { name: 'Blog & Stories', desc: 'Publish articles and travel stories' },
                        { name: 'Media Library', desc: 'Upload and manage images' }
                    ]}
                ].map((group) => (
                    <div key={group.section}>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.section}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.items.map((item) => (
                                <div key={item.name} className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                                    <ChevronRight size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.name}</p>
                                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Role-Based Access</h3>
            <p className="text-xs text-slate-400 mb-4">Each team member gets a role that controls what they can see in the admin panel:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                    { role: 'Super Admin', access: 'Everything — full control', color: 'text-red-400' },
                    { role: 'Tour Manager', access: 'Leads, Bookings, CRM, Packages, Operations', color: 'text-blue-400' },
                    { role: 'Finance Manager', access: 'Tour Financials, Hotel Financials, Influencer ROI', color: 'text-green-400' },
                    { role: 'Content Manager', access: 'Homepage, Experiences, Blog, Media', color: 'text-purple-400' },
                    { role: 'Hotel Manager', access: 'Hotels, Hotel Bookings, Inquiries, Reviews, Availability', color: 'text-yellow-400' },
                    { role: 'Booking Manager', access: 'Leads, All Bookings, Analytics', color: 'text-cyan-400' }
                ].map((r) => (
                    <div key={r.role} className="p-3 bg-white/5 rounded-xl">
                        <p className={`text-sm font-bold ${r.color}`}>{r.role}</p>
                        <p className="text-xs text-slate-400 mt-1">{r.access}</p>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

const LeadsSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Target} title="Lead Management" subtitle="How leads flow through the system" color="from-yellow-600 to-yellow-400" />

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Lead Sources (Where leads come from)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { source: 'Enquiry Popup', desc: 'Auto-popup on website after 50% scroll. Collects name, phone, email.', icon: Zap, color: 'text-blue-400' },
                    { source: 'WhatsApp Click', desc: 'When visitor clicks "Book via WhatsApp" on any package page. Auto-tracked.', icon: MessageCircle, color: 'text-green-400' },
                    { source: 'Contact Form', desc: 'From the /contact page. Includes message field.', icon: Mail, color: 'text-purple-400' },
                    { source: 'Booking Inquiry', desc: 'When someone starts a booking process but needs follow-up.', icon: Package, color: 'text-orange-400' }
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.source} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                            <Icon size={20} className={`${s.color} shrink-0 mt-0.5`} />
                            <div>
                                <p className="text-sm font-bold text-white">{s.source}</p>
                                <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Lead Status Flow</h3>
            <div className="flex flex-wrap items-center gap-3">
                {[
                    { status: 'New', color: 'bg-blue-500', desc: 'Just came in, not yet contacted' },
                    { status: 'Contacted', color: 'bg-yellow-500', desc: 'You called/messaged them' },
                    { status: 'Follow Up', color: 'bg-orange-500', desc: 'Interested, needs another call' },
                    { status: 'Converted', color: 'bg-green-500', desc: 'Booked! Became a customer' },
                    { status: 'Lost', color: 'bg-red-500', desc: 'Not interested / no response' }
                ].map((s, i) => (
                    <React.Fragment key={s.status}>
                        <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl">
                            <span className={`w-3 h-3 rounded-full ${s.color}`} />
                            <div>
                                <p className="text-sm font-bold text-white">{s.status}</p>
                                <p className="text-[10px] text-slate-500">{s.desc}</p>
                            </div>
                        </div>
                        {i < 4 && <ArrowRight size={16} className="text-slate-600 hidden md:block" />}
                    </React.Fragment>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">How to Handle Leads</h3>
            <div className="space-y-3">
                {[
                    { step: '1', title: 'Check leads daily', desc: 'Go to Admin > Lead Management. Check for new leads.' },
                    { step: '2', title: 'Contact within 1 hour', desc: 'New leads should be contacted ASAP. Use WhatsApp follow-up button.' },
                    { step: '3', title: 'Update status', desc: 'After contacting, change status to "Contacted" or "Follow Up".' },
                    { step: '4', title: 'Add notes', desc: 'Write what was discussed. "Interested in Jan batch, will confirm by Friday".' },
                    { step: '5', title: 'Follow up', desc: 'If Follow Up status, call again in 2-3 days.' },
                    { step: '6', title: 'Close the deal', desc: 'When booked, mark as "Converted". If no response after 3 tries, mark "Lost".' }
                ].map((step) => (
                    <div key={step.step} className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {step.step}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{step.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

const WorkflowSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Compass} title="Daily Workflow" subtitle="What you should do every day" color="from-cyan-600 to-cyan-400" />

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Morning Checklist</h3>
            <div className="space-y-2">
                {[
                    'Open Admin Dashboard (/admin)',
                    'Check Lead Management — respond to all new leads',
                    'Check Tour Bookings — any new bookings overnight?',
                    'Check Hotel Inquiries — follow up on pending',
                    'Reply to WhatsApp messages within 30 minutes',
                    'Update lead statuses based on conversations'
                ].map((task, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/[0.07] transition-colors">
                        <div className="w-5 h-5 rounded border border-white/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-slate-500">{i + 1}</span>
                        </div>
                        <span className="text-sm text-slate-300">{task}</span>
                    </label>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Weekly Tasks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                    'Export leads CSV for weekly report',
                    'Review conversion rate (target: 5%+)',
                    'Update package availability',
                    'Publish 1-2 blog posts for SEO',
                    'Check and respond to reviews',
                    'Update social media content'
                ].map((task, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                        <Star size={14} className="text-yellow-400 shrink-0" />
                        <span className="text-sm text-slate-300">{task}</span>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

const TechSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Zap} title="Tech Stack" subtitle="What technologies power this platform" color="from-pink-600 to-pink-400" />

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Technology Stack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { category: 'Frontend', items: ['React 18', 'Vite (build tool)', 'Tailwind CSS v4', 'Framer Motion (animations)'] },
                    { category: 'Backend / Database', items: ['Firebase Auth (login)', 'Firestore (database)', 'Firebase Hosting', 'Hostinger (domain + hosting)'] },
                    { category: 'AI & Integrations', items: ['Google Gemini API (AI planner)', 'EmailJS (email sending)', 'WhatsApp Business API', 'Lucide React (icons)'] },
                    { category: 'Tools & Testing', items: ['GitHub (code repository)', 'Playwright (testing)', 'ESLint (code quality)', 'npm (package manager)'] }
                ].map((group) => (
                    <div key={group.category} className="p-4 bg-white/5 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-3">{group.category}</h4>
                        <ul className="space-y-2">
                            {group.items.map((item) => (
                                <li key={item} className="text-xs text-slate-300 flex items-center gap-2">
                                    <CheckCircle size={12} className="text-green-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Key Firebase Collections (Database)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                    'leads', 'enquiries', 'bookings', 'packages',
                    'hotels', 'hotel_inquiries', 'users', 'blogs',
                    'reviews', 'referrals', 'transport_vehicles', 'stories'
                ].map((col) => (
                    <code key={col} className="text-xs text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg text-center border border-blue-500/10">
                        {col}
                    </code>
                ))}
            </div>
        </Card>
    </div>
);

const VisionSection = () => (
    <div className="space-y-6">
        <SectionTitle icon={Rocket} title="Future Vision" subtitle="Where Infinite Yatra is headed" color="from-indigo-600 to-indigo-400" />

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">The Big Picture</h3>
            <div className="p-6 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 rounded-xl text-center">
                <p className="text-lg text-white font-medium italic">
                    "From local treks to space tourism — Infinite Yatra is building the ultimate travel ecosystem."
                </p>
                <p className="text-xs text-slate-500 mt-3">Not just a website. A scalable travel platform + sales machine.</p>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Upcoming Features</h3>
            <div className="space-y-3">
                {[
                    { feature: 'Payment Gateway (Razorpay)', timeline: 'Q2 2026', status: 'Planned' },
                    { feature: 'PWA (Install as App)', timeline: 'Q2 2026', status: 'Planned' },
                    { feature: 'Multi-language (Hindi/English)', timeline: 'Q3 2026', status: 'Planned' },
                    { feature: 'Subscription Model "Infinite Explorer Club"', timeline: 'Q3 2026', status: 'Planned' },
                    { feature: 'B2B Travel Agent Portal', timeline: 'Q3 2026', status: 'Planned' },
                    { feature: 'Corporate Travel Packages', timeline: 'Q4 2026', status: 'Planned' },
                    { feature: 'Mobile App (React Native)', timeline: '2027', status: 'Future' },
                    { feature: 'Space Tourism Module', timeline: 'Long-term', status: 'Vision' }
                ].map((f) => (
                    <div key={f.feature} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                            <ChevronRight size={14} className="text-blue-400" />
                            <span className="text-sm text-white">{f.feature}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">{f.timeline}</span>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${f.status === 'Planned' ? 'bg-yellow-500/10 text-yellow-400' :
                                f.status === 'Future' ? 'bg-purple-500/10 text-purple-400' :
                                    'bg-blue-500/10 text-blue-400'
                                }`}>
                                {f.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-bold text-white mb-4">Revenue Goals</h3>
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Current', value: '3-4L/mo', sub: 'Tour bookings + hotel commissions' },
                    { label: 'Target (6mo)', value: '7-10L/mo', sub: 'With lead system + marketing' },
                    { label: 'Target (1yr)', value: '20L+/mo', sub: 'With payment + subscriptions + B2B' }
                ].map((goal) => (
                    <div key={goal.label} className="p-4 bg-white/5 rounded-xl text-center">
                        <p className="text-xs text-slate-500">{goal.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{goal.value}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{goal.sub}</p>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

export default TeamGuide;
