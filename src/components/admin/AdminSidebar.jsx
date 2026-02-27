import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, LogOut, ChevronDown } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { MENU_ITEMS } from '../../config/roles';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
    const { currentRole, currentWorkspace, setCurrentWorkspace, hasPermission, roles, workspaces } = useRole();

    // Filter menu items based on permissions
    const visibleMenuItems = MENU_ITEMS.filter(item => hasPermission(item.id));

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            <motion.div
                initial={false}
                animate={{ x: 0 }}
                className={`
                    w-64 h-screen fixed left-0 top-0 bg-[#0a0a0a] border-r border-white/10 flex flex-col pt-6 pb-6 z-40 
                    transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="px-6 mb-8 mt-2 flex items-center justify-center">
                    <Link to="/" className="text-center group">
                        <h1 className="text-2xl font-bold text-white tracking-[0.2em] uppercase leading-tight group-hover:text-blue-400 transition-colors">
                            Infinite Yatra
                        </h1>
                        <p className="text-[10px] font-medium text-slate-500 tracking-[0.4em] uppercase mt-1 group-hover:text-slate-400 transition-colors">
                            Explore Infinite
                        </p>
                    </Link>
                </div>

                {/* WORKSPACE SWITCHER */}
                <div className="px-4 mb-6">
                    <div className="relative group">
                        <div className="px-1 mb-2 flex items-center justify-between">
                            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workspace</h2>
                            {currentRole === roles.SUPER_ADMIN && (
                                <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">PREVIEW</span>
                            )}
                        </div>

                        <button
                            className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-between hover:bg-white/10 hover:border-white/20 cursor-pointer"
                        >
                            <span className="truncate mr-2">
                                {Object.values(workspaces).find(w => w.id === currentWorkspace)?.label}
                            </span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {/* Dropdown for All (Dev/Demo Mode) */}
                        <div className="absolute top-full left-0 w-full pt-2 hidden group-hover:block z-50">
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black">
                                {Object.values(workspaces).map(workspace => (
                                    <button
                                        key={workspace.id}
                                        onClick={() => {
                                            setCurrentWorkspace(workspace.id);
                                            // Auto-restore Super Admin role if switching to Admin Dashboard
                                            // This ensures we don't get stuck in a restricted role
                                            if (workspace.id === workspaces.ADMIN_DASHBOARD.id) {
                                                setCurrentRole(roles.SUPER_ADMIN);
                                            }
                                        }}
                                        className={`w-full text-left px-4 py-3 text-xs transition-colors border-l-2 ${currentWorkspace === workspace.id ? 'bg-blue-900/20 border-blue-500 text-white' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        {workspace.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="mb-2 px-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workspace</h2>
                    </div>

                    {visibleMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (window.innerWidth < 1024) setIsOpen(false);
                                }}
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

            </motion.div>
        </>
    );
};

export default AdminSidebar;
