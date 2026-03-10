import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowDown, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import SpaceWaitlistModal from '../components/SpaceWaitlistModal';

/* =========================================
   1. Canvas Starfield Background
========================================= */
const StarField = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const numStars = 320;
        const stars = Array.from({ length: numStars }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.01,
            color: Math.random() > 0.85
                ? (Math.random() > 0.5 ? '#C4AAFF' : '#00FFFF')
                : '#FFFFFF',
            isLarge: Math.random() > 0.95
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                star.phase += star.speed;
                // Sin wave alpha (0.2 to 1)
                const alpha = Math.abs(Math.sin(star.phase)) * 0.8 + 0.2;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = star.color;

                if (star.isLarge) {
                    // Draw a subtle cross/sparkle for large stars
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.globalAlpha = alpha * 0.5;
                    ctx.fillRect(star.x - star.size * 3, star.y - 0.5, star.size * 6, 1);
                    ctx.fillRect(star.x - 0.5, star.y - star.size * 3, 1, star.size * 6);
                } else {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

/* =========================================
   2. Custom Cursor
========================================= */
const CustomCursor = () => {
    const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block mix-blend-screen">
            <motion.div
                className="absolute w-2 h-2 bg-[#00FFFF] rounded-full -ml-1 -mt-1 shadow-[0_0_10px_#00FFFF]"
                animate={{ x: mousePos.x, y: mousePos.y }}
                transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
            />
            <motion.div
                className="absolute w-8 h-8 border border-[#00FFFF]/50 rounded-full -ml-4 -mt-4 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                animate={{ x: mousePos.x, y: mousePos.y }}
                transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
            />
        </div>
    );
};

/* =========================================
   3. Reusable Scroll Reveal & Glow Card
========================================= */
const FadeUp = ({ children, delay = 0, className = "" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const GlowCard = ({ children, className = "" }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={`relative group overflow-hidden bg-black/40 backdrop-blur-md border border-white/[0.08] p-8 transition-all duration-500 hover:border-white/[0.15] ${className}`}
        >
            {/* Radial Mouse Tracker Glow */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                style={{
                    background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(123, 47, 255, 0.15), transparent 40%)`
                }}
            />
            {/* Corner accent pieces */}
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-[#00FFFF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-[#00FFFF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-gradient-to-l from-[#00FFFF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-gradient-to-t from-[#00FFFF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};

/* =========================================
   4. Thruster Fire SVGs
========================================= */
const ThrusterPulse = ({ children }) => (
    <motion.div
        animate={{ opacity: [0.7, 1, 0.8], scaleY: [0.9, 1.1, 0.95] }}
        transition={{ duration: 0.15, repeat: Infinity, repeatType: "mirror" }}
        style={{ transformOrigin: "top center" }}
        className="flex justify-center"
    >
        {children}
    </motion.div>
);

/* =========================================
   5. Rocket SVG Components
========================================= */

// CARD 1: IY AURORA (Orbital - Space Shuttle)
const RocketAurora = () => (
    <motion.div
        animate={{ y: [0, -13, 0] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        className="w-full h-64 relative flex items-center justify-center pt-8 z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
    >
        <svg width="120" height="180" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* External Tank */}
            <rect x="50" y="20" width="20" height="120" rx="10" fill="#E67E22" />
            <path d="M50 20 L70 20 V140 H50 Z" fill="#D35400" opacity="0.4" />

            {/* SRBs */}
            <rect x="36" y="30" width="8" height="100" fill="#F8FAFC" />
            <path d="M36 30 L40 20 L44 30 Z" fill="#F8FAFC" />
            <path d="M32 130 H48 L46 140 H34 Z" fill="#334155" /> {/* SRB Left Nozzle */}

            <rect x="76" y="30" width="8" height="100" fill="#F8FAFC" />
            <path d="M76 30 L80 20 L84 30 Z" fill="#F8FAFC" />
            <path d="M72 130 H88 L86 140 H74 Z" fill="#334155" /> {/* SRB Right Nozzle */}

            {/* Orbiter Body */}
            {/* Wings */}
            <path d="M60 70 L25 125 H95 L60 70 Z" fill="#94A3B8" stroke="#334155" strokeWidth="1" />
            <path d="M60 70 L25 125 H95 L60 70 Z" fill="#1E293B" opacity="0.3" /> {/* thermal tile shade */}

            {/* Main fuselage */}
            <path d="M60 40 C65 40, 70 70, 70 125 H50 C50 70, 55 40, 60 40 Z" fill="#F1F5F9" />
            <path d="M60 40 C65 40, 70 70, 70 125 H60 V40 Z" fill="#FFFFFF" opacity="0.6" />

            {/* Cockpit Window */}
            <path d="M56 60 Q60 55 64 60 Q60 62 56 60 Z" fill="#020617" />
            <line x1="60" y1="56" x2="60" y2="61" stroke="#F1F5F9" strokeWidth="0.5" />

            {/* Flag stripe (abstracted to line) */}
            <line x1="56" y1="80" x2="64" y2="80" stroke="#EF4444" strokeWidth="2" />
            <line x1="56" y1="82" x2="64" y2="82" stroke="#FFFFFF" strokeWidth="1" />

            {/* Tail fin */}
            <path d="M60 90 L60 125 L65 125 Z" fill="#CBD5E1" />

            {/* SSME Nozzles */}
            <ellipse cx="55" cy="128" rx="4" ry="2" fill="none" stroke="#475569" strokeWidth="1" />
            <ellipse cx="65" cy="128" rx="4" ry="2" fill="none" stroke="#475569" strokeWidth="1" />
            <ellipse cx="60" cy="132" rx="4" ry="2" fill="none" stroke="#475569" strokeWidth="1" />
        </svg>

        {/* Flames */}
        <div className="absolute top-[170px] flex w-[120px] justify-between px-[36px]">
            {/* SRB Flame Left */}
            <ThrusterPulse><div className="w-2 h-10 bg-gradient-to-b from-white via-orange-500 to-transparent blur-[1px] rounded-full mt-2" /></ThrusterPulse>
            {/* SSME Flame Center */}
            <ThrusterPulse><div className="w-3 h-12 bg-gradient-to-b from-blue-300 via-cyan-500 to-transparent blur-[1px] rounded-full mt-4" /></ThrusterPulse>
            {/* SRB Flame Right */}
            <ThrusterPulse><div className="w-2 h-10 bg-gradient-to-b from-white via-orange-500 to-transparent blur-[1px] rounded-full mt-2" /></ThrusterPulse>
        </div>
    </motion.div>
);

// CARD 2: IY HORIZON (Deep Space Ion Cruiser)
const RocketHorizon = () => (
    <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        className="w-full h-64 relative flex items-center justify-center pt-8 z-10 drop-shadow-[0_0_20px_rgba(0,255,255,0.15)]"
    >
        <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Solar Arrays */}
            <rect x="20" y="60" width="70" height="25" fill="#0F172A" />
            <rect x="110" y="60" width="70" height="25" fill="#0F172A" />

            {/* Solar Array Grid Lines */}
            <path d="M20 68 H90 M20 76 H90 M110 68 H180 M110 76 H180" stroke="#00FFFF" strokeWidth="0.5" opacity="0.3" />
            <path d="M35 60 V85 M55 60 V85 M75 60 V85 M125 60 V85 M145 60 V85 M165 60 V85" stroke="#00FFFF" strokeWidth="0.5" opacity="0.3" />

            {/* Horizontal Boom Arms */}
            <line x1="90" y1="72.5" x2="110" y2="72.5" stroke="#64748B" strokeWidth="4" />

            {/* Central Spine */}
            <rect x="94" y="30" width="12" height="90" rx="6" fill="url(#horizon-grad)" />
            <defs>
                <linearGradient id="horizon-grad" x1="94" y1="30" x2="106" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F8FAFC" />
                    <stop offset="1" stopColor="#1E293B" />
                </linearGradient>
            </defs>

            {/* Nose Fairing */}
            <path d="M94 30 L100 15 L106 30 Z" fill="#CBD5E1" />
            <line x1="100" y1="15" x2="100" y2="5" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="100" cy="5" r="1.5" fill="#00FFFF" />

            {/* Habitat Module */}
            <rect x="91" y="55" width="18" height="35" rx="2" fill="#334155" />
            <circle cx="100" cy="65" r="3" fill="#020617" stroke="#00FFFF" strokeWidth="0.5" />
            <circle cx="100" cy="77" r="3" fill="#020617" stroke="#00FFFF" strokeWidth="0.5" />

            {/* Heat Shield Disk */}
            <ellipse cx="100" cy="115" rx="14" ry="4" fill="#64748B" />
            <ellipse cx="100" cy="115" rx="14" ry="4" fill="none" stroke="#94A3B8" strokeWidth="1" />

            {/* Ion Engine Bell */}
            <path d="M96 115 L93 125 H107 L104 115 Z" fill="#0F172A" />
            <ellipse cx="100" cy="125" rx="7" ry="2" fill="none" stroke="#00FFFF" strokeWidth="1" />
        </svg>

        {/* Ion Plume Flame */}
        <div className="absolute top-[160px] w-full flex justify-center mt-[-3px]">
            <ThrusterPulse>
                <div className="w-1 h-24 bg-gradient-to-b from-[#00FFFF] to-transparent blur-[2px] rounded-full" />
                <div className="absolute w-2 h-10 bg-gradient-to-b from-white to-[#00FFFF] blur-[4px] rounded-full" />
            </ThrusterPulse>
        </div>
    </motion.div>
);

// CARD 3: IY SELENE (Lunar Apollo-class)
const RocketSelene = () => (
    <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
        className="w-full h-64 relative flex items-center justify-center pt-10 z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.2)]"
    >
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">

            {/* Landing Legs */}
            {/* Secondary Legs (shorter) */}
            <line x1="70" y1="80" x2="40" y2="120" stroke="#A16207" strokeWidth="2" />
            <line x1="70" y1="80" x2="100" y2="120" stroke="#A16207" strokeWidth="2" />
            <ellipse cx="40" cy="120" rx="5" ry="2" fill="#D97706" />
            <ellipse cx="100" cy="120" rx="5" ry="2" fill="#D97706" />

            {/* Primary Legs (longer setup) */}
            <line x1="70" y1="75" x2="15" y2="130" stroke="#CA8A04" strokeWidth="2.5" />
            <line x1="70" y1="75" x2="125" y2="130" stroke="#CA8A04" strokeWidth="2.5" />
            <ellipse cx="15" cy="130" rx="7" ry="3" fill="#F59E0B" />
            <ellipse cx="125" cy="130" rx="7" ry="3" fill="#F59E0B" />

            {/* Contact Probes */}
            <line x1="15" y1="130" x2="15" y2="138" stroke="#CA8A04" strokeWidth="1" />
            <line x1="125" y1="130" x2="125" y2="138" stroke="#CA8A04" strokeWidth="1" />
            <circle cx="15" cy="138" r="1.5" fill="#FEF08A" />
            <circle cx="125" cy="138" r="1.5" fill="#FEF08A" />

            {/* Descent Stage */}
            <rect x="45" y="65" width="50" height="30" fill="#CA8A04" />
            {/* Foil horizontal striping */}
            <path d="M45 70 H95 M45 75 H95 M45 80 H95 M45 85 H95 M45 90 H95" stroke="#FDE047" strokeWidth="1.5" opacity="0.6" />
            {/* Foil vertical seams */}
            <path d="M55 65 V95 M70 65 V95 M85 65 V95" stroke="#A16207" strokeWidth="1" />
            {/* Hatch on descent top */}
            <rect x="63" y="62" width="14" height="3" fill="#A16207" />

            {/* Ascent Stage */}
            <rect x="52" y="30" width="36" height="32" rx="4" fill="#FDE68A" />
            <rect x="52" y="30" width="18" height="32" rx="4" fill="#FEF08A" opacity="0.7" />

            {/* Dome Top */}
            <path d="M52 30 Q70 15 88 30 Z" fill="#FDE68A" />

            {/* Window */}
            <ellipse cx="70" cy="45" rx="8" ry="12" fill="#020617" stroke="#EAB308" strokeWidth="1.5" />
            <path d="M68 40 L74 45 L68 50 Z" fill="#00FFFF" opacity="0.3" />

            {/* RCS Thruster Blocks */}
            <rect x="48" y="45" width="4" height="8" fill="#64748B" />
            <rect x="88" y="45" width="4" height="8" fill="#64748B" />
            <line x1="44" y1="49" x2="48" y2="49" stroke="#94A3B8" strokeWidth="1" />
            <line x1="92" y1="49" x2="88" y2="49" stroke="#94A3B8" strokeWidth="1" />

            {/* Engine Shroud Descent */}
            <ellipse cx="70" cy="98" rx="10" ry="3" fill="#1E293B" />
        </svg>

        {/* Frame / Flame */}
        <div className="absolute top-[148px] w-full flex justify-center mt-0" style={{ transform: 'translateX(-0.5px)' }}>
            <ThrusterPulse>
                <div className="w-1.5 h-16 bg-gradient-to-b from-white via-orange-400 to-transparent blur-[1px] rounded-full" />
            </ThrusterPulse>
        </div>
    </motion.div>
);

// CARD 4: IY MANGAL (Interplanetary Starship class)
const RocketMangal = () => (
    <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 4.8, ease: "easeInOut", repeat: Infinity }}
        className="w-full h-64 relative flex items-center justify-center pt-8 z-10 drop-shadow-[0_0_20px_rgba(239,68,68,0.1)]"
    >
        <svg width="120" height="180" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Super Heavy Booster */}
            <rect x="44" y="90" width="32" height="60" fill="url(#mangal-grad)" />
            <defs>
                <linearGradient id="mangal-grad" x1="44" y1="0" x2="76" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F8FAFC" />
                    <stop offset="1" stopColor="#475569" />
                </linearGradient>
            </defs>
            <path d="M44 110 H76 M44 130 H76" stroke="#94A3B8" strokeWidth="0.5" />

            {/* Grid Fins */}
            <rect x="36" y="95" width="8" height="15" fill="#334155" />
            <path d="M36 98 H44 M36 101 H44 M36 104 H44 M36 107 H44 M39 95 V110 M41 95 V110" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />

            <rect x="76" y="95" width="8" height="15" fill="#334155" />
            <path d="M76 98 H84 M76 101 H84 M76 104 H84 M76 107 H84 M79 95 V110 M81 95 V110" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />

            {/* Raptor Engine Bells */}
            {/* A rough circular cluster of 7 bells */}
            <ellipse cx="60" cy="155" rx="14" ry="4" fill="#0F172A" />
            <ellipse cx="50" cy="153" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
            <ellipse cx="55" cy="154" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
            <ellipse cx="65" cy="154" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
            <ellipse cx="70" cy="153" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
            <ellipse cx="55" cy="150" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
            <ellipse cx="65" cy="150" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
            <ellipse cx="60" cy="152" rx="4" ry="2" fill="none" stroke="#CBD5E1" strokeWidth="0.5" /> {/* Center */}

            {/* Upper Stage Starship */}
            <path d="M44 20 C44 20, 60 0, 76 20 V90 H44 Z" fill="url(#mangal-grad)" />
            <path d="M44 40 H76 M44 60 H76 M44 80 H76" stroke="#94A3B8" strokeWidth="0.5" />
            <path d="M52 20 V90 M60 20 V90 M68 20 V90" stroke="#94A3B8" strokeWidth="0.5" opacity="0.3" />

            {/* Portholes */}
            <circle cx="60" cy="30" r="2" fill="#020617" />
            <circle cx="60" cy="40" r="2" fill="#020617" />
            <circle cx="60" cy="54" r="3.5" fill="#020617" />
            <path d="M58 52 Q60 50 62 52" stroke="#FFFFFF" strokeWidth="0.5" fill="none" />

            {/* INFINITE YATRA Text Stripe */}
            <rect x="44" y="65" width="32" height="6" fill="#7F1D1D" opacity="0.8" />
            <text x="60" y="69.5" fill="#FFFFFF" fontSize="4" fontFamily="Orbitron" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">INFINITE YATRA</text>

            {/* Forward Aft Flaps */}
            <path d="M44 25 L38 35 L44 40 Z" fill="#94A3B8" />
            <path d="M76 25 L82 35 L76 40 Z" fill="#94A3B8" />

            {/* Lower Aft Flaps */}
            <path d="M44 70 L34 85 L44 90 Z" fill="#94A3B8" />
            <path d="M76 70 L86 85 L76 90 Z" fill="#94A3B8" />
        </svg>

        {/* 5 Raptor Flames */}
        <div className="absolute top-[188px] w-full flex justify-center gap-1.5 opacity-90">
            <ThrusterPulse><div className="w-1.5 h-10 bg-gradient-to-b from-white via-orange-500 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
            <ThrusterPulse><div className="w-2 h-14 bg-gradient-to-b from-white via-orange-400 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
            <div style={{ transform: 'translateY(4px)' }}>
                <ThrusterPulse><div className="w-2.5 h-16 bg-gradient-to-b from-white via-yellow-400 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
            </div>
            <ThrusterPulse><div className="w-2 h-14 bg-gradient-to-b from-white via-orange-400 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
            <ThrusterPulse><div className="w-1.5 h-10 bg-gradient-to-b from-white via-orange-500 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
        </div>
    </motion.div>
);


/* =========================================
   MAIN PAGE COMPONENT 
========================================= */
const Future = () => {
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
    const [showShareBanner, setShowShareBanner] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('ref') === 'mission-share') {
            const t1 = setTimeout(() => setShowShareBanner(true), 2000);
            const t2 = setTimeout(() => setShowShareBanner(false), 7000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, []);

    return (
        <>
            <Helmet>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet" />
            </Helmet>

            <div
                className="bg-[#000] text-white min-h-screen relative overflow-x-hidden"
                style={{
                    fontFamily: "'Exo 2', sans-serif",
                    cursor: "none" // We use custom cursor
                }}
            >
                <CustomCursor />

                {/* ── Background Stack ── */}
                <div
                    className="fixed inset-0 pointer-events-none z-0"
                    style={{ background: 'radial-gradient(circle at center, #0C0420 0%, #050212 50%, #000000 100%)' }}
                />
                <StarField />

                <motion.div
                    className="fixed inset-0 pointer-events-none z-30 h-[10px] bg-[#00FFFF]/5 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                    animate={{ y: ["-10vh", "110vh"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                <div className="fixed inset-0 pointer-events-none z-10">
                    <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-[#7B2FFF]/10 blur-[150px]" />
                    <div className="absolute top-[50%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#00FFFF]/5 blur-[150px]" />
                    <div className="absolute bottom-[0%] left-[-10%] w-[60vw] h-[40vw] rounded-full bg-[#C8AAFF]/5 blur-[150px]" />
                </div>

                {/* Share URL Banner */}
                {showShareBanner && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="fixed top-[86px] left-1/2 -translate-x-1/2 z-50 bg-[#0A0618]/90 backdrop-blur-md border border-[#7B2FFF]/50 px-6 py-3 rounded shadow-[0_0_20px_rgba(123,47,255,0.3)] text-center text-[#C8AAFF] font-['Orbitron'] text-[11px] tracking-[2px]"
                    >
                        🚀 Someone shared their mission with you. This is what awaits humanity.
                    </motion.div>
                )}

                {/* ── Navbar ── Fully Opaque */}
                <nav className="fixed top-0 left-0 w-full h-[70px] px-[56px] flex justify-between items-center z-[100] bg-[#040112] border-b border-[#7B2FFF]/20 shadow-[0_4px_40px_rgba(0,0,0,0.9)]">
                    <div className="font-['Orbitron'] font-black text-[15px] tracking-[4px] text-white whitespace-nowrap leading-tight">
                        INFINITE YATRA
                        <div className="text-[#7B2FFF] text-[8px] tracking-[6px] block">EXPLORE INFINITE</div>
                    </div>

                    <Link to="/" className="hidden md:flex font-['Orbitron'] text-xs font-bold tracking-[0.1em] text-[#00FFFF] px-4 py-2 border border-[#00FFFF]/50 hover:bg-[#00FFFF]/10 transition-colors">
                        ← RETURN TO EARTH
                    </Link>
                </nav>

                {/* =========================================
                    SECTION 1: HERO
                ========================================= */}
                <section className="relative w-full h-screen flex flex-col justify-center items-center px-6 z-20 text-center uppercase pt-[70px]">
                    <FadeUp delay={0.5}>
                        <p className="font-['Orbitron'] text-[#7B2FFF] text-sm md:text-base tracking-[8px] mb-4 font-bold drop-shadow-[0_0_8px_rgba(123,47,255,0.4)]">
                            MISSION BRIEF — CLASSIFIED
                        </p>
                    </FadeUp>

                    <FadeUp delay={0.7}>
                        <h1
                            className="font-['Orbitron'] font-black leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white via-[#C8AAFF] to-[#7B2FFF] drop-shadow-[0_0_30px_rgba(123,47,255,0.3)]"
                            style={{ fontSize: 'clamp(50px, 9vw, 112px)' }}
                        >
                            INFINITE YATRA
                        </h1>
                    </FadeUp>

                    <FadeUp delay={0.9}>
                        <h2 className="font-['Orbitron'] font-bold text-2xl md:text-3xl tracking-[12px] text-[#00FFFF] mb-12 drop-shadow-[0_0_15px_rgba(0,255,255,0.4)] ml-[12px]">
                            SPACE PROGRAM
                        </h2>
                    </FadeUp>

                    <FadeUp delay={1.1}>
                        <p className="max-w-2xl text-[#A0AEC0] text-lg leading-relaxed font-light mx-auto normal-case tracking-wide">
                            The journey doesn't end on Earth. One day, Infinite Yatra will take travelers beyond our planet — and into the infinite.
                        </p>
                    </FadeUp>

                    <motion.div
                        className="absolute bottom-12 flex flex-col items-center gap-3 opacity-60"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <span className="font-['Orbitron'] text-[10px] tracking-[4px] text-white/80 uppercase">SCROLL SEQUENCE</span>
                        <div className="w-[1px] h-14 bg-gradient-to-b from-white to-transparent" />
                        <ArrowDown size={14} className="text-white/60" />
                    </motion.div>
                </section>

                {/* =========================================
                    SECTION 2: FLEET
                ========================================= */}
                <section className="relative w-full min-h-screen py-24 px-6 md:px-12 z-20 max-w-7xl mx-auto">
                    <FadeUp delay={0.2}>
                        <h2 className="font-['Orbitron'] text-3xl font-bold mb-16 text-white border-l-[3px] border-[#00FFFF] pl-4 tracking-widest uppercase">
                            The Fleet
                        </h2>
                    </FadeUp>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* IY AURORA */}
                        <FadeUp delay={0.3}>
                            <GlowCard className="h-full flex flex-col">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                                    <div className="font-['Orbitron'] font-bold text-2xl tracking-widest text-white">IY AURORA</div>
                                    <span className="px-3 py-1 bg-[#7B2FFF]/10 border border-[#7B2FFF]/30 text-[#C8AAFF] text-[10px] tracking-[2px] font-['Orbitron'] uppercase">Orbital Class</span>
                                </div>
                                <RocketAurora />
                                <div className="mt-8 pt-6 border-t border-white/10 flex-grow">
                                    <div className="flex justify-between text-[11px] font-['Orbitron'] text-[#888] mb-4 tracking-wider">
                                        <span>ALTITUDE 400 KM</span>
                                        <span>DURATION 72 HRS</span>
                                        <span>CREW 6 PAX</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-light">
                                        Your first step beyond the atmosphere. The Aurora carries 6 passengers to 400km altitude for 3-day orbital stays with panoramic Earth views.
                                    </p>
                                </div>
                            </GlowCard>
                        </FadeUp>

                        {/* IY HORIZON */}
                        <FadeUp delay={0.4}>
                            <GlowCard className="h-full flex flex-col">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                                    <div className="font-['Orbitron'] font-bold text-2xl tracking-widest text-white">IY HORIZON</div>
                                    <span className="px-3 py-1 bg-[#00FFFF]/10 border border-[#00FFFF]/30 text-[#00FFFF] text-[10px] tracking-[2px] font-['Orbitron'] uppercase">Deep Space</span>
                                </div>
                                <RocketHorizon />
                                <div className="mt-8 pt-6 border-t border-white/10 flex-grow">
                                    <div className="flex justify-between text-[11px] font-['Orbitron'] text-[#888] mb-4 tracking-wider">
                                        <span>RANGE 2.7 AU</span>
                                        <span>DURATION 180 D</span>
                                        <span>CREW 4 PAX</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-light">
                                        Built for the long voyage. The Horizon's ion propulsion carries research teams to the asteroid belt, opening a new era of scientific tourism.
                                    </p>
                                </div>
                            </GlowCard>
                        </FadeUp>

                        {/* IY SELENE */}
                        <FadeUp delay={0.5}>
                            <GlowCard className="h-full flex flex-col">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                                    <div className="font-['Orbitron'] font-bold text-2xl tracking-widest text-white">IY SELENE</div>
                                    <span className="px-3 py-1 bg-[#CA8A04]/10 border border-[#CA8A04]/30 text-[#FDE68A] text-[10px] tracking-[2px] font-['Orbitron'] uppercase">Lunar Class</span>
                                </div>
                                <RocketSelene />
                                <div className="mt-8 pt-6 border-t border-white/10 flex-grow">
                                    <div className="flex flex-wrap justify-between text-[11px] font-['Orbitron'] text-[#888] mb-4 tracking-wider gap-2">
                                        <span>DISTANCE 384K KM</span>
                                        <span>MISSION 7 DAYS</span>
                                        <span>PIONEERS 2 PAX</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-light">
                                        Walk on the Moon. The Selene touches down in the Sea of Tranquility, offering the first commercial lunar surface stays — 72 hours under the stars.
                                    </p>
                                </div>
                            </GlowCard>
                        </FadeUp>

                        {/* IY MANGAL */}
                        <FadeUp delay={0.6}>
                            <GlowCard className="h-full flex flex-col">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                                    <div className="font-['Orbitron'] font-bold text-2xl tracking-widest text-white">IY MANGAL</div>
                                    <span className="px-3 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#FCA5A5] text-[10px] tracking-[2px] font-['Orbitron'] uppercase">Interplanetary</span>
                                </div>
                                <RocketMangal />
                                <div className="mt-8 pt-6 border-t border-white/10 flex-grow">
                                    <div className="flex flex-wrap justify-between text-[11px] font-['Orbitron'] text-[#888] mb-4 tracking-wider gap-2">
                                        <span>RANGE 225M KM</span>
                                        <span>TRANSIT 6 MO</span>
                                        <span>CAPACITY 100 PAX</span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed font-light">
                                        Named after the red planet in Sanskrit, the Mangal is Infinite Yatra's vision for multi-month Mars transit — humanity's next chapter.
                                    </p>
                                </div>
                            </GlowCard>
                        </FadeUp>
                    </div>
                </section>

                {/* =========================================
                    SECTION 3: TIMELINE
                ========================================= */}
                <section className="relative w-full py-32 px-6 z-20 overflow-hidden">
                    <FadeUp>
                        <h2 className="font-['Orbitron'] text-center text-3xl font-bold mb-24 text-white tracking-widest uppercase border-b border-white/10 pb-6 inline-block w-full max-w-xs mx-auto block">
                            Timeline
                        </h2>
                    </FadeUp>

                    <div className="relative max-w-4xl mx-auto">
                        {/* Central Purple Line */}
                        <div className="absolute left-[30px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#7B2FFF] via-[#00FFFF] to-transparent md:-translate-x-1/2" />

                        {[
                            { year: "2026", sub: "Earth Mastered" },
                            { year: "2028 Phase I", sub: "Stratosphere Tours" },
                            { year: "2031 Phase II", sub: "Orbital Stays" },
                            { year: "2035", sub: "The Moon" },
                            { year: "2040+", sub: "Mars & Beyond" },
                        ].map((item, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <FadeUp key={index} delay={0.2} className={`relative flex items-center justify-start md:justify-between mb-16 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                    <div className="hidden md:block w-5/12" />

                                    {/* Glowing Dot */}
                                    <div className="absolute left-[26px] md:left-1/2 w-[9px] h-[9px] rounded-full bg-[#C8AAFF] shadow-[0_0_15px_#7B2FFF] border-2 border-black md:-translate-x-1/2 top-4 md:top-auto z-10" />

                                    <div className={`w-full md:w-5/12 pl-16 md:pl-0 ${isEven ? 'md:pl-0' : 'md:text-right'}`}>
                                        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-sm">
                                            <div className="font-['Orbitron'] text-sm tracking-[3px] text-[#00FFFF] mb-1">{item.year}</div>
                                            <div className="font-['Orbitron'] text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] uppercase">{item.sub}</div>
                                        </div>
                                    </div>
                                </FadeUp>
                            )
                        })}
                    </div>
                </section>

                {/* =========================================
                    SECTION 4: CTA
                ========================================= */}
                <section className="relative w-full min-h-[50vh] flex flex-col justify-center items-center px-6 z-20 pb-32 pt-16 text-center">
                    <FadeUp>
                        <h2 className="font-['Orbitron'] font-black text-4xl md:text-5xl tracking-[8px] mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#7B2FFF] to-[#00FFFF]">
                            RESERVE YOUR SEAT
                        </h2>
                    </FadeUp>
                    <FadeUp delay={0.2}>
                        <p className="font-['Exo_2'] italic text-[#888] text-lg md:text-xl mb-12 tracking-wide font-light">
                            "today across Earth... tomorrow beyond it. 🚀"
                        </p>
                    </FadeUp>

                    <FadeUp delay={0.4} className="flex justify-center w-full px-4">
                        <button 
                            onClick={() => setIsWaitlistOpen(true)}
                            className="relative px-8 py-4 font-['Orbitron'] font-bold text-sm tracking-[3px] text-white rounded bg-gradient-to-r from-[#7B2FFF] to-blue-600 hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(123,47,255,0.4)] group overflow-hidden w-full sm:w-auto"
                        >
                            <span className="relative z-10">JOIN THE WAITLIST</span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600 to-[#00FFFF] transition-opacity duration-300 z-0" />
                        </button>
                    </FadeUp>
                </section>

                <SpaceWaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
            </div>
        </>
    );
};

export default Future;
