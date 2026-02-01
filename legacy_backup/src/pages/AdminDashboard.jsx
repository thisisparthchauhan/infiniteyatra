import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Settings, Search } from 'lucide-react';
import SEO from '../components/SEO';
import AdminSidebar from '../components/admin/AdminSidebar';

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

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showStaffModal, setShowStaffModal] = useState(false);

    // Dynamic Title based on active tab
    const getTitle = () => {
        const titles = {
            overview: 'Dashboard Overview',
            bookings: 'Booking Management',
            finance: 'Financial Intelligence',
            crm: 'Customer Relationships',
            packages: 'Package Inventory',
            homepage: 'Homepage Manager',
            operations: 'Trip Operations Center',
            staff: 'Team & Permissions',
            stories: 'Stories & Content',
            media: 'Media Library',
            influencers: 'Influencer ROI'
        };
        return titles[activeTab] || 'Admin Panel';
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

                            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                </button>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 ring-4 ring-white/5"></div>
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
                                {activeTab === 'overview' && <Overview />}
                                {activeTab === 'bookings' && <Bookings />}
                                {activeTab === 'packages' && <Inventory />}
                                {activeTab === 'homepage' && <AdminHomepageManager />}
                                {activeTab === 'operations' && <Operations />}
                                {activeTab === 'finance' && <Financials />}
                                {activeTab === 'crm' && <CustomerCRM />}
                                {activeTab === 'stories' && <Content />}
                                {activeTab === 'experiences' && <AdminExperiences />}
                                {activeTab === 'media' && <AdminImageUpload />}
                                {activeTab === 'influencers' && <InfluencerROI />}
                                {activeTab === 'staff' && (
                                    <div className="text-center py-20">
                                        <button onClick={() => setShowStaffModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            Open Staff Manager
                                        </button>
                                        <p className="mt-4 text-slate-500">Staff module refactor pending...</p>
                                    </div>
                                )}
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
