import React from 'react';
import {
    LayoutDashboard,
    CalendarRange,
    Users,
    Briefcase,
    Settings,
    LogOut,
    TrendingUp,
    Map,
    Image,
    BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'bookings', label: 'Bookings', icon: CalendarRange },
        { id: 'finance', label: 'Financials', icon: TrendingUp },
        { id: 'crm', label: 'Customers', icon: Users },
        { id: 'packages', label: 'Packages', icon: Briefcase },
        { id: 'operations', label: 'Operations', icon: Map },
        { id: 'staff', label: 'Staff & Roles', icon: Users },
        { id: 'stories', label: 'Stories', icon: BookOpen },
        { id: 'media', label: 'Media Library', icon: Image },
    ];

    return (
        <motion.div
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 h-screen fixed left-0 top-0 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col pt-6 pb-6 z-40 hidden lg:flex"
        >
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                    IY
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Infinite Yatra
                </span>
            </div>

            <div className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <div className="mb-2 px-4">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Main Menu</h2>
                </div>

                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'bg-blue-600 shadow-lg shadow-blue-500/25 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-100"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className="relative z-10 flex items-center gap-3">
                                <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} />
                                <span className="font-medium">{item.label}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="px-4 mt-auto">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                            IY
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Infinite Yatra</p>
                            <p className="text-xs text-white/50">Admin Panel v2.0</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminSidebar;
