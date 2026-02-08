import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, ShieldAlert, Home, ChevronDown, User, LogOut, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useRole } from '../context/RoleContext';
import { USER_ROLES } from '../config/roles';

// Sub-Modules
import Overview from '../components/admin/dashboard/Overview';
import Bookings from '../components/admin/dashboard/Bookings';
import Inventory from '../components/admin/dashboard/Inventory';
import Operations from '../components/admin/dashboard/Operations';
import Financials from '../components/admin/dashboard/Financials';
import CustomerCRM from '../components/admin/dashboard/CustomerCRM';
import Content from '../components/admin/dashboard/Content';
import AdminExperiences from '../components/admin/experiences/AdminExperiences';
import InfluencerROI from '../components/admin/dashboard/InfluencerROI';
import AdminImageUpload from '../components/AdminImageUpload';
import AddStaffModal from '../components/admin/AddStaffModal';
import AdminHomepageManager from '../components/admin/dashboard/AdminHomepageManager';
import AdminHotelManager from '../components/admin/hotels/AdminHotelManager';
import AdminHotelFinance from '../components/admin/hotels/AdminHotelFinance';
import AdminHotelBookings from '../components/admin/hotels/AdminHotelBookings';
import LiveAnalytics from '../components/admin/analytics/LiveAnalytics';

const AdminDashboard = () => {
    const { hasPermission, getFirstAllowedTab, currentRole, setCurrentRole, currentWorkspace } = useRole();
    const [activeTab, setActiveTab] = useState(getFirstAllowedTab());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Reset active tab when role or workspace changes
    useEffect(() => {
        const firstTab = getFirstAllowedTab();
        setActiveTab(firstTab);
    }, [currentRole, currentWorkspace]);

    // Dynamic Title based on active tab
    const getTitle = () => {
        const titles = {
            overview: 'Dashboard Overview',
            bookings: 'Tour Booking Management',
            finance: 'Financials (Tours)',
            crm: 'Tour Clients',
            packages: 'Package Inventory',
            homepage: 'Homepage Manager',
            operations: 'Trip Operations Center',
            staff: 'Team & Permissions',
            stories: 'Blog & Stories',
            media: 'Media Library',
            experiences: 'Experiences',
            influencers: 'Influencer ROI',
            hotels: 'Hotel Management',
            'hotel-finance': 'Hotel Financials',
            'hotel-bookings': 'Hotel Bookings',
            analytics: 'Live Command Center'
        };
        return titles[activeTab] || 'Admin Panel';
    };

    // Render logic for content
    const renderContent = () => {
        if (!hasPermission(activeTab)) {
            return (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <ShieldAlert size={64} className="text-red-500 mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400 max-w-md">
                        Your role as <strong>{currentRole}</strong> does not have permission to view this section.
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'analytics': return <LiveAnalytics />;
            case 'overview': return <Overview />;
            case 'bookings': return <Bookings />;
            case 'packages': return <Inventory />;
            case 'homepage': return <AdminHomepageManager />;
            case 'hotels': return <AdminHotelManager />;
            case 'hotel-bookings': return <AdminHotelBookings />;
            case 'hotel-finance': return <AdminHotelFinance />;
            case 'operations': return <Operations />;
            case 'finance': return <Financials />;
            case 'crm': return <CustomerCRM />;
            case 'stories': return <Content />;
            case 'experiences': return <AdminExperiences />;
            case 'media': return <AdminImageUpload />;
            case 'influencers': return <InfluencerROI />;
            case 'staff':
                return (
                    <div className="text-center py-20">
                        <button onClick={() => setShowStaffModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                            Open Staff Manager
                        </button>
                        <p className="mt-4 text-slate-500">Staff module refactor pending...</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
            <SEO title="Admin OS 2.0" description="Infinite Yatra Operating System" url="/admin" />

            {/* Background Ambient Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[128px]"></div>
            </div>

            {/* Layout Grid */}
            <div className="flex h-screen relative z-10">

                {/* Sidebar */}
                <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64 relative transition-all duration-300">

                    {/* Glass Header */}
                    <header className="h-20 shrink-0 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl z-20">
                        <div className="flex items-center gap-4">
                            <button className="lg:hidden p-2 text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                <Menu size={20} />
                            </button>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                {getTitle()}
                            </h1>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Global Search */}
                            <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:border-white/20 transition-colors cursor-text group w-64">
                                <Search size={16} className="text-slate-500 group-hover:text-slate-300" />
                                <span className="text-sm text-slate-500 group-hover:text-slate-300">Cmd+K to search...</span>
                            </div>

                            {/* Home Button */}
                            <Link to="/" className="p-2 text-slate-400 hover:text-white transition-colors" title="Back to Website">
                                <Home size={20} />
                            </Link>

                            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                {/* Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 ring-2 ring-white/10 group-hover:ring-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                                            PC
                                        </div>
                                        <div className="hidden md:block text-left">
                                            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Parth Chauhan</p>
                                            <p className="text-[10px] text-slate-400">chauhanparth165@gmail.com</p>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isProfileOpen && (
                                            <>
                                                {/* Backdrop to close */}
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsProfileOpen(false)}
                                                />

                                                {/* Dropdown Menu */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-full right-0 mt-2 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                                >
                                                    {/* Header */}
                                                    <div className="px-5 py-4 border-b border-white/5 bg-white/5">
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Account</p>
                                                        <Link to="/profile" className="block group/profile">
                                                            <p className="text-sm font-bold text-white group-hover/profile:text-blue-400 transition-colors">Parth Chauhan</p>
                                                            <p className="text-xs text-slate-400">chauhanparth165@gmail.com</p>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Workspace */}
                    <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="max-w-7xl mx-auto h-full"
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showStaffModal && <AddStaffModal onClose={() => setShowStaffModal(false)} onSuccess={() => setShowStaffModal(false)} />}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
