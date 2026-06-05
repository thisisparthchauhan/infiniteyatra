import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';
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
   4. Vehicle Schematic Illustrations
   — Static monochrome technical line-art —
========================================= */

const SchematicWrapper = ({ children, className = "" }) => (
    <div className={`w-full flex items-center justify-center ${className}`}>
        {children}
    </div>
);

// VEHICLE 01: IY AURORA — Orbital shuttle, side-profile schematic
const RocketAurora = () => (
    <SchematicWrapper className="h-56 md:h-72">
        <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-md">
            {/* Reticle / target lines */}
            <line x1="0" y1="120" x2="40" y2="120" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="280" y1="120" x2="320" y2="120" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="160" y1="0" x2="160" y2="30" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="160" y1="210" x2="160" y2="240" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />

            {/* External tank */}
            <rect x="142" y="50" width="20" height="120" rx="8" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <line x1="142" y1="80" x2="162" y2="80" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="142" y1="120" x2="162" y2="120" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />

            {/* SRB Left */}
            <rect x="115" y="60" width="14" height="100" rx="2" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            <path d="M115 60 L122 48 L129 60" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            {/* SRB Right */}
            <rect x="175" y="60" width="14" height="100" rx="2" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            <path d="M175 60 L182 48 L189 60" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />

            {/* Orbiter wings */}
            <path d="M152 110 L80 165 L240 165 L168 110 Z" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <line x1="100" y1="160" x2="220" y2="160" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />

            {/* Cockpit dome */}
            <path d="M148 70 Q160 60 172 70" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <ellipse cx="160" cy="74" rx="6" ry="2" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.6" fill="none" />

            {/* Nozzles */}
            <ellipse cx="153" cy="172" rx="4" ry="2.5" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            <ellipse cx="167" cy="172" rx="4" ry="2.5" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            <ellipse cx="160" cy="178" rx="4" ry="2.5" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />

            {/* Dimensions / labels */}
            <text x="48" y="58" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">EXT TANK</text>
            <line x1="80" y1="55" x2="115" y2="60" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="226" y="58" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">SRB</text>
            <line x1="245" y1="55" x2="220" y2="60" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="44" y="200" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">ORBITER</text>
            <line x1="80" y1="195" x2="110" y2="165" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
        </svg>
    </SchematicWrapper>
);

// VEHICLE 02: IY HORIZON — Deep-space ion cruiser
const RocketHorizon = () => (
    <SchematicWrapper className="h-56 md:h-72">
        <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-md">
            {/* Reticle */}
            <line x1="0" y1="120" x2="30" y2="120" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="290" y1="120" x2="320" y2="120" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />

            {/* Solar arrays */}
            <rect x="40" y="100" width="90" height="40" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <rect x="190" y="100" width="90" height="40" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            {/* Solar grid */}
            {[55, 70, 85, 100, 115].map(x => (
                <line key={`l${x}`} x1={x} y1="100" x2={x} y2="140" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.5" />
            ))}
            {[205, 220, 235, 250, 265].map(x => (
                <line key={`r${x}`} x1={x} y1="100" x2={x} y2="140" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.5" />
            ))}
            <line x1="40" y1="115" x2="130" y2="115" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.5" />
            <line x1="40" y1="125" x2="130" y2="125" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.5" />
            <line x1="190" y1="115" x2="280" y2="115" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.5" />
            <line x1="190" y1="125" x2="280" y2="125" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.5" />

            {/* Booms */}
            <line x1="130" y1="120" x2="150" y2="120" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" />
            <line x1="170" y1="120" x2="190" y2="120" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="2" />

            {/* Central spine */}
            <rect x="150" y="50" width="20" height="140" rx="3" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />

            {/* Antenna */}
            <line x1="160" y1="50" x2="160" y2="30" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
            <circle cx="160" cy="28" r="2" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.8" fill="none" />

            {/* Habitat module */}
            <rect x="146" y="95" width="28" height="55" rx="2" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            <circle cx="160" cy="108" r="3" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            <circle cx="160" cy="125" r="3" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            <circle cx="160" cy="142" r="3" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />

            {/* Heat shield disk */}
            <ellipse cx="160" cy="178" rx="18" ry="3" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />

            {/* Ion engine bell */}
            <path d="M152 178 L148 195 L172 195 L168 178 Z" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            <ellipse cx="160" cy="195" rx="9" ry="2" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.6" fill="none" />

            {/* Labels */}
            <text x="58" y="92" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">SOLAR ARRAY</text>
            <text x="206" y="92" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">SOLAR ARRAY</text>
            <text x="180" y="118" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">HABITAT</text>
            <line x1="178" y1="115" x2="174" y2="115" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="178" y="200" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">ION DRIVE</text>
        </svg>
    </SchematicWrapper>
);

