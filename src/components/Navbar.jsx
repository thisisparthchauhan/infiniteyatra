import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Search, MapPin, Info, Sparkles, BookOpen, Home, User, Package, Mail, LogOut, LayoutDashboard, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

import logo from '../assets/logo-new.png';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const { wishlist } = useWishlist();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    // Identify pages that need a light theme navbar (dark text)
    const isLightPage = [
        '/blog',
        '/careers'
    ].some(path => location.pathname.startsWith(path));

    // Also handle dynamic routes if needed, or stick to this list.
    // Generally, if it's not Home or Package Detail or Contact, it might be light.
    // But let's start with this list which covers the reported issue.

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            // Detect active section for highlighting
            const sections = ['destinations', 'stories-preview', 'about'];

            // Check if we're near the bottom of the page (contact section)
            // const windowHeight = window.innerHeight;
            // const documentHeight = document.documentElement.scrollHeight;
            // const scrollTop = window.scrollY;
            // const isNearBottom = scrollTop + windowHeight >= documentHeight - 200;

            // if (isNearBottom) {
            //     setActiveSection('contact');
            //     return;
            // }

            // Find which section is currently in view
            const current = sections.find(section => {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Check if section is in the top portion of viewport
                    return rect.top <= 150 && rect.bottom >= 150;
                }
                return false;
            });

            setActiveSection(current || '');
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setIsMobileMenuOpen(false);
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { name: 'Home', icon: Home, href: '/', type: 'link' },
        { name: 'Destinations', icon: MapPin, href: '/destinations', type: 'link' },
        { name: 'AI Trip Planner', icon: Sparkles, href: '/trip-planner', type: 'link', highlight: true },
        { name: 'Stories', icon: BookOpen, href: '/stories', type: 'link' },
        { name: 'About Us', icon: Info, href: '#about', type: 'scroll' },
        { name: 'Contact', icon: Mail, href: '/contact', type: 'link' }
    ];

    const navBackground = isScrolled
        ? 'bg-black/50 backdrop-blur-xl border-b border-white/5'
        : 'bg-transparent backdrop-blur-none';

    const textColor = isLightPage && !isScrolled
        ? 'text-slate-900'
        : 'text-white';

    const handleNavClick = (e, href) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);

        // If we're not on the homepage, navigate to homepage with hash
        if (location.pathname !== '/') {
            window.location.href = '/' + href;
            return;
        }

        // If we're on homepage, scroll to section
        const element = document.querySelector(href);
        if (element) {
            // Using scrollIntoView with scroll-margin-top CSS property
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBackground}`}>
                <div className="container mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link
                            to="/"
                            className="flex flex-col items-center group relative z-10"
                        >
                            <span className={`text-2xl font-black tracking-[0.2em] ${textColor === 'text-white' ? 'text-white' : 'text-slate-950'} drop-shadow-sm whitespace-nowrap`} style={{ fontFamily: "'Raleway', sans-serif" }}>INFINITE YATRA</span>
                            <span className={`text-[10px] tracking-[0.3em] font-extrabold ${textColor === 'text-white' ? 'text-white/90' : 'text-slate-800'}`} style={{ fontFamily: "'Raleway', sans-serif" }}>EXPLORE INFINITE</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1 lg:gap-2 ml-10">
                            {!isAuthPage && navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.name === 'Home'
                                    ? location.pathname === '/' && !activeSection
                                    : item.type === 'link'
                                        ? location.pathname === item.href || (location.pathname === '/' && activeSection === 'destinations' && item.name === 'Destinations') || (location.pathname === '/' && activeSection === 'stories-preview' && item.name === 'Stories')
                                        : activeSection === item.href.replace('#', '');

                                const baseTextClass = textColor === 'text-slate-900' ? 'text-slate-900 hover:bg-black/5' : 'text-white/70 hover:text-white hover:bg-white/5';
                                const activeTextClass = textColor === 'text-slate-900' ? 'text-blue-600 bg-blue-50' : 'text-white bg-white/10';

                                if (item.type === 'link') {
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={(e) => {
                                                if (item.name === 'Home' && location.pathname === '/') {
                                                    e.preventDefault();
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            className={`
                                                relative px-4 py-2 text-sm font-medium rounded-lg 
                                                transition-all duration-300 group
                                                flex items-center gap-2
                                                ${item.highlight
                                                    ? `glass-btn !px-4 !py-2 !text-xs hover:!bg-white/20 ${textColor === 'text-slate-900' ? '!bg-[#0f172a] !border-white/10 text-white shadow-lg' : 'border-white/20 bg-white/10 text-white'}`
                                                    : isActive
                                                        ? activeTextClass
                                                        : baseTextClass
                                                }
                                            `}
                                        >
                                            <Icon size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                            <span>{item.name}</span>
                                            <span className={`
                                                absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 
                                                transition-all duration-300 rounded-full
                                                ${isActive ? 'w-3/4' : 'w-0 group-hover:w-3/4'}
                                            `}></span>
                                        </Link>
                                    );
                                }

                                return (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => handleNavClick(e, item.href)}
                                        className={`
                                            relative px-4 py-2 text-sm font-medium rounded-lg 
                                            transition-all duration-300 group
                                            flex items-center gap-2
                                            ${isActive
                                                ? activeTextClass
                                                : baseTextClass
                                            }
                                        `}
                                    >
                                        <Icon size={16} className="transition-transform duration-300 group-hover:scale-110" />
                                        <span>{item.name}</span>
                                        <span className={`
                                            absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 
                                            transition-all duration-300 rounded-full
                                            ${isActive ? 'w-3/4' : 'w-0 group-hover:w-3/4'}
                                        `}></span>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            {!isAuthPage && (
                                <button
                                    className={`
                                        p-2.5 rounded-full transition-all duration-300
                                        hover:scale-110 hover:rotate-12
                                        ${textColor === 'text-slate-900' ? 'text-slate-900 hover:bg-black/5' : 'hover:bg-white/10 text-white'}
                                    `}
                                >
                                    <Search size={20} />
                                </button>
                            )}

                            {/* Wishlist Icon */}
                            {!isAuthPage && (
                                <Link
                                    to="/wishlist"
                                    className={`
                                        p-2.5 rounded-full transition-all duration-300 relative
                                        hover:scale-110
                                        ${textColor === 'text-slate-900' ? 'text-slate-900 hover:bg-black/5' : 'hover:bg-white/10 text-white'}
                                    `}
                                    title="My Wishlist"
                                >
                                    <Heart size={20} className={wishlist.length > 0 ? "fill-red-500 text-red-500" : ""} />
                                    {wishlist.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </Link>
                            )}

                            {currentUser ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <div className={`
                                            flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                                            border cursor-pointer
                                            ${textColor === 'text-slate-900'
                                                ? 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                                                : 'bg-white/5 text-white hover:bg-white/10 border-white/10'}
                                        `}>
                                            <User size={18} />
                                            <span className="font-medium text-sm max-w-[100px] truncate">
                                                {currentUser.displayName || currentUser.email.split('@')[0]}
                                            </span>
                                        </div>

                                        {/* Dropdown Menu */}
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                                            <div className="p-3 border-b border-white/10">
                                                <p className="text-sm font-bold text-white truncate">{currentUser.displayName || 'User'}</p>
                                                <p className="text-xs text-white/50 truncate">{currentUser.email}</p>
                                            </div>
                                            <div className="p-1.5 space-y-0.5">
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                                >
                                                    <User size={16} className="text-green-400" />
                                                    My Profile
                                                </Link>
                                                <Link
                                                    to="/my-bookings"
                                                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                                >
                                                    <Package size={16} className="text-blue-400" />
                                                    My Bookings
                                                </Link>
                                                <Link
                                                    to="/my-trips"
                                                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                                >
                                                    <Sparkles size={16} className="text-purple-400" />
                                                    AI Trips
                                                </Link>


                                                {/* Admin Link inside Menu */}
                                                {currentUser.isAdmin && (
                                                    <Link
                                                        to="/admin"
                                                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                                    >
                                                        <LayoutDashboard size={16} className="text-indigo-400" />
                                                        Admin Dashboard
                                                    </Link>
                                                )}

                                                <div className="my-1.5 border-t border-white/10"></div>

                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Are you sure you want to log out?')) {
                                                            handleLogout();
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-left"
                                                >
                                                    <LogOut size={16} />
                                                    Log Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className={`
                                            px-5 py-2.5 rounded-full font-medium transition-all duration-300
                                            text-white hover:bg-white/10 border border-transparent hover:border-white/10
                                            hover:scale-105
                                        `}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="
                                            relative overflow-hidden group
                                            bg-gradient-to-r from-blue-600 to-purple-600 
                                            hover:from-blue-700 hover:to-purple-700
                                            text-white px-6 py-2.5 rounded-full font-medium 
                                            transition-all duration-300 
                                            shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40
                                            hover:scale-105
                                        "
                                    >
                                        <span className="relative z-10">Sign Up</span>
                                        <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className={`
                                md:hidden p-2 rounded-lg transition-all duration-300
                                text-white hover:bg-white/10
                            `}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav >

            {/* Mobile Menu Overlay */}
            < div
                className={`
                    fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden 
                    transition-opacity duration-300
                    ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <div
                className={`
                    fixed top-20 right-0 bottom-0 w-80 max-w-[85vw] glass-card !rounded-2xl !rounded-r-none !bg-black/90 !backdrop-blur-xl z-40 md:hidden
                    shadow-2xl transform transition-transform duration-300 ease-out border-l border-white/10
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* Navigation Items */}
                    <div className="p-6 space-y-2">
                        {!isAuthPage && navItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = item.name === 'Home'
                                ? location.pathname === '/' && !activeSection
                                : item.type === 'link'
                                    ? location.pathname === item.href
                                    : activeSection === item.href.replace('#', '');

                            if (item.type === 'link') {
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            // If clicking Home while already on homepage, scroll to top
                                            if (item.name === 'Home' && location.pathname === '/') {
                                                setTimeout(() => {
                                                    window.scrollTo({
                                                        top: 0,
                                                        behavior: 'smooth'
                                                    });
                                                }, 100);
                                            }
                                        }}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                                            transition-all duration-300
                                            ${isActive
                                                ? 'bg-white/10 text-blue-300'
                                                : 'text-white/80 hover:bg-white/5'
                                            }
                                            transform hover:translate-x-1
                                        `}
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                            animation: isMobileMenuOpen ? 'slideInRight 0.3s ease-out forwards' : 'none'
                                        }}
                                    >
                                        <Icon size={20} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            }

                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => handleNavClick(e, item.href)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                                        transition-all duration-300
                                        ${isActive
                                            ? 'bg-white/10 text-blue-300'
                                            : 'text-white/80 hover:bg-white/5'
                                        }
                                        transform hover:translate-x-1
                                    `}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animation: isMobileMenuOpen ? 'slideInRight 0.3s ease-out forwards' : 'none'
                                    }}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </a>
                            );
                        })}

                        {/* Mobile Wishlist Link */}
                        {!isAuthPage && (
                            <Link
                                to="/wishlist"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-white/80 hover:bg-white/5 transition-all duration-300"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Heart size={20} className={wishlist.length > 0 ? "text-red-500 fill-red-500" : ""} />
                                <span>My Wishlist</span>
                                {wishlist.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {wishlist.length}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 mx-6"></div>

                    {/* Auth Actions */}
                    <div className="p-6 space-y-3 mt-auto">
                        {currentUser ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{currentUser.displayName || 'User'}</p>
                                        <p className="text-xs text-white/50">{currentUser.email}</p>
                                    </div>
                                </div>
                                <Link
                                    to="/my-bookings"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="
                                        w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium
                                        text-blue-600 bg-blue-50 hover:bg-blue-100
                                        transition-all duration-300
                                    "
                                >
                                    <Package size={18} />
                                    My Bookings
                                </Link>
                                <Link
                                    to="/my-trips"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="
                                            w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium
                                            text-blue-600 bg-blue-50 hover:bg-blue-100
                                            transition-all duration-300
                                        "
                                >
                                    <Sparkles size={18} />
                                    AI Trips
                                </Link>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to log out?')) {
                                            handleLogout();
                                        }
                                    }}
                                    className="
                                        w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium
                                        text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10
                                        transition-all duration-300
                                    "
                                >
                                    <LogOut size={18} />
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="
                                        block text-center px-5 py-3 rounded-xl font-medium
                                        text-white/80 hover:text-white hover:bg-white/10
                                        transition-all duration-300 border border-white/10
                                        hover:border-white/30
                                    "
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="
                                        block text-center px-5 py-3 rounded-xl font-medium
                                        glass-btn justify-center bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30
                                    "
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Add keyframe animation for mobile menu items */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
};

export default Navbar;
