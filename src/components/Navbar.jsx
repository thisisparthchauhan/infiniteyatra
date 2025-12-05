import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Search, MapPin, Info, Sparkles, BookOpen, Home, User, Package, Mail, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/logo-new.png';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const isTripPlannerPage = location.pathname === '/trip-planner';
    const isDestinationsPage = location.pathname === '/destinations';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            // Detect active section for highlighting
            const sections = ['destinations', 'blog-preview', 'about', 'contact'];

            // Check if we're near the bottom of the page (contact section)
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const isNearBottom = scrollTop + windowHeight >= documentHeight - 200;

            if (isNearBottom) {
                setActiveSection('contact');
                return;
            }

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
        { name: 'AI Trip Planner', icon: Sparkles, href: '/trip-planner', type: 'link' },
        { name: 'Blog', icon: BookOpen, href: '/blog', type: 'link' },
        { name: 'About Us', icon: Info, href: '#about', type: 'scroll' },
        { name: 'Contact', icon: Mail, href: '#contact', type: 'scroll' }
    ];

    const navBackground = isAuthPage || isScrolled || isDestinationsPage
        ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50'
        : 'bg-gradient-to-b from-black/30 to-transparent backdrop-blur-sm';

    const textColor = isAuthPage || isScrolled || isDestinationsPage ? 'text-slate-900' : 'text-white';

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
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
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
                            className="flex items-center group relative z-10"
                        >
                            <img
                                src={logo}
                                alt="Infinite Yatra"
                                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1 lg:gap-2">
                            {!isAuthPage && navItems.map((item) => {
                                const Icon = item.icon;
                                // For Home link, only active if on homepage AND no active section
                                // For other links, check pathname or active section
                                const isActive = item.name === 'Home'
                                    ? location.pathname === '/' && !activeSection
                                    : item.type === 'link'
                                        ? location.pathname === item.href || (location.pathname === '/' && activeSection === 'destinations' && item.name === 'Destinations') || (location.pathname === '/' && activeSection === 'blog-preview' && item.name === 'Blog')
                                        : activeSection === item.href.replace('#', '');

                                if (item.type === 'link') {
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            onClick={(e) => {
                                                // If clicking Home while already on homepage, scroll to top
                                                if (item.name === 'Home' && location.pathname === '/') {
                                                    e.preventDefault();
                                                    window.scrollTo({
                                                        top: 0,
                                                        behavior: 'smooth'
                                                    });
                                                }
                                            }}
                                            className={`
                                                relative px-4 py-2 text-sm font-medium rounded-lg 
                                                transition-all duration-300 group
                                                flex items-center gap-2
                                                ${isActive
                                                    ? (isAuthPage || isScrolled || isTripPlannerPage || isDestinationsPage
                                                        ? 'text-blue-600 bg-blue-50'
                                                        : 'text-white bg-white/20')
                                                    : (isAuthPage || isScrolled || isTripPlannerPage || isDestinationsPage
                                                        ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                                                        : 'text-white/90 hover:text-white hover:bg-white/10')
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
                                                ? (isAuthPage || isScrolled || isTripPlannerPage || isDestinationsPage
                                                    ? 'text-blue-600 bg-blue-50'
                                                    : 'text-white bg-white/20')
                                                : (isAuthPage || isScrolled || isTripPlannerPage || isDestinationsPage
                                                    ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                                                    : 'text-white/90 hover:text-white hover:bg-white/10')
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
                                        ${isAuthPage || isScrolled
                                            ? 'hover:bg-slate-100 text-slate-600'
                                            : 'hover:bg-white/20 text-white'
                                        }
                                        hover:scale-110 hover:rotate-12
                                    `}
                                >
                                    <Search size={20} />
                                </button>
                            )}

                            {currentUser ? (
                                <div className="relative group flex items-center gap-3">
                                    <div className={`
                                        flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                                        ${isAuthPage || isScrolled ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20'}
                                    `}>
                                        <User size={18} />
                                        <span className="font-medium text-sm max-w-[100px] truncate">
                                            {currentUser.displayName || currentUser.email.split('@')[0]}
                                        </span>
                                    </div>

                                    {/* Admin Link */}
                                    {currentUser.isAdmin && (
                                        <Link
                                            to="/admin"
                                            className={`
                                                p-2.5 rounded-full transition-all duration-300
                                                ${isAuthPage || isScrolled
                                                    ? 'hover:bg-purple-50 text-slate-600 hover:text-purple-600'
                                                    : 'hover:bg-white/20 text-white hover:text-purple-200'}
                                            `}
                                            title="Admin Dashboard"
                                        >
                                            <LayoutDashboard size={20} />
                                        </Link>
                                    )}

                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-50">
                                        <div className="p-3 border-b border-slate-100">
                                            <p className="text-sm font-bold text-slate-900 truncate">{currentUser.displayName || 'User'}</p>
                                            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                        </div>
                                        <div className="p-1">
                                            <Link
                                                to="/my-bookings"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Package size={16} />
                                                My Bookings
                                            </Link>
                                            <Link
                                                to="/my-trips"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Sparkles size={16} />
                                                My Trips
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to log out?')) {
                                                        handleLogout();
                                                    }
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                            >
                                                <LogOut size={16} />
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className={`
                                            px-5 py-2.5 rounded-full font-medium transition-all duration-300
                                            ${isAuthPage || isScrolled
                                                ? 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
                                                : 'text-white hover:bg-white/20'
                                            }
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
                                ${isAuthPage || isScrolled ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/20'}
                            `}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
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
                    fixed top-20 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-40 md:hidden
                    shadow-2xl transform transition-transform duration-300 ease-out
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
                                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm'
                                                : 'text-slate-700 hover:bg-slate-50'
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
                                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-sm'
                                            : 'text-slate-700 hover:bg-slate-50'
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
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-200 mx-6"></div>

                    {/* Auth Actions */}
                    <div className="p-6 space-y-3 mt-auto">
                        {currentUser ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{currentUser.displayName || 'User'}</p>
                                        <p className="text-xs text-slate-500">{currentUser.email}</p>
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
                                    My Trips
                                </Link>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to log out?')) {
                                            handleLogout();
                                        }
                                    }}
                                    className="
                                        w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium
                                        text-red-600 bg-red-50 hover:bg-red-100
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
                                        text-slate-700 hover:bg-slate-100
                                        transition-all duration-300 border-2 border-slate-200
                                        hover:border-slate-300
                                    "
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="
                                        block text-center px-5 py-3 rounded-xl font-medium
                                        bg-gradient-to-r from-blue-600 to-purple-600 
                                        text-white shadow-lg shadow-blue-600/30
                                        hover:shadow-xl hover:shadow-blue-600/40
                                        transition-all duration-300
                                        hover:scale-105
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