// VEHICLE 03: IY SELENE — Lunar lander
const RocketSelene = () => (
    <SchematicWrapper className="h-56 md:h-72">
        <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-md">
            {/* Reticle */}
            <line x1="0" y1="120" x2="40" y2="120" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="280" y1="120" x2="320" y2="120" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="160" y1="195" x2="160" y2="220" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />

            {/* Landing legs */}
            <line x1="160" y1="135" x2="100" y2="195" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" />
            <line x1="160" y1="135" x2="220" y2="195" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" />
            <line x1="160" y1="135" x2="130" y2="195" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
            <line x1="160" y1="135" x2="190" y2="195" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />

            {/* Foot pads */}
            <ellipse cx="100" cy="197" rx="8" ry="2.5" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <ellipse cx="220" cy="197" rx="8" ry="2.5" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <ellipse cx="130" cy="197" rx="6" ry="2" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />
            <ellipse cx="190" cy="197" rx="6" ry="2" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" fill="none" />

            {/* Descent stage (octagonal box) */}
            <path d="M125 95 L195 95 L210 110 L210 140 L195 155 L125 155 L110 140 L110 110 Z"
                stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            <line x1="110" y1="125" x2="210" y2="125" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="125" y1="95" x2="125" y2="155" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="160" y1="95" x2="160" y2="155" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="195" y1="95" x2="195" y2="155" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />

            {/* Ascent stage */}
            <rect x="135" y="55" width="50" height="40" rx="3" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1" fill="none" />
            {/* Window */}
            <ellipse cx="160" cy="72" rx="6" ry="9" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" fill="none" />

            {/* RCS thruster blocks */}
            <rect x="128" y="68" width="6" height="8" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            <rect x="186" y="68" width="6" height="8" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />

            {/* Dome */}
            <path d="M135 55 Q160 38 185 55" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1" fill="none" />

            {/* Antenna */}
            <line x1="160" y1="40" x2="160" y2="28" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" />
            <circle cx="160" cy="26" r="1.5" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />

            {/* Engine bell */}
            <ellipse cx="160" cy="158" rx="14" ry="3" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.8" fill="none" />

            {/* Labels */}
            <text x="40" y="58" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">ASCENT</text>
            <line x1="80" y1="55" x2="135" y2="62" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="42" y="130" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">DESCENT</text>
            <line x1="80" y1="127" x2="110" y2="125" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="232" y="200" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">FOOT PAD</text>
        </svg>
    </SchematicWrapper>
);

