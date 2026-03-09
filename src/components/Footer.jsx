import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, Lock, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import msmeLogo from '../assets/msme-logo.png';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

/* ─── Brand SVG Icons ─── */
const InstagramIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

const WhatsAppIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const XIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const YouTubeIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);



/* ─── Sub-components ─── */

const FooterLink = ({ to, children, external, href }) => {
    const baseClass = "group flex items-center gap-2 text-[#888] text-sm transition-all duration-200 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#2563EB]";

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={baseClass}>
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 -ml-4 group-hover:ml-0">
                    <ArrowRight size={12} />
                </span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">{children}</span>
            </a>
        );
    }

    return (
        <Link to={to} className={baseClass}>
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 -ml-4 group-hover:ml-0">
                <ArrowRight size={12} />
            </span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">{children}</span>
        </Link>
    );
};

const SectionHeading = ({ children }) => (
    <div className="mb-6">
        <h4 className="text-[13px] uppercase tracking-[0.2em] text-white font-semibold">{children}</h4>
        <div className="mt-2 h-[2px] w-8 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] rounded-full" />
    </div>
);


/* ─── Main Footer ─── */
const Footer = memo(() => {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [easterEggHover, setEasterEggHover] = useState(false);

    // Cinematic Easter Egg Launch State
    const [isLaunching, setIsLaunching] = useState(false);
    const navigate = useNavigate();

    const handleLaunch = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLaunching) return;

        setIsLaunching(true);
        // After 2000ms, redirect
        setTimeout(() => {
            navigate('/future');
            // reset state slightly after navigation
            setTimeout(() => setIsLaunching(false), 500);
        }, 2000);
    }, [isLaunching, navigate]);

    // Generate random stars once to prevent React hydration mismatch / re-renders
    const stars = useMemo(() => {
        return [...Array(40)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            duration: 1 + Math.random() * 2,
            delay: Math.random() * 2
        }));
    }, []);

    const handleSubscribe = useCallback(async (e) => {
        e.preventDefault();
        if (!email || status === 'loading') return;
        setStatus('loading');

        try {
            // Check for duplicates
            const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', email));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setStatus('duplicate');
                addToast("You're already subscribed! 🙌", 'info');
                setTimeout(() => setStatus('idle'), 3000);
                return;
            }

            await addDoc(collection(db, 'newsletter_subscribers'), {
                email,
                subscribedAt: serverTimestamp(),
                source: 'footer'
            });
            setStatus('success');
            addToast('🎉 You\'re in! Watch your inbox for adventures.', 'success');
            setEmail('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus('error');
            addToast(`Subscription failed: ${error.message || 'Please try again'}`, 'error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    }, [email, status, addToast]);


    const exploreLinks = [
        { emoji: '🗺️', label: 'Destinations', to: '/destinations' },
        { emoji: '🏨', label: 'Hotels', to: '/hotels' },
        { emoji: '🚗', label: 'Transport', to: '/transport' },
        { emoji: '🤖', label: 'AI Trip Planner', to: '/trip-planner' },
        { emoji: '📖', label: 'Travel Stories', to: '/stories' },
    ];

    const supportLinks = [
        { label: 'About Us', to: '/contact' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'Careers', to: '/careers' },
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'List Your Property', to: '/partner/hotel-onboarding' },
    ];

    const socialLinks = [
        { icon: InstagramIcon, href: 'https://instagram.com/infinite.yatra', title: 'Instagram', hoverBg: 'hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#e6683c] hover:to-[#dc2743]' },
        { icon: WhatsAppIcon, href: 'https://whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08', title: 'WhatsApp', hoverBg: 'hover:bg-[#25D366]' },
        { icon: XIcon, href: 'https://x.com/infiniteyatra', title: 'X', hoverBg: 'hover:bg-black hover:text-white' },
        { icon: YouTubeIcon, href: 'https://www.youtube.com/channel/UCdWYIKLuKMh_hZIJleWajdg', title: 'YouTube', hoverBg: 'hover:bg-[#FF0000]' },
    ];


    return (
        <footer id="site-footer">
            {/* ═══════════ SECTION 2: Main Footer Body ═══════════ */}
            <div style={{ backgroundColor: '#0d0d0d' }}>
                {/* Gradient top border */}
                <div className="h-px w-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB]" />

                <div className="container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">

                        {/* ── Column 1: Brand ── */}
                        <div className="space-y-6">
                            <div className="w-max">
                                <h3
                                    className="text-2xl font-black tracking-[0.2em] text-white text-center"
                                    style={{ fontFamily: "'Raleway', sans-serif" }}
                                >
                                    INFINITE YATRA
                                </h3>
                                <span
                                    className="text-[10px] tracking-[0.3em] font-extrabold text-white/80 block w-full text-center"
                                    style={{ fontFamily: "'Raleway', sans-serif" }}
                                >
                                    EXPLORE INFINITE
                                </span>
                            </div>

                            {/* Contact Card */}
                            <div className="mt-6 p-4 w-max rounded-xl bg-[#1a1a1a] border border-[#222] space-y-3">
                                <a href="tel:+919265799325" className="flex items-center gap-3 text-[#888] text-sm hover:text-white transition-colors">
                                    <Phone size={16} className="text-[#7C3AED] shrink-0" />
                                    <span>+91 9265799325</span>
                                </a>
                                <a href="mailto:info@infiniteyatra.com" className="flex items-center gap-3 text-[#888] text-sm hover:text-white transition-colors">
                                    <Mail size={16} className="text-[#2563EB] shrink-0" />
                                    <span>info@infiniteyatra.com</span>
                                </a>
                                <a
                                    href="https://wa.me/919265799325"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 mt-1 rounded-full border border-green-500/40 text-green-400 text-xs font-medium hover:bg-green-500/10 transition-all duration-200"
                                >
                                    💬 Chat on WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* ── Column 2: Explore ── */}
                        <div>
                            <SectionHeading>Explore</SectionHeading>
                            <ul className="space-y-3">
                                {exploreLinks.map((link) => (
                                    <li key={link.label}>
                                        <FooterLink to={link.to}>
                                            <span className="mr-1">{link.emoji}</span> {link.label}
                                        </FooterLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Column 3: Support ── */}
                        <div>
                            <SectionHeading>Support</SectionHeading>
                            <ul className="space-y-3">
                                {supportLinks.map((link) => (
                                    <li key={link.label}>
                                        <FooterLink to={link.to}>{link.label}</FooterLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* ── Column 4: Stay Updated ── */}
                        <div>
                            <SectionHeading>Stay Updated</SectionHeading>
                            <p className="text-[#888] text-[13px] leading-relaxed mb-5">
                                Join best travelers getting weekly trip inspiration, exclusive deals & hidden destinations.
                            </p>

                            <form onSubmit={handleSubscribe} className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    className="w-full bg-[#1a1a1a] text-white px-4 py-3 rounded-xl outline-none border border-[#222]
                                             focus:border-[#7C3AED]/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]
                                             transition-all duration-300 placeholder:text-[#555] text-sm disabled:opacity-50"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success'}
                                    className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300
                                        ${status === 'success'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : status === 'error' || status === 'duplicate'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]'
                                        } disabled:opacity-60`}
                                >
                                    {status === 'loading' ? 'Subscribing...'
                                        : status === 'success' ? '🎉 You\'re in!'
                                            : status === 'duplicate' ? 'Already subscribed! 🙌'
                                                : status === 'error' ? 'Error — Try Again'
                                                    : 'Subscribe'}
                                </button>
                            </form>

                            {/* Social Icons - Connect With Us */}
                            <div className="mt-8">
                                <h4 className="text-white text-center font-bold text-lg mb-6">Connect With Us</h4>
                                <div className="flex items-center justify-center gap-4">
                                    {socialLinks.map((social) => {
                                        const Icon = social.icon;
                                        return (
                                            <a
                                                key={social.title}
                                                href={social.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={social.title}
                                                className={`p-4 rounded-2xl bg-[#111111] border border-[#222222] text-[#888888]
                                                    ${social.hoverBg} hover:text-white hover:border-transparent
                                                    transition-all duration-300 shadow-xl`}
                                            >
                                                <Icon size={24} />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ═══════════ SECTION 4: Bottom Bar ═══════════ */}
            <div style={{ backgroundColor: '#080808' }}>
                <div className="container mx-auto px-6 py-5">
                    {/* Using a grid with 3 columns ensures the center item is always dead center on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center md:text-left">
                        {/* Left */}
                        <div className="flex justify-center md:justify-start">
                            <p className="text-[#666] text-[13px]">© 2026 Infinite Yatra. All rights reserved.</p>
                        </div>

                        {/* Center - Easter Egg */}
                        <div className="flex justify-center relative items-center h-[24px]">
                            <div
                                className="cursor-default select-none relative flex justify-center items-center w-full h-full"
                                onMouseEnter={() => setEasterEggHover(true)}
                                onMouseLeave={() => setEasterEggHover(false)}
                            >
                                {/* Base Text */}
                                <p
                                    className={`transition-opacity whitespace-nowrap text-[14px] absolute inset-y-0 flex items-center justify-center gap-1.5 ${easterEggHover
                                            ? 'opacity-0 pointer-events-none'
                                            : 'opacity-100 text-[#888]'
                                        }`}
                                    style={{
                                        transitionDuration: '300ms',
                                        transitionDelay: easterEggHover ? '0ms' : '300ms',
                                    }}
                                >
                                    today across Earth... tomorrow beyond it.
                                    <button onClick={handleLaunch} className="rocket-float hover:scale-110 transition-transform cursor-pointer" title="Infinite Yatra Space Program">
                                        🚀
                                    </button>
                                </p>

                                {/* Hover Revealing Text & Stars */}
                                <div className="absolute inset-y-0 w-full flex items-center justify-center pointer-events-none">
                                    {/* Stars Background (Appears at 1600ms) */}
                                    <div
                                        className={`absolute inset-0 flex items-center justify-center ${easterEggHover
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                            }`}
                                        style={{
                                            transitionProperty: 'opacity',
                                            transitionDuration: easterEggHover ? '1000ms' : '300ms',
                                            transitionDelay: easterEggHover ? '1600ms' : '0ms',
                                            transitionTimingFunction: 'ease-in-out',
                                            zIndex: 0
                                        }}
                                    >
                                        <div className="relative w-full h-full max-w-[250px]">
                                            <span className="footer-twinkle-star" aria-hidden="true" style={{ top: '25%', right: '10%' }}>✦</span>
                                            <span className="footer-twinkle-star footer-twinkle-star-2" aria-hidden="true" style={{ bottom: '25%', left: '10%' }}>✦</span>
                                        </div>
                                    </div>

                                    {/* Foreground Text */}
                                    <div
                                        className={`whitespace-nowrap text-[15px] flex items-center justify-center gap-2 ${easterEggHover
                                                ? 'opacity-100 pointer-events-auto'
                                                : 'opacity-0 pointer-events-none'
                                            }`}
                                        style={{
                                            transitionProperty: 'opacity',
                                            transitionDuration: '300ms',
                                            transitionDelay: easterEggHover ? '300ms' : '0ms',
                                            transitionTimingFunction: 'ease-in-out',
                                            zIndex: 10
                                        }}
                                    >
                                        <button onClick={handleLaunch} className="rocket-float hover:scale-110 transition-transform cursor-pointer" title="Infinite Yatra Space Program">
                                            🚀
                                        </button>
                                        <button
                                            onClick={handleLaunch}
                                            className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#2563EB] footer-easter-glow hover:opacity-80 transition-opacity"
                                        >
                                            Space Travel — Future Vision
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right */}
                        <div className="flex justify-center md:justify-end items-center gap-2 text-[#666] text-[12px]">
                            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ Cinematic Rocket Launch Overlay ═══════════ */}
            <AnimatePresence>
                {isLaunching && (
                    <motion.div
                        className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Step 1: Background slowly darkens */}
                        <motion.div
                            className="absolute inset-0 bg-black"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.95 }}
                            transition={{ duration: 1.6 }}
                        />

                        {/* Step 3: Space background fade at 1600ms */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-[#020024] via-[#090979] to-[#000000]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.6, duration: 0.4 }}
                        />

                        {/* Step 2: Stars appear at 1000ms */}
                        <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0, duration: 0.5 }}
                        >
                            {stars.map((star, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-white text-[10px]"
                                    style={{
                                        left: star.left,
                                        top: star.top
                                    }}
                                    animate={{ opacity: [0.1, 1, 0.1], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
                                >
                                    ✦
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* The Rocket Container */}
                        <div className="absolute inset-x-0 bottom-0 h-full flex flex-col items-center justify-end pb-20">
                            <motion.div
                                className="relative z-10 flex flex-col items-center"
                                initial={{ y: '20vh' }}
                                animate={{ y: ['20vh', '20vh', '-120vh'] }}
                                transition={{
                                    duration: 2.0,
                                    times: [0, 0.3, 1], // Launch bursts at 600ms
                                    ease: ['easeInOut', 'easeIn']
                                }}
                            >
                                {/* Rocket Emoji (tilts upward) */}
                                <motion.div
                                    className="text-7xl origin-center"
                                    initial={{ scale: 1, rotate: 0 }}
                                    animate={{ scale: [1, 1.2, 1.3], rotate: [0, -45, -45] }}
                                    transition={{ duration: 2.0, times: [0, 0.1, 1] }}
                                >
                                    🚀
                                </motion.div>

                                {/* Engine Fire Effect (Ignition at 200ms) */}
                                <motion.div
                                    className="absolute top-[75%] flex flex-col items-center"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0.8, 1, 0.9, 1],
                                        scale: [0, 1, 0.8, 1.1, 0.9, 1]
                                    }}
                                    transition={{
                                        duration: 1.8,
                                        delay: 0.2, // Ignition starts at 200ms
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <div className="text-5xl -mt-2 animate-pulse" style={{ filter: 'drop-shadow(0 0 10px orange)' }}>🔥</div>

                                    {/* Trail glow */}
                                    <motion.div
                                        className="w-4 h-64 bg-gradient-to-b from-orange-500 via-yellow-400 to-transparent blur-xl rounded-full -mt-4"
                                        initial={{ opacity: 0, scaleY: 0 }}
                                        animate={{ opacity: [0, 0.8, 0.8], scaleY: [0, 1, 1] }}
                                        transition={{ duration: 1.4, delay: 0.6, times: [0, 0.2, 1] }} // Appears solidly at 600ms
                                        style={{ transformOrigin: 'top' }}
                                    />
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;
