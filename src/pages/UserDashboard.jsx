import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { User, Calendar, Heart, Gift, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import ReferralDashboard from '../components/ReferralDashboard';
import MyBookings from './MyBookings';
import MyTrips from './MyTrips';
import WishlistPage from './WishlistPage';

const UserDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const tabs = [
        { id: 'bookings', label: 'My Bookings', icon: Calendar },
        { id: 'trips', label: 'My Trips', icon: User },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
        { id: 'referrals', label: 'Refer & Earn', icon: Gift, badge: '₹1K' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'bookings':
                return <MyBookings />;
            case 'trips':
                return <MyTrips />;
            case 'wishlist':
                return <WishlistPage />;
            case 'referrals':
                return <ReferralDashboard />;
            default:
                return <MyBookings />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
            <SEO
                title="My Dashboard"
                description="Manage your bookings, trips, and referrals"
            />

            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">My Dashboard</h1>
                    <p className="text-slate-600">Welcome back, {currentUser?.email?.split('@')[0]}!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                            {/* Profile */}
                            <div className="text-center mb-6 pb-6 border-b border-slate-200">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                                    {currentUser?.email?.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-slate-900">{currentUser?.email?.split('@')[0]}</h3>
                                <p className="text-sm text-slate-600">{currentUser?.email}</p>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                : 'text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            <span className="font-medium flex-1 text-left">{tab.label}</span>
                                            {tab.badge && activeTab !== tab.id && (
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors mt-6"
                            >
                                <LogOut size={20} />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