// VEHICLE 04: IY MANGAL — Interplanetary Starship
const RocketMangal = () => (
    <SchematicWrapper className="h-56 md:h-72">
        <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-md">
            {/* Reticle */}
            <line x1="0" y1="140" x2="40" y2="140" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="280" y1="140" x2="320" y2="140" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="160" y1="0" x2="160" y2="25" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />
            <line x1="160" y1="250" x2="160" y2="280" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.5" />

            {/* Upper stage (Starship) */}
            <path d="M140 35 Q160 18 180 35 L180 130 L140 130 Z" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1" fill="none" />
            <line x1="140" y1="65" x2="180" y2="65" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="140" y1="90" x2="180" y2="90" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="140" y1="115" x2="180" y2="115" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />

            {/* Portholes */}
            <circle cx="160" cy="55" r="2" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            <circle cx="160" cy="75" r="2" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />

            {/* Forward fins (top) */}
            <path d="M140 45 L122 60 L140 70 Z" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            <path d="M180 45 L198 60 L180 70 Z" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />

            {/* Aft fins (bottom of upper stage) */}
            <path d="M140 105 L115 130 L140 130 Z" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />
            <path d="M180 105 L205 130 L180 130 Z" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" fill="none" />

            {/* Booster */}
            <rect x="140" y="135" width="40" height="95" rx="2" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1" fill="none" />
            <line x1="140" y1="160" x2="180" y2="160" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="140" y1="185" x2="180" y2="185" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />
            <line x1="140" y1="210" x2="180" y2="210" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.5" />

            {/* Grid fins */}
            <rect x="128" y="142" width="12" height="18" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.8" fill="none" />
            <line x1="128" y1="148" x2="140" y2="148" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />
            <line x1="128" y1="154" x2="140" y2="154" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />
            <line x1="132" y1="142" x2="132" y2="160" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />
            <line x1="136" y1="142" x2="136" y2="160" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />

            <rect x="180" y="142" width="12" height="18" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.8" fill="none" />
            <line x1="180" y1="148" x2="192" y2="148" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />
            <line x1="180" y1="154" x2="192" y2="154" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />
            <line x1="184" y1="142" x2="184" y2="160" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />
            <line x1="188" y1="142" x2="188" y2="160" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.4" />

            {/* Raptor engine cluster */}
            <ellipse cx="160" cy="237" rx="22" ry="4" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" fill="none" />
            {[145, 153, 161, 169, 175].map((cx, i) => (
                <ellipse key={i} cx={cx} cy={234 + (i === 2 ? 4 : 0)} rx="4" ry="2" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" fill="none" />
            ))}

            {/* Labels */}
            <text x="42" y="60" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">UPPER STAGE</text>
            <line x1="100" y1="58" x2="140" y2="58" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="210" y="155" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">GRID FIN</text>
            <line x1="208" y1="152" x2="194" y2="150" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
            <text x="50" y="240" fill="#ffffff" fillOpacity="0.4" fontSize="7" fontFamily="ui-monospace,monospace" letterSpacing="1.2">RAPTOR CLUSTER</text>
            <line x1="115" y1="237" x2="138" y2="237" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.5" />
        </svg>
    </SchematicWrapper>
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

    const FLEET = [
        {
            num: '01', code: 'IY-A1', name: 'IY Aurora', class: 'Orbital',
            altitude: '400 KM', duration: '72 HRS', crew: '6 PAX',
            desc: 'Your first step beyond the atmosphere. Aurora carries 6 passengers to 400km altitude for 3-day orbital stays with panoramic Earth views.',
            Rocket: RocketAurora,
        },
        {
            num: '02', code: 'IY-H2', name: 'IY Horizon', class: 'Deep Space',
            altitude: '2.7 AU', duration: '180 DAYS', crew: '4 PAX',
            desc: "Built for the long voyage. Horizon's ion propulsion carries research teams to the asteroid belt, opening a new era of scientific tourism.",
            Rocket: RocketHorizon,
        },
        {
            num: '03', code: 'IY-S3', name: 'IY Selene', class: 'Lunar',
            altitude: '384K KM', duration: '7 DAYS', crew: '2 PAX',
            desc: 'Walk on the Moon. Selene touches down in the Sea of Tranquility, offering the first commercial lunar surface stays — 72 hours under the stars.',
            Rocket: RocketSelene,
        },
        {
            num: '04', code: 'IY-M4', name: 'IY Mars', class: 'Interplanetary',
            altitude: '225M KM', duration: '6 MONTHS', crew: '100 PAX',
            desc: 'IY Mars — named after the red planet (Mangal in Sanskrit) — our vision for multi-month interplanetary transit. Humanity\'s next chapter.',
            Rocket: RocketMangal,
        },
    ];

    const TIMELINE = [
        { phase: 'Phase 0', year: '2026', title: 'Earth Mastered', desc: 'Complete the foundation of terrestrial operations and infrastructure.' },
        { phase: 'Phase I', year: '2028', title: 'Stratosphere Tours', desc: 'Begin commercial flights to the edge of space — high-altitude tourism.' },
        { phase: 'Phase II', year: '2031', title: 'Orbital Stays', desc: 'First passengers stay aboard low-Earth orbit habitats — 3-day cycles.' },
        { phase: 'Phase III', year: '2035', title: 'The Moon', desc: 'Commercial lunar surface stays in the Sea of Tranquility.' },
        { phase: 'Phase IV', year: '2040+', title: 'Mars & Beyond', desc: 'Multi-month Mars transit, the beginning of interplanetary civilization.' },
    ];

    return (
        <>
            <Helmet>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
            </Helmet>

            <div
                className="bg-black text-white min-h-screen relative overflow-x-hidden antialiased"
                style={{
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    cursor: "none"
                }}
            >
                <CustomCursor />

                {/* ── Subtle Background ── */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0"
                        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)' }} />
                    <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }} />
                </div>
                <StarField />

                {/* Share URL Banner */}
                {showShareBanner && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="fixed top-[80px] left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md border border-white/15 px-6 py-3 text-center text-white font-mono text-[13px] tracking-[2px]"
                    >
                        Someone shared their mission with you. This is what awaits humanity.
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════
                    NAVBAR — SpaceX style
                ══════════════════════════════════════════ */}
                <nav className="fixed top-0 left-0 w-full z-[100] bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
                    {/* Matched container to footer: same px + max-w-7xl mx-auto so logos line up vertically */}
                    <div className="px-6 md:px-16 lg:px-24 h-[68px]">
                        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                            <Link to="/" className="flex flex-col items-center">
                                <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-[13px] tracking-[2.5px] text-white">
                                    INFINITE YATRA
                                </span>
                                <span className="font-mono text-[10px] tracking-[3px] text-white/40 mt-0.5 text-center">
                                    EXPLORE INFINITE
                                </span>
                            </Link>

                            <Link to="/"
                                className="group flex items-center gap-1.5 border border-white/30 hover:bg-white hover:text-black hover:border-white px-3 md:px-4 py-1.5 md:py-2 transition-all duration-500 shrink-0">
                                <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-[10px] md:text-[13px] tracking-[2px] md:tracking-[3px] font-medium whitespace-nowrap">
                                    ← <span className="hidden sm:inline">RETURN TO </span>EARTH
                                </span>
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* ══════════════════════════════════════════
                    SECTION 0: HERO — full-bleed bottom-left
                ══════════════════════════════════════════ */}
                <section id="hero" className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden z-20" style={{scrollMarginTop: "80px"}}>
                    {/* Centered top text */}
                    <div className="absolute top-[100px] left-0 w-full text-center">
                        <FadeUp delay={0.3}>
                            <p className="font-mono text-[12px] tracking-[3px] text-white/40">
                                MISSION BRIEF · CLASSIFIED · INITIATED 2026
                            </p>
                        </FadeUp>
                    </div>

                    <div className="relative z-10 px-6 md:px-16 lg:px-24 pb-12 md:pb-32">
                        <div className="max-w-7xl mx-auto">
                            <FadeUp delay={0.5}>
                                <p className="font-mono text-[13px] tracking-[2.5px] text-white/50 mb-6">
                                    00 — SPACE PROGRAM
                                </p>
                            </FadeUp>

                            <FadeUp delay={0.7}>
                                <h1 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[0.95] tracking-tight mb-8 max-w-full"
                                    style={{
                                        fontSize: 'clamp(36px, 9vw, 150px)',
                                        overflowWrap: 'normal',
                                        wordBreak: 'keep-all'
                                    }}>
                                    INFINITE<br />YATRA
                                </h1>
                            </FadeUp>

                            <FadeUp delay={0.9}>
                                <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl">
                                    <p className="text-white/70 text-lg md:text-xl leading-relaxed font-light"
                                        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif", textTransform: 'lowercase' }}>
                                        The journey doesn't end on Earth. One day, Infinite Yatra will take travelers beyond our planet — and into the infinite.
                                    </p>
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <span className="font-mono text-[12px] tracking-[2px] text-white/40">PROGRAM</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-wider text-white">SPACE</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <span className="font-mono text-[12px] tracking-[2px] text-white/40">FLEET</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-wider text-white">4 VEHICLES</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <span className="font-mono text-[12px] tracking-[2px] text-white/40">STATUS</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-wider text-white flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                DEVELOPMENT
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </FadeUp>
                        </div>
                    </div>

                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40"
                    >
                        <span className="font-mono text-[13px] tracking-[3px] text-white/60">SCROLL</span>
                        <ChevronDown size={12} className="text-white/60" />
                    </motion.div>
                </section>

                <div className="px-6 md:px-16 lg:px-24 relative z-20">
                    <div className="max-w-7xl mx-auto h-[1px] bg-white/10" />
                </div>

                {/* ══════════════════════════════════════════
                    SECTION 1: FLEET
                ══════════════════════════════════════════ */}
                <section id="fleet" style={{scrollMarginTop: "80px"}} className="relative px-6 md:px-16 lg:px-24 py-20 md:py-40 z-20">
                    <div className="max-w-7xl mx-auto">
                        <FadeUp>
                            <div className="flex items-center gap-3 mb-12">
                                <span className="font-mono text-[13px] text-white/40 tracking-[2px]">01</span>
                                <div className="w-8 h-[1px] bg-white/20" />
                                <span className="font-mono text-[13px] text-white/60 tracking-[3px]">THE FLEET</span>
                            </div>
                        </FadeUp>

                        <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-20">
                            <div className="md:col-span-7 min-w-0">
                                <FadeUp delay={0.1}>
                                    <h2 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[1.05] tracking-tight"
                                        style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
                                        Four vehicles. One trajectory.
                                    </h2>
                                </FadeUp>
                            </div>
                            <div className="md:col-span-5 md:pt-2">
                                <FadeUp delay={0.2}>
                                    <p className="text-white/60 text-base leading-relaxed font-light"
                                        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                                        Each vehicle in the Infinite Yatra fleet is engineered for a distinct phase of human expansion — from orbital tourism to interplanetary transit.
                                    </p>
                                </FadeUp>
                            </div>
                        </div>

                        {/* Fleet grid — SpaceX-style tile layout */}
                        <div className="grid md:grid-cols-2 gap-px bg-white/10">
                            {FLEET.map((v, i) => (
                                <FadeUp key={v.code} delay={0.1 * i}>
                                    <div className="bg-black p-8 md:p-10 h-full group hover:bg-white/[0.02] transition-colors duration-500">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-mono text-[12px] tracking-[3px] text-white/30">{v.num} / {v.code}</p>
                                            <p className="font-mono text-[12px] tracking-[3px] text-white/40">{v.class}</p>
                                        </div>

                                        <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-3xl text-white tracking-tight mb-2">
                                            {v.name}
                                        </h3>

                                        {/* Rocket SVG */}
                                        <div className="my-4 opacity-90">
                                            <v.Rocket />
                                        </div>

                                        {/* Specs row */}
                                        <div className="grid grid-cols-3 gap-3 border-y border-white/10 py-4 mb-5">
                                            <div>
                                                <p className="font-mono text-[13px] tracking-[2px] text-white/40 mb-1">ALTITUDE</p>
                                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white">{v.altitude}</p>
                                            </div>
                                            <div>
                                                <p className="font-mono text-[13px] tracking-[2px] text-white/40 mb-1">DURATION</p>
                                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white">{v.duration}</p>
                                            </div>
                                            <div>
                                                <p className="font-mono text-[13px] tracking-[2px] text-white/40 mb-1">CREW</p>
                                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white">{v.crew}</p>
                                            </div>
                                        </div>

                                        <p className="text-white/60 text-sm leading-relaxed font-light"
                                            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                                            {v.desc}
                                        </p>
                                    </div>
                                </FadeUp>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="px-6 md:px-16 lg:px-24 relative z-20">
                    <div className="max-w-7xl mx-auto h-[1px] bg-white/10" />
                </div>

                {/* ══════════════════════════════════════════
                    SECTION 2: TIMELINE
                ══════════════════════════════════════════ */}
                <section id="timeline" style={{scrollMarginTop: "80px"}} className="relative px-6 md:px-16 lg:px-24 py-20 md:py-40 z-20">
                    <div className="max-w-7xl mx-auto">
                        <FadeUp>
                            <div className="flex items-center gap-3 mb-12">
                                <span className="font-mono text-[13px] text-white/40 tracking-[2px]">02</span>
                                <div className="w-8 h-[1px] bg-white/20" />
                                <span className="font-mono text-[13px] text-white/60 tracking-[3px]">PROGRAM TIMELINE</span>
                            </div>
                        </FadeUp>

                        <FadeUp delay={0.1}>
                            <h2 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[1.05] tracking-tight mb-20 max-w-5xl"
                                style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
                                Earth, then orbit, then the Moon, then beyond.
                            </h2>
                        </FadeUp>

                        <div className="space-y-px bg-white/10">
                            {TIMELINE.map((item, i) => (
                                <FadeUp key={i} delay={0.08 * i}>
                                    <div className="bg-black px-2 md:px-6 py-10 grid grid-cols-12 gap-6">
                                        <div className="col-span-12 md:col-span-2">
                                            <p className="font-mono text-[12px] tracking-[2px] text-white/40 mb-1">{item.phase}</p>
                                            <p className="font-mono text-[13px] text-white/50 tracking-[2px]">{item.year}</p>
                                        </div>
                                        <div className="col-span-12 md:col-span-4">
                                            <h3 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-2xl md:text-3xl text-white tracking-tight">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <div className="col-span-12 md:col-span-6">
                                            <p className="text-white/60 text-base leading-relaxed font-light"
                                                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </FadeUp>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="px-6 md:px-16 lg:px-24 relative z-20">
                    <div className="max-w-7xl mx-auto h-[1px] bg-white/10" />
                </div>

                {/* ══════════════════════════════════════════
                    SECTION 3: RESERVE
                ══════════════════════════════════════════ */}
                <section id="reservation" style={{scrollMarginTop: "80px"}} className="relative px-6 md:px-16 lg:px-24 py-20 md:py-40 z-20">
                    <div className="max-w-7xl mx-auto">
                        <FadeUp>
                            <div className="flex items-center gap-3 mb-12">
                                <span className="font-mono text-[13px] text-white/40 tracking-[2px]">03</span>
                                <div className="w-8 h-[1px] bg-white/20" />
                                <span className="font-mono text-[13px] text-white/60 tracking-[3px]">RESERVATION</span>
                            </div>
                        </FadeUp>

                        <div className="grid md:grid-cols-12 gap-12 items-end">
                            <div className="md:col-span-7 min-w-0">
                                <FadeUp delay={0.1}>
                                    <h2 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[0.95] tracking-tight mb-8 max-w-full"
                                        style={{ fontSize: 'clamp(28px, 5.5vw, 80px)' }}>
                                        Reserve<br />Your Seat.
                                    </h2>
                                </FadeUp>
                                <FadeUp delay={0.2}>
                                    <p className="text-white/65 text-lg leading-relaxed font-light max-w-xl mb-8"
                                        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                                        Today across Earth, tomorrow beyond it. Join the waitlist to be among the first travelers in the next era of human exploration.
                                    </p>
                                </FadeUp>

                                <FadeUp delay={0.3}>
                                    <button
                                        onClick={() => setIsWaitlistOpen(true)}
                                        className="group inline-flex items-center justify-between gap-8 px-8 py-5 border border-white/30 hover:bg-white hover:text-black hover:border-white transition-all duration-500 w-full sm:w-auto"
                                    >
                                        <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-[3px] font-medium">
                                            JOIN THE WAITLIST
                                        </span>
                                        <span className="inline-flex items-center justify-center w-6 h-6 transition-transform duration-500 group-hover:translate-x-1">
                                            →
                                        </span>
                                    </button>
                                </FadeUp>
                            </div>

                            <div className="md:col-span-5 min-w-0">
                                <FadeUp delay={0.4}>
                                    <div className="border border-white/15 p-8">
                                        <p className="font-mono text-[12px] tracking-[3px] text-white/40 mb-6">FLIGHT MANIFEST</p>
                                        <div className="space-y-4">
                                            {[
                                                { k: 'PROGRAM', v: 'INFINITE YATRA' },
                                                { k: 'OPERATOR', v: 'IY SPACE PROGRAM' },
                                                { k: 'DEPARTURE', v: 'TBD' },
                                                { k: 'CLASS', v: 'CIVILIAN' },
                                                { k: 'STATUS', v: 'WAITLIST OPEN' },
                                            ].map((row, i) => (
                                                <div key={i} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
                                                    <span className="font-mono text-[12px] tracking-[2px] text-white/40">{row.k}</span>
                                                    <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white">{row.v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </FadeUp>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="px-6 md:px-16 lg:px-24 relative z-20">
                    <div className="max-w-7xl mx-auto h-[1px] bg-white/10" />
                </div>

                {/* ══════════════════════════════════════════
                    SECTION 4: THE ASCENSION PROJECT
                ══════════════════════════════════════════ */}
                <section id="ascension" style={{scrollMarginTop: "80px"}} className="relative w-full py-32 px-6 md:px-16 z-20">
                    <div className="max-w-7xl mx-auto">
                        <FadeUp>
                            <div className="flex items-center gap-3 mb-12">
                                <span className="font-mono text-[13px] text-white/40 tracking-[2px]">04</span>
                                <div className="w-8 h-[1px] bg-white/20" />
                                <span className="font-mono text-[13px] text-white/60 tracking-[3px]">BEYOND THE JOURNEY</span>
                            </div>
                        </FadeUp>

                        {/* Title row — full width, no overflow */}
                        <FadeUp delay={0.1}>
                            <h2 className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white leading-[0.95] tracking-tight mb-4 max-w-full"
                                style={{ fontSize: 'clamp(28px, 6vw, 84px)' }}>
                                THE ASCENSION<br />PROJECT
                            </h2>
                        </FadeUp>
                        <FadeUp delay={0.2}>
                            <p className="font-mono text-[13px] tracking-[2.5px] text-white/50 mb-16">
                                HUMANITY'S NEXT FRONTIER
                            </p>
                        </FadeUp>

                        {/* Meta + description row */}
                        <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-start mb-16">
                            <div className="md:col-span-7 md:pr-8">
                                <FadeUp delay={0.25}>
                                    <p className="text-white/65 text-base md:text-lg leading-relaxed font-light"
                                        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
                                        A long-term initiative focused on exploration, knowledge, AI, research, civilization development, and humanity's future beyond a single world.
                                    </p>
                                </FadeUp>
                            </div>

                            <div className="md:col-span-5 min-w-0">
                                <FadeUp delay={0.3}>
                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <span className="font-mono text-[12px] tracking-[2px] text-white/40">FOUNDER</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white">ARIUS RAYNOTT</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <span className="font-mono text-[12px] tracking-[2px] text-white/40">HORIZON</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white">MULTI-CENTURY</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <span className="font-mono text-[12px] tracking-[2px] text-white/40">STATUS</span>
                                            <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-xs tracking-wider text-white flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                ACTIVE
                                            </span>
                                        </div>
                                    </div>
                                </FadeUp>
                            </div>
                        </div>

                        <FadeUp delay={0.4}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 mb-12">
                                {[
                                    { num: '01', label: 'EXPLORATION' },
                                    { num: '02', label: 'KNOWLEDGE' },
                                    { num: '03', label: 'AI RESEARCH' },
                                    { num: '04', label: 'CIVILIZATION' },
                                ].map((pillar) => (
                                    <div key={pillar.num} className="bg-black p-6">
                                        <p className="font-mono text-[12px] tracking-[2px] text-white/40 mb-2">{pillar.num}</p>
                                        <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-wider text-white">{pillar.label}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeUp>

                        <FadeUp delay={0.5}>
                            <Link
                                to="/ascension-project"
                                className="group inline-flex items-center justify-between gap-8 px-8 py-5 border border-white/30 hover:bg-white hover:text-black hover:border-white transition-all duration-500 w-full md:w-auto"
                            >
                                <span className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] text-sm tracking-[3px] font-medium">
                                    EXPLORE THE ASCENSION PROJECT
                                </span>
                                <span className="inline-flex items-center justify-center w-6 h-6 transition-transform duration-500 group-hover:translate-x-1">
                                    →
                                </span>
                            </Link>
                        </FadeUp>

                        <FadeUp delay={0.6}>
                            <p className="font-mono text-[13px] italic text-white/40 tracking-[2px] mt-16 max-w-2xl">
                                "THIS IS NOT THE BEGINNING. THIS IS THE DECISION." — ARIUS RAYNOTT
                            </p>
                        </FadeUp>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    FOOTER
                ══════════════════════════════════════════ */}
                <footer className="border-t border-white/10 relative z-20">
                    <div className="px-6 md:px-16 lg:px-24 py-16 md:py-20">
                        <div className="max-w-7xl mx-auto">

                            {/* ── Top row: centered brand ── */}
                            <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                                <p className="font-['SpaceX',_'Helvetica_Neue',_sans-serif] font-bold text-white text-lg md:text-xl tracking-[3px] mb-2">
                                    INFINITE YATRA
                                </p>
                                <p className="font-mono text-[11px] tracking-[3px] text-white/40">
                                    EXPLORE INFINITE
                                </p>
                                <div className="w-12 h-[1px] bg-white/20 mt-6" />
                            </div>

                            {/* ── Link columns ── */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-12">
                                <div className="text-center md:text-left">
                                    <p className="font-mono text-[10px] tracking-[3px] text-white/40 mb-4">PROGRAM</p>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { label: 'THE FLEET', id: 'fleet' },
                                            { label: 'TIMELINE', id: 'timeline' },
                                            { label: 'RESERVATION', id: 'reservation' },
                                            { label: 'ASCENSION', id: 'ascension' },
                                        ].map(item => (
                                            <a key={item.id} href={`#${item.id}`}
                                                className="text-[12px] text-white/55 tracking-[2px] hover:text-white transition-colors">
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="font-mono text-[10px] tracking-[3px] text-white/40 mb-4">CONTACT</p>
                                    <div className="flex flex-col gap-2">
                                        <Link to="/contact" className="text-[12px] text-white/55 tracking-[2px] hover:text-white transition-colors">SUPPORT</Link>
                                        <Link to="/contact" className="text-[12px] text-white/55 tracking-[2px] hover:text-white transition-colors">PRESS</Link>
                                        <Link to="/careers" className="text-[12px] text-white/55 tracking-[2px] hover:text-white transition-colors">CAREERS</Link>
                                        <Link to="/contact" className="text-[12px] text-white/55 tracking-[2px] hover:text-white transition-colors">PARTNERS</Link>
                                    </div>
                                </div>

                                <div className="col-span-2 md:col-span-1 text-center md:text-right">
                                    <p className="font-mono text-[10px] tracking-[3px] text-white/40 mb-4">NAVIGATE</p>
                                    <div className="flex flex-col gap-2 items-center md:items-end">
                                        <Link to="/ascension-project" className="text-[12px] text-white/55 tracking-[2px] hover:text-white transition-colors">
                                            ASCENSION PROJECT
                                        </Link>
                                        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group text-[12px] tracking-[2px]">
                                            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
                                            RETURN TO EARTH
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[1px] bg-white/10 mb-6" />

                            {/* ── Bottom row: copyright + tagline ── */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-center">
                                <p className="font-mono text-[10px] tracking-[2px] text-white/30">
                                    © 2026 INFINITE YATRA SPACE PROGRAM · CLASSIFIED
                                </p>
                                <p className="font-mono text-[10px] italic tracking-[2px] text-white/30">
                                    TODAY ACROSS EARTH · TOMORROW BEYOND IT
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>

                <SpaceWaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
            </div>
        </>
    );
};

export default Future;
