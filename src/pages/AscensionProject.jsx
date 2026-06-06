import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Menu, X, ChevronDown, Mail, Share2, Check, AlertCircle, Send, Printer } from 'lucide-react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { trackEvent, trackPageView, createScrollDepthTracker } from '../utils/analytics';

/* ─────────────────────────────────────────────
   FADE-IN ANIMATION (subtle, no slide)
───────────────────────────────────────────── */
const FadeIn = ({ children, delay = 0, y = 24, className = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/* ─────────────────────────────────────────────
   SECTION LABEL — small uppercase numbered tag
───────────────────────────────────────────── */
const SectionLabel = ({ number, text }) => (
    <FadeIn>
        <div className="flex items-center gap-3 mb-8">
            <span className="font-mono text-[13px] text-white/60 tracking-[2px]">{number}</span>
            <div className="w-8 h-[1px] bg-white/20" />
            <span className="font-mono text-[13px] text-white/60 tracking-[3px] uppercase">{text}</span>
        </div>
    </FadeIn>
);

/* ─────────────────────────────────────────────
   SECTION HEADING — large editorial
───────────────────────────────────────────── */
const SectionHeading = ({ children, className = '', delay = 0.1 }) => (
    <FadeIn delay={delay}>
        <h2 className={`font-['SpaceX',_'Helvetica_Neue',_'Inter',_sans-serif] font-bold text-white leading-[1.05] tracking-tight uppercase max-w-full ${className}`}
            style={{
                /* IMPORTANT: keep words whole. Never use hyphens:auto or wordBreak:break-word on
                   display headings — produces ugly "MULTIPLAN-ETARY" mid-word splits on mobile.
                   Mobile size is small enough that even long words ("MULTIPLANETARY",
                   "CIVILIZATIONALLY") fit inside the container. */
                fontSize: 'clamp(22px, 3.8vw, 56px)',
                overflowWrap: 'normal',
                wordBreak: 'normal',
                hyphens: 'none'
            }}>
            {children}
        </h2>
    </FadeIn>
);

/* ─────────────────────────────────────────────
   SECTION CONTAINER
───────────────────────────────────────────── */
const Section = ({ id, children, className = '', ...rest }) => (
    <section id={id} className={`relative px-6 md:px-16 lg:px-24 py-20 md:py-40 ${className}`} {...rest}>
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
    </section>
);

/* ─────────────────────────────────────────────
   HORIZONTAL RULE — hairline
───────────────────────────────────────────── */
const Rule = () => (
    <div className="px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto h-[1px] bg-white/10" />
    </div>
);

/* ─────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────── */
const NAV_SECTIONS = [
    { id: 'hero', label: 'Overview', num: '00' },
    { id: 'purpose', label: 'Purpose', num: '01' },
    { id: 'vision', label: 'Vision', num: '02' },
    { id: 'principles', label: 'Principles', num: '03' },
    { id: 'beliefs', label: 'Beliefs', num: '04' },
    { id: 'ai', label: 'AI Philosophy', num: '05' },
    { id: 'contribution', label: 'Contribution', num: '06' },
    { id: 'founder', label: 'Founder', num: '07' },
    { id: 'roadmap', label: 'Research', num: '08' },
    { id: 'civilization', label: 'Civilization', num: '09' },
    { id: 'success', label: 'Criteria', num: '10' },
    { id: 'future', label: 'Future', num: '11' },
    { id: 'manifesto', label: 'Manifesto', num: '12' },
    { id: 'get-involved', label: 'Get Involved', num: '13' },
];

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const AscensionProject = () => {
    const [navOpen, setNavOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');

    // ── Scroll progress (smooth-spring linked to scrollYProgress)
    const { scrollYProgress } = useScroll();
    const progressScaleX = useSpring(scrollYProgress, {
        stiffness: 140,
        damping: 28,
        restDelta: 0.001,
    });

    // ── Get-Involved form state
    const [email, setEmail] = useState('');
    const [intent, setIntent] = useState('subscribe'); // subscribe | contribute | apply
    const [submitState, setSubmitState] = useState('idle'); // idle | sending | success | error
    const [shareCopied, setShareCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setSubmitState('error');
            trackEvent('signup_validation_error', { intent });
            return;
        }
        setSubmitState('sending');
        try {
            await addDoc(collection(db, 'ascension_signups'), {
                email: email.trim().toLowerCase(),
                intent,
                source: 'ascension-project',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                createdAt: serverTimestamp(),
            });
            setSubmitState('success');
            setEmail('');
            trackEvent('signup_success', { intent });
        } catch (err) {
            console.error('Ascension signup failed:', err);
            setSubmitState('error');
            trackEvent('signup_error', { intent, message: String(err?.message || err) });
        }
    };

    const handlePrint = () => {
        trackEvent('print_pdf', { page: 'ascension' });
        if (typeof window !== 'undefined') window.print();
    };

    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'The Ascension Project — Humanity\'s Next Frontier',
                    text: 'A long-term initiative for exploration, knowledge, AI, and civilization development.',
                    url,
                });
                trackEvent('share_native', { page: 'ascension' });
            } else {
                await navigator.clipboard.writeText(url);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
                trackEvent('share_copy_link', { page: 'ascension' });
            }
        } catch (err) {
            /* user cancelled — silent */
        }
    };

    const scrollTo = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update URL immediately so the new hash is shareable, but use
            // replaceState so we don't pollute browser history with one entry
            // per section click.
            const newHash = id === 'hero' ? '' : `#${id}`;
            if (typeof window !== 'undefined' && window.location.hash !== newHash) {
                window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
            }
            trackEvent('section_navigate', { source: 'menu', section: id });
        }
        setNavOpen(false);
    }, []);

    // On initial mount, if the URL has a #section hash, jump there once the DOM is ready
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const initialHash = window.location.hash.replace('#', '');
        if (!initialHash) return;
        // Wait one tick so all sections are mounted with their scroll-margin-top set
        const id = window.setTimeout(() => {
            const el = document.getElementById(initialHash);
            if (el) {
                el.scrollIntoView({ behavior: 'instant' in window ? 'instant' : 'auto', block: 'start' });
            }
        }, 50);
        return () => window.clearTimeout(id);
    }, []);

    useEffect(() => {
        const handler = () => {
            setScrolled(window.scrollY > 20);
            const offsets = NAV_SECTIONS.map(s => {
                const el = document.getElementById(s.id);
                if (!el) return { id: s.id, top: Infinity };
                return { id: s.id, top: Math.abs(el.getBoundingClientRect().top - 80) };
            });
            const closest = offsets.reduce((a, b) => a.top < b.top ? a : b);
            setActiveSection(prev => {
                if (prev === closest.id) return prev;
                // Sync URL hash to current section as user scrolls — replaceState
                // so the back button still leaves the page, not just the section.
                const newHash = closest.id === 'hero' ? '' : `#${closest.id}`;
                if (typeof window !== 'undefined' && window.location.hash !== newHash) {
                    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
                }
                return closest.id;
            });
        };
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Respond to browser back/forward (popstate) — if user navigates to a
    // historical hash, scroll there.
    useEffect(() => {
        const onPopState = () => {
            const hash = window.location.hash.replace('#', '');
            if (!hash) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    // ── Slide-out menu accessibility ──
    // Refs for focus management
    const menuTriggerRef = useRef(null);
    const menuPanelRef = useRef(null);

    // Close menu on Escape key + trap focus inside the menu while it's open
    useEffect(() => {
        if (!navOpen) return;

        const previouslyFocused = document.activeElement;

        // Auto-focus the first interactive element inside the panel on next tick
        const focusFirst = window.setTimeout(() => {
            const panel = menuPanelRef.current;
            if (!panel) return;
            const focusable = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusable?.focus();
        }, 50);

        const onKey = (e) => {
            if (e.key === 'Escape') {
                setNavOpen(false);
                return;
            }
            if (e.key !== 'Tab') return;

            // Focus trap — keep Tab cycling within the open panel
            const panel = menuPanelRef.current;
            if (!panel) return;
            const focusables = Array.from(panel.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter((el) => el.offsetParent !== null);
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKey);

        // Lock body scroll while menu is open — prevents background page
        // scrolling under the modal on iOS
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.clearTimeout(focusFirst);
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
            // Restore focus to whatever opened the menu (typically the trigger)
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, [navOpen]);

    // ── Analytics: page_view + scroll depth ──
    useEffect(() => {
        trackPageView('/ascension-project', 'The Ascension Project');
        const trackDepth = createScrollDepthTracker('ascension-project');
        const onScroll = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max > 0) trackDepth(Math.round((window.scrollY / max) * 100));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Analytics: when active section changes (read milestones) ──
    useEffect(() => {
        trackEvent('section_view', { page: 'ascension', section: activeSection });
    }, [activeSection]);

    return (
        <>
            <Helmet>
                <title>The Ascension Project — Humanity's Next Frontier</title>
                <meta name="description" content="A long-term initiative focused on exploration, knowledge, AI, research, civilization development, and humanity's future beyond a single world. Founded by Arius Raynott." />
                <link rel="canonical" href="https://www.infiniteyatra.com/ascension-project" />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="Infinite Yatra" />
                <meta property="og:url" content="https://www.infiniteyatra.com/ascension-project" />
                <meta property="og:title" content="The Ascension Project — Humanity's Next Frontier" />
                <meta property="og:description" content="A multi-century initiative for exploration, knowledge, AI, and civilization development — beyond a single world." />
                <meta property="og:image" content="https://www.infiniteyatra.com/og/ascension.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="The Ascension Project — founder document cover with the title set in editorial type." />
                <meta property="article:author" content="Arius Raynott" />
                <meta property="article:published_time" content="2026-01-01T00:00:00Z" />

                {/* Twitter / X */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="The Ascension Project" />
                <meta name="twitter:description" content="Humanity's next frontier — a multi-century initiative founded by Arius Raynott." />
                <meta name="twitter:image" content="https://www.infiniteyatra.com/og/ascension.png" />

                {/* Theme color */}
                <meta name="theme-color" content="#000000" />

                {/* JSON-LD: Article schema for richer search results */}
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": "The Ascension Project — Humanity's Next Frontier",
                    "description": "A long-term initiative focused on exploration, knowledge, AI, research, civilization development, and humanity's future beyond a single world.",
                    "image": "https://www.infiniteyatra.com/og/ascension.png",
                    "datePublished": "2026-01-01",
                    "dateModified": "2026-01-01",
                    "author": {
                        "@type": "Person",
                        "name": "Arius Raynott",
                        "jobTitle": "Founder"
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "Infinite Yatra",
                        "url": "https://www.infiniteyatra.com"
                    },
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": "https://www.infiniteyatra.com/ascension-project"
                    }
                })}</script>

                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Helmet>

            {/* Print stylesheet — inverts theme to black-on-white, hides UI chrome, makes typography document-ready */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 18mm 16mm; }
                    html, body { background: #fff !important; color: #111 !important; }
                    [data-page="ascension"] { background: #fff !important; color: #111 !important; min-height: auto !important; }
                    [data-page="ascension"] * { color: #111 !important; background: transparent !important; box-shadow: none !important; }

                    /* Hide screen-only UI */
                    [data-page="ascension"] nav,
                    [data-page="ascension"] footer,
                    [data-page="ascension"] [data-print="hide"] {
                        display: none !important;
                    }

                    /* Borders become grey hairlines instead of white-on-black */
                    [data-page="ascension"] [class*="border-white"] { border-color: #ccc !important; }
                    [data-page="ascension"] [class*="bg-white"]:not(button) { background: transparent !important; }

                    /* Sections — make sure each section breaks cleanly */
                    [data-page="ascension"] section {
                        page-break-inside: avoid;
                        break-inside: avoid;
                        padding: 0 0 18mm 0 !important;
                        scroll-margin-top: 0 !important;
                    }
                    [data-page="ascension"] section h2 { page-break-after: avoid; break-after: avoid; }

                    /* Typography for paper */
                    [data-page="ascension"] h1 { font-size: 36pt !important; line-height: 1.05 !important; }
                    [data-page="ascension"] h2 { font-size: 22pt !important; line-height: 1.1 !important; margin-bottom: 8mm !important; }
                    [data-page="ascension"] h3 { font-size: 14pt !important; }
                    [data-page="ascension"] p, [data-page="ascension"] li { font-size: 11pt !important; line-height: 1.55 !important; }
                    [data-page="ascension"] .font-mono { font-size: 8pt !important; letter-spacing: 1px !important; }

                    /* Hide decorative background visuals */
                    [data-page="ascension"] canvas,
                    [data-page="ascension"] [aria-hidden="true"][role="presentation"] {
                        display: none !important;
                    }
                }
            `}</style>

            <div
                data-page="ascension"
                className="bg-black text-white min-h-screen relative overflow-x-hidden antialiased"
                style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif"
                }}
            >
                {/* Skip to content — keyboard / screen reader users */}
                <a
                    href="#hero"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[300] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:text-[12px] focus:tracking-[2px] focus:uppercase focus:font-medium"
                >
                    Skip to content
                </a>

                {/* ── Scroll progress bar — sits above the fixed navbar ── */}
                <motion.div
                    aria-hidden="true"
                    data-print="hide"
                    style={{ scaleX: progressScaleX, transformOrigin: '0% 50%' }}
                    className="fixed top-0 left-0 right-0 h-[2px] bg-white/85 z-[110] pointer-events-none"
                />

                {/* ── Subtle Background Texture ── */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0"
                        style={{
                            background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)'
                        }} />
                    {/* Grain noise effect via SVG */}
                    <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }} />
                </div>

                {/* ══════════════════════════════════════════
                    NAV BAR — SpaceX style
                ══════════════════════════════════════════ */}
                <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/[0.06]' : 'bg-transparent'}`}>
                    <div className="px-4 md:px-12 h-[60px] md:h-[68px] flex items-center justify-between">
                        <Link to="/future"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1"
                            aria-label="Back to Future page">
                            <ArrowLeft size={14} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1" />
                            <span className="font-medium text-[13px] tracking-[2px] uppercase">Future</span>
                        </Link>

                        {/* Centered title — hidden on small screens to prevent overlap */}
                        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-[13px] tracking-[3px] text-white uppercase whitespace-nowrap">
                                The Ascension Project
                            </p>
                        </div>

                        <button
                            ref={menuTriggerRef}
                            onClick={() => setNavOpen(true)}
                            className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-1"
                            aria-label="Open navigation menu"
                            aria-expanded={navOpen}
                            aria-controls="ascension-nav-panel"
                        >
                            <span className="hidden md:inline font-medium text-[13px] tracking-[2px] uppercase">Menu</span>
                            <Menu size={18} aria-hidden="true" />
                        </button>
                    </div>
                </nav>

                {/* ── Slide-out Nav Overlay ── */}
                <AnimatePresence>
                    {navOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200]"
                                onClick={() => setNavOpen(false)}
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                ref={menuPanelRef}
                                id="ascension-nav-panel"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Navigation menu"
                                className="fixed top-0 right-0 h-screen w-full md:w-[480px] bg-black border-l border-white/10 z-[201] p-10 overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-16">
                                    <p className="font-mono text-[13px] tracking-[3px] text-white/60 uppercase">Index</p>
                                    <button onClick={() => setNavOpen(false)}
                                        className="text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                                        aria-label="Close menu">
                                        <X size={22} aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {NAV_SECTIONS.map((s, i) => (
                                        <motion.button
                                            key={s.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                            onClick={() => scrollTo(s.id)}
                                            className={`group w-full flex items-center justify-between py-4 border-b border-white/10 transition-all ${activeSection === s.id ? 'text-white' : 'text-white/50 hover:text-white'}`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <span className="font-mono text-[13px] tracking-[2px] text-white/55">{s.num}</span>
                                                <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-xl tracking-tight uppercase">{s.label}</span>
                                            </div>
                                            <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ══════════════════════════════════════════
                    HERO SECTION — Full-bleed black, content bottom-left
                ══════════════════════════════════════════ */}
                <section id="hero" className="relative min-h-screen flex flex-col justify-end overflow-hidden">
                    {/* Subtle radial glow */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0"
                            style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
                    </div>

                    {/* Centered countdown-style top text */}
                    <div className="absolute top-[100px] left-0 w-full text-center">
                        <FadeIn delay={0.3}>
                            <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase">
                                Founder Document · Initiated 2026
                            </p>
                        </FadeIn>
                    </div>

                    {/* Bottom content area */}
                    <div className="relative z-10 px-6 md:px-16 lg:px-24 pb-12 md:pb-32">
                        <div className="max-w-7xl mx-auto">
                            <FadeIn delay={0.5}>
                                <p className="font-mono text-[13px] tracking-[2.5px] text-white/50 uppercase mb-6">
                                    00 — Mission
                                </p>
                            </FadeIn>

                            <FadeIn delay={0.7}>
                                <h1 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[0.95] tracking-tight uppercase mb-6 md:mb-8 max-w-full"
                                    style={{
                                        fontSize: 'clamp(30px, 8.5vw, 140px)',
                                        overflowWrap: 'normal',
                                        wordBreak: 'keep-all'
                                    }}>
                                    The<br />Ascension<br />Project
                                </h1>
                            </FadeIn>

                            <FadeIn delay={0.9}>
                                <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl">
                                    <p className="text-white/70 text-lg md:text-xl leading-relaxed font-light">
                                        Humanity's next frontier. A long-term initiative focused on exploration, knowledge, artificial intelligence, research, and civilization development — beyond a single world.
                                    </p>
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <span className="font-mono text-[13px] tracking-[2px] text-white/60 uppercase">Founder</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm tracking-wider uppercase">Arius Raynott</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <span className="font-mono text-[13px] tracking-[2px] text-white/60 uppercase">Horizon</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm tracking-wider uppercase">Multi-Century</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <span className="font-mono text-[13px] tracking-[2px] text-white/60 uppercase">Status</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
                    >
                        <span className="font-mono text-[13px] tracking-[3px] text-white/60 uppercase">Scroll</span>
                        <ChevronDown size={12} className="text-white/60" aria-hidden="true" />
                    </motion.div>
                </section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 01 — PURPOSE
                ══════════════════════════════════════════ */}
                <Section id="purpose">
                    <SectionLabel number="01" text="Purpose" />
                    <div className="grid md:grid-cols-12 gap-8 md:gap-12">
                        <div className="md:col-span-7 min-w-0">
                            <SectionHeading className="mb-8">
                                Why we exist.
                            </SectionHeading>
                            <FadeIn delay={0.2}>
                                <p className="text-white/70 text-lg leading-relaxed font-light mb-6">
                                    The Ascension Project exists because humanity cannot afford to remain a single-world species. The arc of civilizations has always bent toward expansion — but expansion without intention creates collapse.
                                </p>
                                <p className="text-white/60 text-base leading-relaxed font-light">
                                    We are not building a company. We are not creating a brand. We are answering a question that every generation before us has asked and none has been equipped to answer: what comes after Earth?
                                </p>
                            </FadeIn>
                        </div>
                        <div className="md:col-span-5 md:pl-8 md:border-l md:border-white/10">
                            <FadeIn delay={0.3}>
                                <div className="space-y-8 md:pt-2">
                                    {[
                                        { label: 'Core Drive', value: 'Ensure humanity\'s long-term survival and flourishing' },
                                        { label: 'Primary Method', value: 'Systematic expansion of knowledge, AI, and civilization' },
                                        { label: 'Operating Principle', value: 'Build for centuries, not quarters' },
                                        { label: 'Founding Question', value: 'What must be true for humanity to thrive 500 years from now?' },
                                    ].map((item, i) => (
                                        <div key={i}>
                                            <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase mb-2">{item.label}</p>
                                            <p className="text-white/80 text-sm leading-relaxed font-light">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 02 — VISION
                ══════════════════════════════════════════ */}
                <Section id="vision">
                    <SectionLabel number="02" text="Vision" />
                    <SectionHeading className="mb-16 max-w-5xl">
                        A multiplanetary, intellectually sovereign, civilizationally resilient humanity.
                    </SectionHeading>

                    <div className="grid md:grid-cols-3 gap-px bg-white/10">
                        {[
                            {
                                num: '01',
                                title: 'Multiplanetary',
                                desc: 'Human presence, governance, culture, and knowledge established across multiple worlds — not as colonies, but as sovereign civilizations with shared heritage.'
                            },
                            {
                                num: '02',
                                title: 'Sovereign',
                                desc: 'Every human, regardless of origin, equipped with the tools and access to contribute meaningfully to the advancement of knowledge and capability.'
                            },
                            {
                                num: '03',
                                title: 'Resilient',
                                desc: 'No single point of failure for the human species. Knowledge, genetics, culture, and governance preserved and distributed across space and time.'
                            },
                        ].map((p, i) => (
                            <FadeIn key={i} delay={0.1 * i}>
                                <div className="bg-black p-10 h-full">
                                    <p className="font-mono text-[12px] tracking-[3px] text-white/55 uppercase mb-8">{p.num}</p>
                                    <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-2xl text-white tracking-tight uppercase mb-4">{p.title}</h3>
                                    <p className="text-white/60 text-sm leading-relaxed font-light">{p.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 03 — PRINCIPLES
                ══════════════════════════════════════════ */}
                <Section id="principles">
                    <SectionLabel number="03" text="Core Principles" />
                    <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-20">
                        <div className="md:col-span-6 min-w-0">
                            <SectionHeading>How we operate.</SectionHeading>
                        </div>
                        <div className="md:col-span-6 md:pt-4">
                            <FadeIn delay={0.2}>
                                <p className="text-white/60 text-base leading-relaxed font-light">
                                    These principles govern every decision made under The Ascension Project — from research priorities to resource allocation, from hiring to public communication. They are non-negotiable.
                                </p>
                            </FadeIn>
                        </div>
                    </div>

                    <div className="border-t border-white/10">
                        {[
                            { title: 'Long-Arc Thinking', desc: 'Every initiative is evaluated against its impact over decades and centuries, not years.' },
                            { title: 'Open Knowledge', desc: 'Knowledge generated through this project belongs to humanity. Research findings are publicly accessible.' },
                            { title: 'Ethical Boundaries', desc: 'Expansion without ethics is conquest. Every initiative is held to strict ethical review.' },
                            { title: 'Radical Execution', desc: 'Vision without execution is hallucination. Extreme bias toward tangible action and honest accountability.' },
                            { title: 'Collective Authorship', desc: 'This is not a monument to one person. The project is designed to outlive its founder.' },
                            { title: 'Mission Primacy', desc: 'Commercial interests and political pressures may not override the core mission.' },
                        ].map((p, i) => (
                            <FadeIn key={i} delay={0.05 * i}>
                                <div className="grid grid-cols-12 gap-6 py-8 border-b border-white/10 group hover:bg-white/[0.02] transition-colors duration-300 px-2">
                                    <div className="col-span-1">
                                        <p className="font-mono text-[12px] tracking-[2px] text-white/55">0{i + 1}</p>
                                    </div>
                                    <div className="col-span-11 md:col-span-4">
                                        <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-xl md:text-2xl text-white tracking-tight uppercase">{p.title}</h3>
                                    </div>
                                    <div className="col-span-12 md:col-span-7">
                                        <p className="text-white/60 text-base leading-relaxed font-light">{p.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 04 — BELIEFS
                ══════════════════════════════════════════ */}
                <Section id="beliefs">
                    <SectionLabel number="04" text="Core Beliefs" />
                    <SectionHeading className="mb-16 max-w-4xl">
                        What we hold to be true.
                    </SectionHeading>

                    <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
                        {[
                            'Humanity is not the end product of evolution — it is an early prototype.',
                            'Intelligence, whether biological or synthetic, has an obligation to expand into the universe.',
                            'Civilizations that do not grow eventually collapse. Stagnation is a form of extinction.',
                            'The resources of a single planet are insufficient to support an advanced, long-lived civilization.',
                            'Knowledge is the only non-depletable resource humanity has ever discovered.',
                            'The greatest threats to humanity are not external — they are internal.',
                            'AI is not humanity\'s replacement. It is humanity\'s most powerful instrument — if developed with wisdom.',
                            'The universe is indifferent to intelligence. That indifference is an opportunity.',
                            'Every generation that delays the work of expansion pays compound interest in risk.',
                            'The future is not something that happens to us. It is something we construct.',
                        ].map((belief, i) => (
                            <FadeIn key={i} delay={0.04 * i}>
                                <div className="flex gap-6 group">
                                    <span className="font-mono text-[13px] text-white/55 tracking-[2px] pt-1 flex-shrink-0 w-8">{String(i + 1).padStart(2, '0')}</span>
                                    <p className="text-white/80 text-base md:text-lg leading-relaxed font-light group-hover:text-white transition-colors duration-300">{belief}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 05 — AI PHILOSOPHY
                ══════════════════════════════════════════ */}
                <Section id="ai">
                    <SectionLabel number="05" text="AI Philosophy" />

                    {/* Title full-width to fit the long word "intelligence" */}
                    <SectionHeading className="mb-12 max-w-5xl">
                        On artificial intelligence.
                    </SectionHeading>

                    <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-20">
                        <div className="md:col-span-7 min-w-0">
                            <FadeIn delay={0.2}>
                                <p className="text-white/70 text-lg leading-relaxed font-light mb-6">
                                    AI is the most consequential technology in human history. It is also the most misunderstood. We treat it as a co-evolutionary partner — something that will fundamentally transform what it means to be human.
                                </p>
                            </FadeIn>
                        </div>
                        <div className="md:col-span-5 min-w-0">
                            <FadeIn delay={0.3}>
                                <p className="text-white/50 text-base leading-relaxed font-light">
                                    Our philosophy is built on three convictions: intelligence is a spectrum; alignment is a civilization-scale project; AI governance must be democratic.
                                </p>
                            </FadeIn>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-px bg-white/10">
                        {[
                            { title: 'Intelligence as a Spectrum', desc: 'We do not draw hard lines between human and machine intelligence. We map the spectrum without fear or worship.' },
                            { title: 'Alignment as a Civilization Project', desc: 'Aligning AI with human values is not a technical problem. It is philosophical, ethical, and political.' },
                            { title: 'Democratic Governance', desc: 'AI decisions must not be made by a small group of engineers or corporations. We advocate for broad participation.' },
                            { title: 'AI for Expansion', desc: 'We develop AI to accelerate humanity\'s capacity for exploration and civilization-building — not to automate humans out of significance.' },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={0.1 * i}>
                                <div className="bg-black p-10 h-full">
                                    <p className="font-mono text-[12px] tracking-[3px] text-white/55 uppercase mb-6">0{i + 1}</p>
                                    <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-xl text-white tracking-tight uppercase mb-4">{item.title}</h3>
                                    <p className="text-white/60 text-sm leading-relaxed font-light">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 06 — CONTRIBUTION
                ══════════════════════════════════════════ */}
                <Section id="contribution">
                    <SectionLabel number="06" text="Contribution" />
                    <SectionHeading className="mb-16 max-w-4xl">
                        Who builds this and how.
                    </SectionHeading>

                    <FadeIn delay={0.1}>
                        <p className="text-white/60 text-base md:text-lg leading-relaxed font-light max-w-3xl mb-16">
                            The Ascension Project is not built by a single team or funded by a single source. It is built by intentional contributions from individuals and institutions who understand that the work is larger than any one of them.
                        </p>
                    </FadeIn>

                    <div className="grid md:grid-cols-4 gap-px bg-white/10">
                        {[
                            { role: 'Researchers', desc: 'Scientists, academics, and independent researchers who contribute primary work in physics, biology, AI, and sociology.' },
                            { role: 'Engineers', desc: 'Technical builders who translate research into systems, infrastructure, tools, and technologies.' },
                            { role: 'Thinkers', desc: 'Philosophers, strategists, historians, and futurists who shape the intellectual framework of the project.' },
                            { role: 'Supporters', desc: 'Individuals and organizations who provide resources, networks, and amplification — belief is contribution.' },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={0.08 * i}>
                                <div className="bg-black p-8 h-full">
                                    <p className="font-mono text-[12px] tracking-[3px] text-white/55 uppercase mb-6">0{i + 1}</p>
                                    <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-lg text-white tracking-tight uppercase mb-3">{item.role}</h3>
                                    <p className="text-white/55 text-sm leading-relaxed font-light">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 07 — FOUNDER
                ══════════════════════════════════════════ */}
                <Section id="founder">
                    <SectionLabel number="07" text="Founder Responsibilities" />
                    <div className="grid md:grid-cols-12 gap-12">
                        <div className="md:col-span-7 min-w-0">
                            <SectionHeading className="mb-8">
                                The obligations of Arius Raynott.
                            </SectionHeading>
                            <FadeIn delay={0.2}>
                                <p className="text-white/60 text-base leading-relaxed font-light mb-10">
                                    The founder holds a position of profound responsibility — not of ownership, but of stewardship. The following obligations are binding for as long as they lead this initiative.
                                </p>
                            </FadeIn>

                            <FadeIn delay={0.3}>
                                <div className="space-y-5">
                                    {[
                                        'Maintain the integrity of the mission above all personal, financial, or political interests',
                                        'Actively recruit and develop successors capable of carrying the project forward independently',
                                        'Remain intellectually honest — acknowledge failure and update beliefs with new evidence',
                                        'Make governance, finances, and decision-making as transparent as operationally possible',
                                        'Never weaponize the project\'s authority for personal advancement or to suppress dissent',
                                        'Model the intellectual and ethical standards the project demands of others',
                                        'Accept that the project is larger than the founder, and act accordingly',
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 py-3 border-b border-white/[0.06]">
                                            <span className="font-mono text-[13px] text-white/55 tracking-[2px] pt-1 flex-shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                                            <p className="text-white/75 text-sm leading-relaxed font-light">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>

                        <div className="md:col-span-5 min-w-0">
                            <FadeIn delay={0.4}>
                                <div className="border border-white/15 p-8">
                                    <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase mb-6">Development Roadmap</p>
                                    <div className="space-y-7">
                                        {[
                                            { phase: '2026–2028', title: 'Foundation', desc: 'Establish core team, define research agenda, launch initial public presence.' },
                                            { phase: '2028–2031', title: 'Infrastructure', desc: 'Build research infrastructure, publish foundational papers, develop AI tools.' },
                                            { phase: '2031–2035', title: 'Delegation', desc: 'Transition operational leadership to distributed teams.' },
                                            { phase: '2035+', title: 'Legacy', desc: 'The project operates independently of its founder.' },
                                        ].map((item, i) => (
                                            <div key={i} className="pb-7 border-b border-white/10 last:border-0 last:pb-0">
                                                <p className="font-mono text-[12px] tracking-[2px] text-white/60 uppercase mb-2">{item.phase}</p>
                                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-base text-white tracking-wider uppercase mb-2">{item.title}</p>
                                                <p className="text-white/55 text-xs leading-relaxed font-light">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 08 — RESEARCH ROADMAP
                ══════════════════════════════════════════ */}
                <Section id="roadmap">
                    <SectionLabel number="08" text="Research Foundation" />
                    <SectionHeading className="mb-8 max-w-5xl">
                        Building the knowledge base.
                    </SectionHeading>
                    <FadeIn delay={0.2}>
                        <p className="font-mono text-[13px] tracking-[3px] text-white/60 uppercase mb-16">2026 — 2035</p>
                    </FadeIn>

                    <div className="space-y-px bg-white/10">
                        {[
                            { phase: 'Phase 0', year: '2026', title: 'Research Architecture', items: ['Define primary research domains: space science, AI alignment, civilization theory', 'Establish the Ascension Research Council — initial 12 founding researchers', 'Launch the open-access Ascension Knowledge Repository', 'Publish the Founding Framework document publicly'] },
                            { phase: 'Phase I', year: '2027–2028', title: 'First Publications', items: ['Release inaugural white papers on multi-world civilization models', 'Publish AI alignment framework v1.0 for public review', 'Launch collaborative partnerships with 3+ universities', 'Begin long-form documentation of human expansion theory'] },
                            { phase: 'Phase II', year: '2029–2031', title: 'Research Expansion', items: ['Scale council to 50+ active contributors globally', 'Launch applied research in propulsion, biopreservation, digital civilization', 'Publish comprehensive Civilization Design Handbook v1', 'Establish first Ascension Research Fellowships'] },
                            { phase: 'Phase III', year: '2032–2035', title: 'Research Maturity', items: ['Research outputs begin influencing policy at institutional levels', 'Knowledge repository reaches 10,000+ curated entries', 'Publish the Ascension Index', 'Transition research governance to independent board'] },
                        ].map((item, i) => (
                            <FadeIn key={i} delay={0.08 * i}>
                                <div className="bg-black px-2 md:px-6 py-12 grid grid-cols-12 gap-6">
                                    <div className="col-span-12 md:col-span-3">
                                        <p className="font-mono text-[12px] tracking-[2px] text-white/60 uppercase mb-2">{item.phase}</p>
                                        <p className="font-mono text-[13px] text-white/50 tracking-[2px]">{item.year}</p>
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-2xl text-white tracking-tight uppercase">{item.title}</h3>
                                    </div>
                                    <div className="col-span-12 md:col-span-6">
                                        <ul className="space-y-3">
                                            {item.items.map((point, j) => (
                                                <li key={j} className="flex gap-3 text-white/65 text-sm leading-relaxed font-light">
                                                    <span className="text-white/55 flex-shrink-0">—</span>
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 09 — CIVILIZATION
                ══════════════════════════════════════════ */}
                <Section id="civilization">
                    <SectionLabel number="09" text="Long-Term Roadmap" />
                    <SectionHeading className="mb-16 max-w-5xl">
                        The multi-century arc.
                    </SectionHeading>

                    <div className="space-y-20">
                        {[
                            {
                                era: 'Near Future', years: '2026 — 2050', title: 'Earth mastery & departure readiness',
                                points: [
                                    'Establish global research and knowledge infrastructure',
                                    'Solve AI alignment at a foundational level',
                                    'Launch first long-duration deep space research missions',
                                    'Develop sustainable life-support for multi-year space habitation',
                                    'Create governance models for off-Earth communities',
                                    'Begin the first permanent human presence beyond Earth orbit',
                                ]
                            },
                            {
                                era: 'Mid Future', years: '2050 — 2150', title: 'Multi-world establishment',
                                points: [
                                    'First self-sustaining settlements on Mars and lunar bodies',
                                    'Distributed civilization governance established and tested',
                                    'Interplanetary communication and culture infrastructure',
                                    'Knowledge transfer systems preserving learning across worlds',
                                    'First generation born off-Earth reaches adulthood',
                                    'Ascension Project transitions into interplanetary institution',
                                ]
                            },
                            {
                                era: 'Long Future', years: '2150 — 2500+', title: 'Civilizational maturity',
                                points: [
                                    'Multiple autonomous human civilizations across the solar system',
                                    'First probe missions to nearest stellar systems launched',
                                    'Human consciousness exists in multiple physical and digital substrates',
                                    'The Ascension Project becomes a historical institution',
                                    'A new framework emerges for interstellar expansion',
                                    'The question asked in 2026 has been answered',
                                ]
                            },
                        ].map((era, i) => (
                            <FadeIn key={i} delay={0.1 * i}>
                                <div className="grid grid-cols-12 gap-8 pb-20 border-b border-white/10 last:border-0">
                                    <div className="col-span-12 md:col-span-3">
                                        <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase mb-2">{era.era}</p>
                                        <p className="font-mono text-[13px] text-white/50 tracking-[2px]">{era.years}</p>
                                    </div>
                                    <div className="col-span-12 md:col-span-9">
                                        <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-2xl md:text-3xl text-white tracking-tight uppercase mb-8 leading-tight">
                                            {era.title}
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                                            {era.points.map((p, j) => (
                                                <div key={j} className="flex gap-3 py-2">
                                                    <span className="text-white/55 text-sm flex-shrink-0">—</span>
                                                    <p className="text-white/65 text-sm leading-relaxed font-light">{p}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 10 — CRITERIA
                ══════════════════════════════════════════ */}
                <Section id="success">
                    <SectionLabel number="10" text="Success & Failure Criteria" />
                    <SectionHeading className="mb-16 max-w-5xl">
                        Defining what we build, and what we must never become.
                    </SectionHeading>

                    <div className="grid md:grid-cols-2 gap-0 border-t border-white/10">
                        <FadeIn delay={0.1}>
                            <div className="md:border-r border-white/10 p-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase">A</p>
                                    <div className="w-8 h-[1px] bg-white/20" />
                                    <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-base text-white tracking-wider uppercase">Success</p>
                                </div>
                                <ul className="space-y-5">
                                    {[
                                        'Humanity has a permanent, self-sustaining presence beyond Earth within 100 years',
                                        'AI has been aligned with human values at a civilizational scale',
                                        'The Knowledge Repository is used by researchers on multiple worlds',
                                        'Governance models developed by this project are adopted by off-Earth settlements',
                                        'Multiple generations grow up with The Ascension Project as normal history',
                                        'Founding documents are studied as primary sources by future historians',
                                        'The founder is eventually irrelevant — the mission has transcended its origin',
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-4">
                                            <span className="font-mono text-[12px] text-white/55 tracking-[2px] pt-1 w-6 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                            <p className="text-white/70 text-sm leading-relaxed font-light">{item}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <div className="p-10 border-t md:border-t-0 border-white/10">
                                <div className="flex items-center gap-4 mb-10">
                                    <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase">B</p>
                                    <div className="w-8 h-[1px] bg-white/20" />
                                    <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-base text-white tracking-wider uppercase">Failure</p>
                                </div>
                                <ul className="space-y-5">
                                    {[
                                        'The project is captured by commercial, political, or ideological interests',
                                        'The founder\'s personal legacy becomes more important than the mission',
                                        'AI development proceeds without ethical and governance frameworks',
                                        'Knowledge is hoarded rather than shared — an instrument of power',
                                        'Internal culture becomes intolerant of dissent, revision, or failure',
                                        'Expansion pursued without ethics and governance investment',
                                        'Humanity remains single-world having had the resources to expand',
                                    ].map((item, i) => (
                                        <li key={i} className="flex gap-4">
                                            <span className="font-mono text-[12px] text-white/55 tracking-[2px] pt-1 w-6 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                            <p className="text-white/70 text-sm leading-relaxed font-light">{item}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 11 — FUTURE
                ══════════════════════════════════════════ */}
                <Section id="future">
                    <SectionLabel number="11" text="Future of Humanity" />
                    <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-20">
                        <div className="md:col-span-7 min-w-0">
                            <SectionHeading className="mb-10">
                                What we believe is possible.
                            </SectionHeading>
                            <FadeIn delay={0.2}>
                                <p className="text-white/70 text-lg leading-relaxed font-light mb-6">
                                    The future of humanity is not written. It is the aggregate of every decision made today by billions of people who mostly cannot see beyond their immediate horizon. The Ascension Project exists to be one of the institutions that looks further.
                                </p>
                                <p className="text-white/55 text-base leading-relaxed font-light">
                                    Within 500 years, if the right choices are made now, humanity will be a species spanning multiple star systems — its intelligence amplified by AI in genuine partnership with consciousness, its civilizations diverse enough to survive any single catastrophe.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="md:col-span-5 min-w-0">
                            <FadeIn delay={0.3}>
                                <div className="border-t border-white/10">
                                    {[
                                        { year: '2050', text: 'First permanent off-Earth communities' },
                                        { year: '2075', text: 'Genuine AI–human collaborative partnership' },
                                        { year: '2100', text: 'First generation born beyond Earth reaches adulthood' },
                                        { year: '2200', text: 'Multiple civilizations span the inner solar system' },
                                        { year: '2400', text: 'First probes reach nearest stellar neighborhood' },
                                        { year: '2500+', text: 'The question of survival answered by expansion' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-6 py-4 border-b border-white/10">
                                            <span className="font-mono text-[13px] text-white/50 tracking-[2px] w-16 flex-shrink-0">{item.year}</span>
                                            <p className="text-white/75 text-sm font-light">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                    </div>

                    <FadeIn delay={0.5}>
                        <div className="border-y border-white/15 py-16 px-8 text-center">
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight"
                                style={{ fontSize: 'clamp(16px, 2.6vw, 36px)' }}>
                                "We do not expand because we can. We expand because we must — because every generation that fails to build the future forces the next one to inherit the consequences of that failure."
                            </p>
                            <p className="font-mono text-[12px] tracking-[2.5px] text-white/60 uppercase mt-8">— The Ascension Project</p>
                        </div>
                    </FadeIn>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 12 — MANIFESTO
                ══════════════════════════════════════════ */}
                <Section id="manifesto" className="text-center">
                    <SectionLabel number="12" text="Closing Manifesto" />

                    <div className="max-w-5xl mx-auto py-12 md:py-20">
                        <FadeIn delay={0.15}>
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white tracking-tight uppercase leading-[0.95] mb-6"
                                style={{ fontSize: 'clamp(28px, 7vw, 110px)' }}>
                                Not a company.
                            </p>
                        </FadeIn>
                        <FadeIn delay={0.25}>
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white tracking-tight uppercase leading-[0.95] mb-6"
                                style={{ fontSize: 'clamp(28px, 7vw, 110px)' }}>
                                Not a brand.
                            </p>
                        </FadeIn>
                        <FadeIn delay={0.35}>
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white/60 tracking-tight uppercase leading-[0.95] mb-20"
                                style={{ fontSize: 'clamp(28px, 7vw, 110px)' }}>
                                A question.
                            </p>
                        </FadeIn>

                        <FadeIn delay={0.5}>
                            <div className="w-16 h-[1px] bg-white/30 mx-auto mb-20" />
                        </FadeIn>

                        <FadeIn delay={0.55}>
                            <p className="text-white/70 text-lg md:text-xl leading-relaxed font-light max-w-3xl mx-auto mb-8">
                                Most people wait for the future. We are building toward it.
                            </p>
                        </FadeIn>
                        <FadeIn delay={0.65}>
                            <p className="text-white/55 text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto mb-8">
                                Every great human project began as an idea that most people thought was premature, impractical, or irrelevant. The ones who thought otherwise built the world.
                            </p>
                        </FadeIn>
                        <FadeIn delay={0.75}>
                            <p className="text-white/55 text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto mb-20">
                                We do not know exactly what the future looks like. We know exactly what kind of future we refuse to accept. The difference between those two things is the work.
                            </p>
                        </FadeIn>

                        <FadeIn delay={0.85}>
                            <div className="w-16 h-[1px] bg-white/30 mx-auto mb-16" />
                        </FadeIn>

                        <FadeIn delay={0.95}>
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white tracking-tight uppercase leading-[1.05] mb-3"
                                style={{ fontSize: 'clamp(24px, 5vw, 60px)' }}>
                                This is not the beginning.
                            </p>
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white tracking-tight uppercase leading-[1.05] mb-20"
                                style={{ fontSize: 'clamp(24px, 5vw, 60px)' }}>
                                This is the decision.
                            </p>
                        </FadeIn>

                        <FadeIn delay={1.1}>
                            <p className="font-mono text-[12px] tracking-[2.5px] text-white/60 uppercase mb-2">Signed</p>
                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-2xl text-white tracking-[3px] uppercase mb-1">Arius Raynott</p>
                            <p className="font-mono text-[12px] tracking-[3px] text-white/60 uppercase">Founder · 2026</p>
                        </FadeIn>
                    </div>
                </Section>

                <Rule />

                {/* ══════════════════════════════════════════
                    SECTION 13 — GET INVOLVED
                ══════════════════════════════════════════ */}
                <Section id="get-involved" data-print="hide">
                    <SectionLabel number="13" text="Get Involved" />
                    <SectionHeading className="mb-8 max-w-4xl">
                        Join the work.
                    </SectionHeading>

                    <FadeIn delay={0.15}>
                        <p className="text-white/65 text-base md:text-lg leading-relaxed font-light max-w-3xl mb-16">
                            The Ascension Project is not built alone. If any of this resonated — as a researcher, an engineer, a thinker, or simply as someone who wants to follow the work — leave your address. Updates are infrequent and substantive.
                        </p>
                    </FadeIn>

                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">

                        {/* LEFT — Signup form */}
                        <div className="lg:col-span-7 min-w-0">
                            <FadeIn delay={0.2}>
                                <form onSubmit={handleSubmit} noValidate>
                                    {/* Intent selector */}
                                    <p className="font-mono text-[11px] tracking-[3px] text-white/60 uppercase mb-4">I want to</p>
                                    <div className="grid grid-cols-3 gap-px bg-white/10 mb-8" role="radiogroup" aria-label="Type of involvement">
                                        {[
                                            { id: 'subscribe', label: 'Subscribe' },
                                            { id: 'contribute', label: 'Contribute' },
                                            { id: 'apply', label: 'Apply' },
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={intent === opt.id}
                                                onClick={() => setIntent(opt.id)}
                                                className={`bg-black p-4 font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs md:text-sm tracking-[2px] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${intent === opt.id ? 'text-white bg-white/[0.06]' : 'text-white/55 hover:text-white'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Email input */}
                                    <label htmlFor="ascension-email" className="block font-mono text-[11px] tracking-[3px] text-white/60 uppercase mb-3">
                                        Email Address
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1 min-w-0">
                                            <Mail size={16} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                                            <input
                                                id="ascension-email"
                                                type="email"
                                                inputMode="email"
                                                autoComplete="email"
                                                required
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); if (submitState === 'error') setSubmitState('idle'); }}
                                                placeholder="you@domain.com"
                                                disabled={submitState === 'sending' || submitState === 'success'}
                                                className="w-full bg-transparent border border-white/20 focus:border-white/60 hover:border-white/40 pl-11 pr-4 py-4 text-white placeholder:text-white/35 text-base font-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50"
                                                aria-describedby="ascension-submit-status"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitState === 'sending' || submitState === 'success'}
                                            className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/30 hover:bg-white hover:text-black hover:border-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                        >
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-[3px] font-medium uppercase whitespace-nowrap">
                                                {submitState === 'sending' ? 'Sending…' : submitState === 'success' ? 'Received' : 'Submit'}
                                            </span>
                                            {submitState === 'success'
                                                ? <Check size={14} aria-hidden="true" />
                                                : <Send size={14} aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1" />}
                                        </button>
                                    </div>

                                    {/* Status line */}
                                    <div id="ascension-submit-status" aria-live="polite" className="mt-4 min-h-[20px]">
                                        {submitState === 'success' && (
                                            <p className="font-mono text-[12px] tracking-[2px] text-white/70 uppercase flex items-center gap-2">
                                                <Check size={12} aria-hidden="true" />
                                                Thank you. You will receive the next founder dispatch.
                                            </p>
                                        )}
                                        {submitState === 'error' && (
                                            <p className="font-mono text-[12px] tracking-[2px] text-red-300/90 uppercase flex items-center gap-2">
                                                <AlertCircle size={12} aria-hidden="true" />
                                                {email ? 'Please enter a valid email address.' : 'Something went wrong. Please try again.'}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </FadeIn>
                        </div>

                        {/* RIGHT — Direct paths */}
                        <div className="lg:col-span-5 min-w-0">
                            <FadeIn delay={0.3}>
                                <p className="font-mono text-[11px] tracking-[3px] text-white/60 uppercase mb-6">Direct paths</p>

                                <div className="border border-white/15">
                                    {/* Contact founder */}
                                    <Link to="/contact"
                                        className="group flex items-start gap-4 p-6 border-b border-white/10 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                                        <div className="w-8 h-8 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:border-white/50 transition-colors">
                                            <Mail size={14} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-1">Contact the founder</p>
                                            <p className="text-white/55 text-xs leading-relaxed font-light">For research proposals, partnerships, or serious inquiries.</p>
                                        </div>
                                        <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 mt-2 flex-shrink-0" />
                                    </Link>

                                    {/* Share */}
                                    <button
                                        type="button"
                                        onClick={handleShare}
                                        className="group w-full text-left flex items-start gap-4 p-6 border-b border-white/10 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                    >
                                        <div className="w-8 h-8 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:border-white/50 transition-colors">
                                            {shareCopied ? <Check size={14} aria-hidden="true" /> : <Share2 size={14} aria-hidden="true" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-1">
                                                {shareCopied ? 'Link copied' : 'Share the document'}
                                            </p>
                                            <p className="text-white/55 text-xs leading-relaxed font-light">
                                                {shareCopied ? 'Send it to one person who needs to read it.' : 'Copy the link or share via your system.'}
                                            </p>
                                        </div>
                                        <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 mt-2 flex-shrink-0" />
                                    </button>

                                    {/* Print / Save as PDF */}
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="group w-full text-left flex items-start gap-4 p-6 border-b border-white/10 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                    >
                                        <div className="w-8 h-8 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:border-white/50 transition-colors">
                                            <Printer size={14} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-1">Download as PDF</p>
                                            <p className="text-white/55 text-xs leading-relaxed font-light">Save the founder document for offline reading or archiving.</p>
                                        </div>
                                        <ArrowRight size={14} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 mt-2 flex-shrink-0" />
                                    </button>

                                    {/* Return to Future */}
                                    <Link to="/future"
                                        className="group flex items-start gap-4 p-6 hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                                        <div className="w-8 h-8 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:border-white/50 transition-colors">
                                            <ArrowLeft size={14} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-1">Back to Future</p>
                                            <p className="text-white/55 text-xs leading-relaxed font-light">Return to the Infinite Yatra Space Program.</p>
                                        </div>
                                    </Link>
                                </div>

                                <p className="font-mono text-[11px] tracking-[2px] text-white/45 mt-6 leading-relaxed">
                                    We do not sell, share, or display your email anywhere. The signup list is a private founder mailing list.
                                </p>
                            </FadeIn>
                        </div>
                    </div>
                </Section>

                {/* ══════════════════════════════════════════
                    FOOTER
                ══════════════════════════════════════════ */}
                <footer className="border-t border-white/10 mt-8 relative z-20">
                    <div className="px-6 md:px-16 lg:px-24 py-16 md:py-20">
                        <div className="max-w-7xl mx-auto">

                            {/* ── Top row: centered signature ── */}
                            <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white text-lg md:text-xl tracking-[3px] uppercase mb-2">
                                    The Ascension Project
                                </p>
                                <p className="font-mono text-[11px] tracking-[3px] text-white/60 uppercase">
                                    Humanity's Next Frontier · Founded 2026
                                </p>
                                <div className="w-12 h-[1px] bg-white/20 mt-6" />
                            </div>

                            {/* ── Link columns ── */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-12">
                                <div className="text-center md:text-left">
                                    <p className="font-mono text-[10px] tracking-[3px] text-white/60 uppercase mb-4">Sections</p>
                                    <div className="flex flex-col gap-2">
                                        {NAV_SECTIONS.slice(1, 7).map(s => (
                                            <button key={s.id} onClick={() => scrollTo(s.id)}
                                                className="text-center md:text-left text-[12px] text-white/55 hover:text-white transition-colors tracking-[2px] uppercase">
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="font-mono text-[10px] tracking-[3px] text-white/60 uppercase mb-4">Continued</p>
                                    <div className="flex flex-col gap-2">
                                        {NAV_SECTIONS.slice(7, 13).map(s => (
                                            <button key={s.id} onClick={() => scrollTo(s.id)}
                                                className="text-center text-[12px] text-white/55 hover:text-white transition-colors tracking-[2px] uppercase">
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-2 md:col-span-1 text-center md:text-right">
                                    <p className="font-mono text-[10px] tracking-[3px] text-white/60 uppercase mb-4">Navigate</p>
                                    <Link to="/future" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group text-[12px] tracking-[2px] uppercase">
                                        <ArrowLeft size={12} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1" />
                                        Back to Future
                                    </Link>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/10 mb-6" />

                            {/* ── Bottom row ── */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-center">
                                <p className="font-mono text-[10px] tracking-[2px] text-white/55 uppercase">
                                    © {new Date().getFullYear()} · A Division of Infinite Yatra · All Rights Reserved
                                </p>
                                <p className="font-mono text-[10px] italic tracking-[2px] text-white/55 uppercase">
                                    Classified · Internal Document
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
};

export default AscensionProject;
