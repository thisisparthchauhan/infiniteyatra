import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, Home, Rocket, Compass } from 'lucide-react';
import { trackEvent, trackPageView } from '../utils/analytics';

/* =========================================
   NotFound — branded 404 matching the
   SpaceX-style design language of /future
   and /ascension-project.
========================================= */
const NotFound = () => {
    const location = useLocation();
    const attemptedPath = location.pathname + location.search;

    useEffect(() => {
        trackPageView('/404', '404 — Not Found');
        trackEvent('page_not_found', { path: attemptedPath });
    }, [attemptedPath]);

    return (
        <>
            <Helmet>
                <title>Lost in Space — 404 · Infinite Yatra</title>
                {/* Tell crawlers not to index 404 results */}
                <meta name="robots" content="noindex, follow" />
                <meta name="description" content="The page you were looking for could not be found." />
                <meta name="theme-color" content="#000000" />
            </Helmet>

            <div
                className="fixed inset-0 z-[60] bg-black text-white overflow-y-auto antialiased flex flex-col"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
            >
                {/* Subtle radial glow */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0"
                        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
                    <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
                </div>

                {/* Top nav strip */}
                <nav className="relative z-10 px-6 md:px-16 lg:px-24 h-[60px] md:h-[68px] flex items-center">
                    <Link to="/" className="flex flex-col items-center group">
                        <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-[13px] tracking-[2.5px] text-white">
                            INFINITE YATRA
                        </span>
                        <span className="font-mono text-[10px] tracking-[3px] text-white/55 mt-0.5">
                            EXPLORE INFINITE
                        </span>
                    </Link>
                </nav>

                {/* Main content */}
                <main className="relative z-10 flex-1 px-6 md:px-16 lg:px-24 py-12 md:py-24 flex flex-col justify-center">
                    <div className="max-w-7xl mx-auto w-full">

                        {/* Section label */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-3 mb-12"
                        >
                            <span className="font-mono text-[13px] text-white/55 tracking-[2px]">ERR</span>
                            <div className="w-8 h-[1px] bg-white/20" />
                            <span className="font-mono text-[13px] text-white/60 tracking-[3px]">SIGNAL LOST</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[0.95] tracking-tight mb-6 max-w-full"
                            style={{
                                fontSize: 'clamp(48px, 12vw, 180px)',
                                overflowWrap: 'normal',
                                wordBreak: 'keep-all'
                            }}
                        >
                            404<br />Lost in<br />Space.
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="text-white/65 text-base md:text-lg leading-relaxed font-light max-w-2xl mb-4"
                        >
                            The page you tried to reach is not on this mission's flight plan. It may have been moved, renamed, or never existed in this universe.
                        </motion.p>

                        {/* Attempted path */}
                        {attemptedPath && attemptedPath !== '/' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.7, delay: 0.45 }}
                                className="border-l-2 border-white/15 pl-4 mb-12 max-w-2xl"
                            >
                                <p className="font-mono text-[10px] tracking-[2px] text-white/55 uppercase mb-1">Requested</p>
                                <p className="font-mono text-[13px] text-white/65 break-all">{attemptedPath}</p>
                            </motion.div>
                        )}

                        {/* Three primary destinations */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                            className="grid sm:grid-cols-3 gap-px bg-white/10 max-w-4xl mb-12"
                        >
                            <Link to="/"
                                className="group bg-black p-6 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                                <div className="flex items-center justify-between mb-3">
                                    <Home size={16} aria-hidden="true" className="text-white/55" />
                                    <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </div>
                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-base text-white tracking-wider uppercase mb-1">Home</p>
                                <p className="text-white/55 text-xs leading-relaxed font-light">Return to Earth — the main site.</p>
                            </Link>

                            <Link to="/future"
                                className="group bg-black p-6 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                                <div className="flex items-center justify-between mb-3">
                                    <Rocket size={16} aria-hidden="true" className="text-white/55" />
                                    <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </div>
                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-base text-white tracking-wider uppercase mb-1">Future</p>
                                <p className="text-white/55 text-xs leading-relaxed font-light">The Infinite Yatra Space Program.</p>
                            </Link>

                            <Link to="/ascension-project"
                                className="group bg-black p-6 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                                <div className="flex items-center justify-between mb-3">
                                    <Compass size={16} aria-hidden="true" className="text-white/55" />
                                    <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </div>
                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-base text-white tracking-wider uppercase mb-1">Ascension</p>
                                <p className="text-white/55 text-xs leading-relaxed font-light">Read the founder document.</p>
                            </Link>
                        </motion.div>

                        {/* Quote / signature line */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.85 }}
                            className="font-mono text-[11px] italic text-white/55 tracking-[2px] uppercase max-w-2xl"
                        >
                            "Not every wrong turn ends a journey. Some begin one."
                        </motion.p>
                    </div>
                </main>

                {/* Footer strip */}
                <footer className="relative z-10 border-t border-white/10">
                    <div className="px-6 md:px-16 lg:px-24 py-6">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
                            <p className="font-mono text-[10px] tracking-[2px] text-white/55 uppercase">
                                Status · 404 · Resource Not Found
                            </p>
                            <p className="font-mono text-[10px] italic tracking-[2px] text-white/55 uppercase">
                                You can always return to where you began
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default NotFound;
