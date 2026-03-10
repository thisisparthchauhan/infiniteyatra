import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

// --- SVGs ---
const RocketSVG = () => (
    <svg width="120" height="180" viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="44" y="90" width="32" height="60" fill="url(#mangal-grad)" />
        <defs>
            <linearGradient id="mangal-grad" x1="44" y1="0" x2="76" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F8FAFC" />
                <stop offset="1" stopColor="#475569" />
            </linearGradient>
        </defs>
        <path d="M44 110 H76 M44 130 H76" stroke="#94A3B8" strokeWidth="0.5" />
        <rect x="36" y="95" width="8" height="15" fill="#334155" />
        <path d="M36 98 H44 M36 101 H44 M36 104 H44 M36 107 H44 M39 95 V110 M41 95 V110" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />
        <rect x="76" y="95" width="8" height="15" fill="#334155" />
        <path d="M76 98 H84 M76 101 H84 M76 104 H84 M76 107 H84 M79 95 V110 M81 95 V110" stroke="#EF4444" strokeWidth="0.5" opacity="0.6" />
        <ellipse cx="60" cy="155" rx="14" ry="4" fill="#0F172A" />
        <ellipse cx="50" cy="153" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
        <ellipse cx="55" cy="154" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
        <ellipse cx="65" cy="154" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
        <ellipse cx="70" cy="153" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
        <ellipse cx="55" cy="150" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
        <ellipse cx="65" cy="150" rx="4" ry="2" fill="none" stroke="#64748B" strokeWidth="0.5" />
        <ellipse cx="60" cy="152" rx="4" ry="2" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
        <path d="M44 20 C44 20, 60 0, 76 20 V90 H44 Z" fill="url(#mangal-grad)" />
        <path d="M44 40 H76 M44 60 H76 M44 80 H76" stroke="#94A3B8" strokeWidth="0.5" />
        <path d="M52 20 V90 M60 20 V90 M68 20 V90" stroke="#94A3B8" strokeWidth="0.5" opacity="0.3" />
        <circle cx="60" cy="30" r="2" fill="#020617" />
        <circle cx="60" cy="40" r="2" fill="#020617" />
        <circle cx="60" cy="54" r="3.5" fill="#020617" />
        <path d="M58 52 Q60 50 62 52" stroke="#FFFFFF" strokeWidth="0.5" fill="none" />
        <rect x="44" y="65" width="32" height="6" fill="#7F1D1D" opacity="0.8" />
        <text x="60" y="69.5" fill="#FFFFFF" fontSize="4" fontFamily="Orbitron" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">INFINITE YATRA</text>
        <path d="M44 25 L38 35 L44 40 Z" fill="#94A3B8" />
        <path d="M76 25 L82 35 L76 40 Z" fill="#94A3B8" />
        <path d="M44 70 L34 85 L44 90 Z" fill="#94A3B8" />
        <path d="M76 70 L86 85 L76 90 Z" fill="#94A3B8" />
    </svg>
);

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

// --- Utils ---
const generateAllCountries = () => {
    try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        const isoCountries = ['AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MK', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW'];
        return isoCountries.map(code => regionNames.of(code)).filter(Boolean).sort((a, b) => a.localeCompare(b));
    } catch {
        return ["United States", "United Kingdom", "Canada", "Australia", "India", "Germany", "France", "Japan", "United Arab Emirates", "Singapore"];
    }
};

const COUNTRIES = generateAllCountries();

// --- Main Component ---
const SpaceWaitlistModal = ({ isOpen, onClose }) => {
    // Phase states: 'form' -> 'blackout' -> 'terminal' -> 'launch' -> 'warp' -> 'card'
    const [phase, setPhase] = useState('form');
    
    // Form Data
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dob: '', email: '', phone: '',
        country: '', missionChoice: '', seriousness: ''
    });
    const [errors, setErrors] = useState({});
    
    // Captured state for animation sequence
    const [capturedData, setCapturedData] = useState(null);
    const [missionID, setMissionID] = useState('');
    
    // Terminal state
    const [terminalLines, setTerminalLines] = useState([]);
    
    // Final state flags
    const [shareState, setShareState] = useState('idle'); // 'idle' | 'generating' | 'success'
    const [showButtons, setShowButtons] = useState(false);

    // Refs
    const warpCanvasRef = useRef(null);
    const terminalFullText = useRef([]);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setPhase('form');
            setFormData({ firstName: '', lastName: '', dob: '', email: '', phone: '', country: '', missionChoice: '', seriousness: '' });
            setErrors({});
            setCapturedData(null);
            setTerminalLines([]);
            setShowButtons(false);
            setShareState('idle');
        }
    }, [isOpen]);

    // Validation
    const validateForm = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = "Required";
        if (!formData.lastName.trim()) newErrors.lastName = "Required";
        if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Valid email required";
        if (!formData.phone || formData.phone.length < 5) newErrors.phone = "Required";
        if (!formData.country) newErrors.country = "Required";
        if (!formData.missionChoice) newErrors.missionChoice = "Required";
        if (!formData.seriousness) newErrors.seriousness = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    // Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Generate ID early to show in terminal
        const year = Math.floor(Math.random() * 10) + 2031;
        const num = String(Math.floor(Math.random() * 9000) + 1000);
        const newMissionID = `IY-${year}-${num}`;
        
        setMissionID(newMissionID);
        setCapturedData({ ...formData });

        // Push to Firebase instantly without waiting
        addDoc(collection(db, 'space_waitlist'), {
            ...formData,
            missionID: newMissionID,
            createdAt: serverTimestamp(),
            status: 'pending'
        }).catch(err => console.error(err));

        // Start Cinematic Sequence: Blackout
        setPhase('blackout');
    };

    // --- Cinematic Sequence Orchestrator ---
    useEffect(() => {
        if (phase === 'blackout') {
            // After blackout (0.5s), start terminal
            const t = setTimeout(() => setPhase('terminal'), 500);
            return () => clearTimeout(t);
        }
        
        if (phase === 'terminal' && capturedData) {
            // Typewriter effect logic
            const lines = [
                "MISSION CONTROL — INDIA",
                "INITIALIZING CANDIDATE PROFILE...",
                `NAME: ${capturedData.firstName.toUpperCase()} ${capturedData.lastName.toUpperCase()}`,
                `MISSION: ${capturedData.missionChoice.toUpperCase()}`,
                "CLEARANCE LEVEL: EXPLORER CLASS",
                `MISSION ID: ${missionID}`,
                "STATUS: CONFIRMED ✓"
            ];
            terminalFullText.current = lines;
            
            let currentLineIdx = 0;
            let currentCharIdx = 0;
            const tempLines = [];

            const typeWriter = () => {
                if (currentLineIdx >= lines.length) {
                    // Terminal done after 3s total phase time
                    setTimeout(() => setPhase('launch'), 800);
                    return;
                }

                if (currentCharIdx === 0) { tempLines[currentLineIdx] = "> "; }
                
                tempLines[currentLineIdx] += lines[currentLineIdx][currentCharIdx];
                setTerminalLines([...tempLines]); // Trigger re-render
                
                currentCharIdx++;
                
                if (currentCharIdx >= lines[currentLineIdx].length) {
                    currentLineIdx++;
                    currentCharIdx = 0;
                    setTimeout(typeWriter, 150); // Pause between lines
                } else {
                    setTimeout(typeWriter, 15); // Letter interval
                }
            };

            typeWriter();
        }

        if (phase === 'launch') {
            const t = setTimeout(() => setPhase('warp'), 3500);
            return () => clearTimeout(t);
        }

        if (phase === 'warp') {
            // Screen flashes white then pure black
            const t = setTimeout(() => setPhase('card'), 1500);
            return () => clearTimeout(t);
        }

        if (phase === 'card') {
            // Reveal buttons slightly after card
            const t1 = setTimeout(() => setShowButtons(true), 1200);
            return () => clearTimeout(t1);
        }
    }, [phase, capturedData, missionID]);


    // --- Warp Canvas Logic ---
    useEffect(() => {
        if ((phase === 'launch' || phase === 'warp') && warpCanvasRef.current) {
            const canvas = warpCanvasRef.current;
            const ctx = canvas.getContext('2d');
            let animationFrame;
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const lines = Array.from({ length: phase === 'warp' ? 200 : 80 }).map(() => ({
                angle: Math.random() * Math.PI * 2,
                length: Math.random() * 20,
                speed: phase === 'warp' ? Math.random() * 15 + 10 : Math.random() * 5 + 2,
                distance: phase === 'warp' ? Math.random() * 100 + 50 : Math.random() * 100
            }));

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            const draw = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = phase === 'warp' ? 0.9 : 0.6;
                ctx.strokeStyle = '#FFFFFF';

                lines.forEach(line => {
                    const startX = cx + Math.cos(line.angle) * line.distance;
                    const startY = cy + Math.sin(line.angle) * line.distance;
                    const endX = cx + Math.cos(line.angle) * (line.distance + line.length);
                    const endY = cy + Math.sin(line.angle) * (line.distance + line.length);

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    line.distance += line.speed;
                    line.length += line.speed * (phase === 'warp' ? 0.5 : 0.2);

                    if (line.distance > Math.max(cx, cy) * 1.5) {
                        line.distance = Math.random() * 50;
                        line.length = Math.random() * 10;
                    }
                });

                animationFrame = requestAnimationFrame(draw);
            };
            draw();

            return () => cancelAnimationFrame(animationFrame);
        }
    }, [phase]);


    // --- Share Copy ---
    const handleShare = async () => {
        if (shareState === 'generating') return;
        setShareState('generating');
        
        try {
            const cardEl = document.getElementById('missionCard');
            if (!cardEl) {
                setShareState('idle');
                return;
            }

            const canvas = await html2canvas(cardEl, {
                backgroundColor: '#0D0824',
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const shareText = `🚀 I just reserved my seat on Infinite Yatra's Space Program.\n\nMission ID: ${missionID}\nStatus: WAITLISTED — Explorer Class\n\n"Today across Earth... tomorrow beyond it."\n\n🌍 See the future: https://infiniteyatra.com/future?ref=mission-share`;
            
            const handleFallback = async () => {
                // A) Download PNG Fallback
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `IY-Mission-${missionID}.png`;
                link.href = imgData;
                link.click();
                
                // B) Copy to clipboard Fallback
                try { await navigator.clipboard.writeText(shareText); } catch(e) {}
                
                setShareState('success');
                setTimeout(() => setShareState('idle'), 4000);
            };

            // Attempt Native Web Share API (Mobile/Desktop supported targeting WhatsApp, Instagram, Telegram etc)
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    await handleFallback();
                    return;
                }
                
                // Force copy caption to clipboard for user convenience (some apps drop caption if only file is shared)
                try {
                    await navigator.clipboard.writeText(shareText);
                    toast.success("Caption copied to clipboard! Paste it anywhere.", { duration: 3000, style: { background: '#0A0618', color: '#00D4FF', border: '1px solid rgba(123,47,255,0.4)', fontFamily: 'Exo 2' } });
                } catch(e) {}

                const file = new File([blob], `IY-Mission-${missionID}.png`, { type: 'image/png' });
                
                // Sharing ONLY the file ensures the image is actually attached to Instagram / WhatsApp
                // The URL and Text are dropped when sharing pure images via Android Intents reliably
                const shareData = {
                    files: [file]
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    try {
                        await navigator.share(shareData);
                        setShareState('success');
                        setTimeout(() => setShareState('idle'), 4000);
                    } catch (error) {
                        // User cancelled out of the native share popup
                        if (error.name === 'AbortError') {
                            setShareState('idle');
                        } else {
                            await handleFallback();
                        }
                    }
                } else {
                    // Browser doesn't support file sharing (e.g., standard Desktop Chrome)
                    await handleFallback();
                }
            }, 'image/png');
            
        } catch (error) {
            console.error("Failed to generate mission card:", error);
            setShareState('idle');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-['Exo_2']">
            {/* --- PHASE 0: FORM BACKDROP --- */}
            <div 
                className={`absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-500 ${phase !== 'form' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onClick={onClose}
            ></div>

            {/* --- MULTI-PHASE FULLSCREEN OVERLAY --- */}
            {phase !== 'form' && (
                <div className={`absolute inset-0 bg-black transition-opacity duration-500 flex items-center justify-center overflow-hidden
                    ${phase === 'launch' ? 'shake-overlay' : ''}
                `}>
                    
                    {/* CANVAS WARP */}
                    {(phase === 'launch' || phase === 'warp') && (
                        <canvas ref={warpCanvasRef} className="absolute inset-0 z-0" />
                    )}

                    {/* PHASE 2: TERMINAL */}
                    <AnimatePresence>
                        {phase === 'terminal' && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
                                className="relative z-10 w-full max-w-[480px] text-[#00D4FF] font-['Orbitron'] text-[13px] tracking-[2px] leading-relaxed"
                            >
                                {terminalLines.map((line, i) => (
                                    <div key={i}>
                                        <span className="text-[#7B2FFF] mr-2">{'>'}</span>
                                        {line.substring(2)}
                                        {i === terminalLines.length - 1 && <span className="animate-pulse ml-1">|</span>}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* PHASE 3: LAUNCH ROCKET & EARTHLINGS TEXT */}
                    {phase === 'launch' && (
                        <>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center earthlings-text-animation z-20 text-center w-full max-w-[800px] px-4 pointer-events-none">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,47,255,0.15)_0%,transparent_60%)] blur-[40px] z-[-1] w-[400px] h-[400px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                <h1 className="font-['Orbitron'] font-[900] tracking-[8px] text-transparent bg-clip-text bg-gradient-to-br from-white via-[#C8AAFF] to-[#7B2FFF] m-0" style={{ fontSize: 'clamp(28px, 5vw, 64px)' }}>
                                    WE ARE EARTHLINGS
                                </h1>
                                <p className="font-['Exo_2'] italic text-[16px] text-white/40 tracking-[2px] mt-2">
                                    "but the universe belongs to all of us."
                                </p>
                            </div>
                            
                            <div className="absolute left-1/2 -translate-x-1/2 rocket-launch-animation z-10 flex flex-col items-center">
                                <RocketSVG />
                                <div className="flex gap-1.5 opacity-90 -mt-1">
                                    <ThrusterPulse><div className="w-1.5 h-10 bg-gradient-to-b from-white via-orange-500 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
                                    <ThrusterPulse><div className="w-2 h-14 bg-gradient-to-b from-white via-orange-400 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
                                    <div style={{ transform: 'translateY(4px)' }}>
                                        <ThrusterPulse><div className="w-2.5 h-16 bg-gradient-to-b from-white via-yellow-400 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
                                    </div>
                                    <ThrusterPulse><div className="w-2 h-14 bg-gradient-to-b from-white via-orange-400 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
                                    <ThrusterPulse><div className="w-1.5 h-10 bg-gradient-to-b from-white via-orange-500 to-transparent blur-[1.5px] rounded-full" /></ThrusterPulse>
                                </div>
                                <div className="w-8 h-[400px] mt-4 rocket-exhaust-trail"></div>
                            </div>
                        </>
                    )}

                    {/* PHASE 4: WARP FLASH */}
                    {phase === 'warp' && (
                        <div className="absolute inset-0 bg-white warp-flash-animation z-50 pointer-events-none"></div>
                    )}

                    {/* PHASE 5, 6, 7: MISSION CARD & PARTICLES */}
                    <AnimatePresence>
                        {phase === 'card' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="relative z-20 w-full max-w-[480px] px-4 -mt-20 flex flex-col items-center"
                            >
                                {/* Sonar Ring */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sonar-ring-animation z-0"></div>
                                
                                {/* CSS Particles via empty divs mapped manually or via css radial effect - simulated simply here */}
                                <div className="particle-burst-container absolute inset-0 pointer-events-none z-10">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                        <div key={i} className={`particle p${i}`}></div>
                                    ))}
                                </div>

                                {/* CARD */}
                                <div id="missionCard" className="relative z-20 w-full p-8 sm:p-12 border border-[rgba(123,47,255,0.4)] rounded shadow-[0_0_80px_rgba(123,47,255,0.25),_0_0_160px_rgba(123,47,255,0.1)]" style={{
                                    background: 'linear-gradient(145deg, #0D0824, #140A30)'
                                }}>
                                    {/* Corner Accents */}
                                    <div className="absolute top-0 right-0 w-8 h-[2px] bg-[#7B2FFF]"></div>
                                    <div className="absolute top-0 right-0 w-[2px] h-8 bg-[#7B2FFF] shadow-[0_0_10px_#7B2FFF]"></div>

                                    <div className="text-[12px] sm:text-[14px] font-['Orbitron'] text-white tracking-widest mb-4">
                                        🚀 MISSION FILE — CLASSIFIED
                                    </div>
                                    <hr className="border-[rgba(123,47,255,0.5)] mb-6" />

                                    <div className="font-['Orbitron'] text-[8px] sm:text-[9px] tracking-[3px] sm:tracking-[4px] text-[#7B2FFF] mb-1">ASTRONAUT CANDIDATE</div>
                                    <div className="font-['Orbitron'] font-black text-[22px] sm:text-[28px] tracking-[1px] sm:tracking-[2px] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#C8AAFF] to-[#7B2FFF] mb-2 leading-tight break-words">
                                        {capturedData?.firstName.toUpperCase()} {capturedData?.lastName.toUpperCase()}
                                    </div>
                                    <div className="font-['Orbitron'] text-[10px] sm:text-[11px] text-[#00D4FF] tracking-[2px] sm:tracking-[3px] mb-8">
                                        {missionID}
                                    </div>

                                    <hr className="border-[rgba(123,47,255,0.5)] mb-6" />

                                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                                        <div>
                                            <div className="font-['Orbitron'] text-[8px] sm:text-[9px] tracking-[1px] sm:tracking-[2px] text-[#A0AEC0] mb-2 leading-tight">MISSION</div>
                                            <div className="font-['Orbitron'] text-[10px] sm:text-[12px] text-white tracking-[0.5px] sm:tracking-[1px] leading-tight break-words pr-1">{capturedData?.missionChoice.toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <div className="font-['Orbitron'] text-[8px] sm:text-[9px] tracking-[1px] sm:tracking-[2px] text-[#A0AEC0] mb-2 leading-tight">STATUS</div>
                                            <div className="font-['Orbitron'] text-[10px] sm:text-[12px] text-white tracking-[0.5px] sm:tracking-[1px] leading-tight break-words">WAITLISTED</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-['Orbitron'] text-[8px] sm:text-[9px] tracking-[1px] sm:tracking-[2px] text-[#A0AEC0] mb-2 leading-tight">PRIORITY</div>
                                            <div className="font-['Orbitron'] text-[10px] sm:text-[12px] text-[#00D4FF] tracking-[0.5px] sm:tracking-[1px] leading-tight break-words">EXPLORER</div>
                                        </div>
                                    </div>

                                    <hr className="border-[rgba(123,47,255,0.5)] mb-6" />

                                    <div className="text-center font-['Exo_2'] text-[11px] sm:text-[13px] italic text-white/40 mb-8 px-2 sm:px-4 leading-relaxed">
                                        "We will contact you when humanity is ready.<br/>Stay grounded — for now."
                                    </div>

                                    <div className="flex justify-center mb-8">
                                        <div className="w-2.5 h-2.5 bg-[#00D4FF] rounded-full radar-dot-pulse"></div>
                                    </div>
                                    
                                    <div className="text-center font-['Orbitron'] text-[8px] sm:text-[9px] tracking-[3px] sm:tracking-[4px] text-[#7B2FFF]/60 w-full absolute bottom-4 left-0">
                                        INFINITE YATRA · SPACE PROGRAM<br/>
                                        <span className="text-white/30 text-[7px] sm:text-[8px] tracking-[1px] sm:tracking-[2px]">infiniteyatra.com/future</span>
                                    </div>
                                </div>

                                {/* BUTTONS */}
                                {showButtons && (
                                    <div className="flex flex-col w-full gap-3 mt-8 max-w-[400px]">
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                                            onClick={handleShare}
                                            disabled={shareState === 'generating'}
                                            className={`w-full py-4 font-['Orbitron'] text-[12px] font-bold tracking-[3px] rounded bg-transparent border border-[#00D4FF] transition-colors flex justify-center items-center gap-2
                                                ${shareState === 'success' ? 'text-green-400 border-green-400' : 'text-[#00D4FF] hover:bg-[#00D4FF]/10'}
                                            `}
                                        >
                                            {shareState === 'generating' ? (
                                                <><span className="animate-pulse">GENERATING CARD...</span></>
                                            ) : shareState === 'success' ? (
                                                <><Check size={16} /> <span>MISSION CARD SAVED ✓</span></>
                                            ) : (
                                                'SHARE YOUR MISSION'
                                            )}
                                        </motion.button>
                                        
                                        <AnimatePresence>
                                            {shareState === 'success' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                    className="w-full text-left font-['Exo_2']"
                                                >
                                                    <div className="flex items-center gap-2 text-[#00D4FF] font-['Orbitron'] text-[10px] tracking-[3px] mb-1">
                                                        <Check size={12} className="text-green-400" /> MISSION IMAGE SAVED OR SHARED
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[#00D4FF] font-['Orbitron'] text-[10px] tracking-[3px] mb-1">
                                                        <Check size={12} className="text-green-400" /> SHARE TEXT COPIED TO CLIPBOARD
                                                    </div>
                                                    <div className="text-white/40 italic text-[12px] pl-5 mt-2">
                                                        Post it anywhere — link is included.
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                                            onClick={onClose}
                                            className="w-full py-4 font-['Orbitron'] text-[12px] font-bold tracking-[3px] rounded bg-gradient-to-r from-[#7B2FFF] to-blue-600 text-white hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(123,47,255,0.4)]"
                                        >
                                            RETURN TO EARTH
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            )}

            {/* --- PHASE 1: MODAL FORM --- */}
            <AnimatePresence>
                {phase === 'form' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.4 } }}
                        className="relative w-full z-10 mx-4"
                        style={{
                            maxWidth: '560px',
                            background: '#0A0618',
                            border: '1px solid rgba(123,47,255,0.3)',
                            borderRadius: '4px'
                        }}
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-[#00D4FF] hover:text-white transition-colors cursor-pointer z-50">
                            <X size={24} strokeWidth={1.5} />
                        </button>

                        <div className="p-8">
                            <div className="text-center mb-8 mt-2">
                                <h2 className="font-['Orbitron'] font-[900] text-[24px] text-white tracking-[4px] mb-2 uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                                    JOIN THE WAITLIST
                                </h2>
                                <p className="font-['Exo_2'] text-[13px] text-white/50 tracking-wide">
                                    Secure your place in the future of human exploration.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <style dangerouslySetInnerHTML={{__html: `
                                    .dark-input { background: rgba(255,255,255,0.04) !important; border: 1px solid rgba(255,255,255,0.1) !important; padding: 12px 16px !important; border-radius: 2px !important; color: white !important; font-family: 'Exo 2', sans-serif !important; width: 100%; transition: border-color 0.2s; outline: none; height: 48px !important; }
                                    .dark-input:focus { border-color: #7B2FFF !important; }
                                    .dark-label { display: block; font-family: 'Orbitron', sans-serif; font-size: 9px; letter-spacing: 3px; color: #00FFFF; opacity: 0.8; margin-bottom: 6px; text-transform: uppercase; }
                                    .dark-select { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; }
                                    .dark-select option { background: #0A0618; color: white; }
                                    .phone-container .react-tel-input .form-control { background: rgba(255,255,255,0.04) !important; border: 1px solid rgba(255,255,255,0.1) !important; padding: 12px 16px !important; padding-left: 48px !important; border-radius: 2px !important; color: white !important; font-family: 'Exo 2', sans-serif !important; width: 100% !important; height: 48px !important; transition: border-color 0.2s; outline: none; }
                                    .phone-container .react-tel-input .form-control:focus { border-color: #7B2FFF !important; }
                                    .phone-container .react-tel-input .flag-dropdown { background: rgba(255,255,255,0.04) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-right: none !important; border-radius: 2px 0 0 2px !important; height: 48px !important; }
                                    .phone-container .react-tel-input .selected-flag { background: transparent !important; }
                                    .phone-container .react-tel-input .selected-flag:hover { background: rgba(255,255,255,0.1) !important; }
                                    .phone-container .react-tel-input .country-list { background: #0A0618 !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; margin-top: 4px; }
                                    .phone-container .react-tel-input .country-list .country:hover { background: rgba(123,47,255,0.3) !important; }
                                    .phone-container .react-tel-input .country-list .country.highlight { background: rgba(123,47,255,0.4) !important; }
                                `}} />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="dark-label">FIRST NAME*</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`dark-input ${errors.firstName ? '!border-red-500' : ''}`} placeholder="Enter first name" />
                                        {errors.firstName && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.firstName}</span>}
                                    </div>
                                    <div>
                                        <label className="dark-label">LAST NAME*</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`dark-input ${errors.lastName ? '!border-red-500' : ''}`} placeholder="Enter last name" />
                                        {errors.lastName && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.lastName}</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="dark-label">DATE OF BIRTH</label>
                                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="dark-input" style={{ colorScheme: 'dark' }} />
                                    </div>
                                    <div>
                                        <label className="dark-label">EMAIL*</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`dark-input ${errors.email ? '!border-red-500' : ''}`} placeholder="applicant@earth.com" />
                                        {errors.email && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.email}</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="phone-container">
                                        <label className="dark-label">PHONE NUMBER*</label>
                                        <PhoneInput
                                            country={'us'}
                                            preferredCountries={['in', 'us', 'gb', 'ae', 'sg']}
                                            value={formData.phone}
                                            onChange={val => { setFormData({ ...formData, phone: val }); if(errors.phone) setErrors({...errors, phone: null}); }}
                                            inputClass={errors.phone ? '!border-red-500' : ''}
                                        />
                                        {errors.phone && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.phone}</span>}
                                    </div>
                                    <div>
                                        <label className="dark-label">COUNTRY OF RESIDENCE*</label>
                                        <select name="country" value={formData.country} onChange={handleChange} className={`dark-input dark-select ${errors.country ? '!border-red-500' : ''}`}>
                                            <option value="" disabled>Select Locale</option>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        {errors.country && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.country}</span>}
                                    </div>
                                </div>

                                <div>
                                    <label className="dark-label mb-2">MISSION INTEREST*</label>
                                    <select name="missionChoice" value={formData.missionChoice} onChange={handleChange} className={`dark-input dark-select ${errors.missionChoice ? '!border-red-500' : ''}`}>
                                        <option value="" disabled>Select Target Destination</option>
                                        <option value="Orbital Stay (LEO)">Orbital Stay (LEO)</option>
                                        <option value="Moon Landing">Moon Landing</option>
                                        <option value="Mars Transit">Mars Transit</option>
                                        <option value="All Missions">All Missions</option>
                                    </select>
                                    {errors.missionChoice && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.missionChoice}</span>}
                                </div>

                                <div>
                                    <label className="dark-label mb-2">HOW SERIOUS ARE YOU?*</label>
                                    <select name="seriousness" value={formData.seriousness} onChange={handleChange} className={`dark-input dark-select ${errors.seriousness ? '!border-red-500' : ''}`}>
                                        <option value="" disabled>Select Intent</option>
                                        <option value="Just curious">Just curious</option>
                                        <option value="Definitely interested">Definitely interested</option>
                                        <option value="Ready to deposit">Ready to deposit</option>
                                    </select>
                                    {errors.seriousness && <span className="text-red-500 text-[10px] absolute mt-1 tracking-widest uppercase">{errors.seriousness}</span>}
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        className="w-full h-[52px] cursor-pointer flex justify-center items-center font-['Orbitron'] text-[12px] font-bold text-white tracking-[4px] border-0"
                                        style={{
                                            background: 'linear-gradient(135deg, #7B2FFF, #1A6FFF)',
                                            borderRadius: '2px',
                                            transition: 'box-shadow 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 40px rgba(123,47,255,0.6)'}
                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                                    >
                                        SUBMIT DIRECTORY
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Keyframes for Cinematic specific overrides */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                    0%   { transform: translateX(0) }
                    20%  { transform: translateX(-4px) }
                    40%  { transform: translateX(4px) }
                    60%  { transform: translateX(-3px) }
                    80%  { transform: translateX(3px) }
                    100% { transform: translateX(0) }
                }
                .shake-overlay {
                    animation: shake 0.15s ease-in-out infinite;
                }
                
                @keyframes rocketLaunch {
                    0% { bottom: -200px; }
                    100% { bottom: 130vh; }
                }
                .rocket-launch-animation {
                    position: absolute;
                    bottom: -200px;
                    animation: rocketLaunch 3s cubic-bezier(0.4, 0, 1, 1) forwards;
                    animation-delay: 0.5s;
                }

                @keyframes earthlingsReveal {
                    0%, 15% { opacity: 0; transform: translateY(20px); }
                    35% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
                .earthlings-text-animation {
                    animation: earthlingsReveal 3s forwards;
                    animation-delay: 0.5s;
                }

                @keyframes exhaustFade {
                    0% { opacity: 0; transform: scaleY(0.5); }
                    10% { opacity: 0.8; transform: scaleY(1); }
                    80% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
                .rocket-exhaust-trail {
                    background: linear-gradient(to bottom, rgba(255,150,50,0.6), transparent);
                    filter: blur(8px);
                    animation: exhaustFade 3.5s forwards;
                    transform-origin: top;
                }

                @keyframes flashWhite {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .warp-flash-animation {
                    animation: flashWhite 0.6s ease-out forwards;
                }

                @keyframes sonarPulse {
                    0% { width: 10px; height: 10px; opacity: 1; border-width: 2px; }
                    100% { width: 400px; height: 400px; opacity: 0; border-width: 1px; }
                }
                .sonar-ring-animation {
                    position: absolute;
                    border: 1px solid rgba(123,47,255,0.8);
                    border-radius: 50%;
                    animation: sonarPulse 1.2s ease-out forwards;
                }

                @keyframes radarDot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.3; }
                }
                .radar-dot-pulse {
                    animation: radarDot 2s infinite ease-in-out;
                }

                /* Precomputed Particles simply spread via CSS for performance mapping */
                ${Array.from({ length: 40 }).map((_, i) => `
                    @keyframes burstOut${i} {
                        0% { transform: rotate(${Math.random() * 360}deg) translateX(0) scale(1); opacity: 1; }
                        100% { transform: rotate(${Math.random() * 360}deg) translateX(${Math.random() * 200 + 100}px) scale(0); opacity: 0; }
                    }
                    .particle.p${i} {
                        position: absolute;
                        top: 50%; left: 50%;
                        width: ${Math.random() * 3 + 1}px; height: ${Math.random() * 3 + 1}px;
                        background: ${['#7B2FFF', '#00D4FF', '#ffffff', '#FFB347'][Math.floor(Math.random()*4)]};
                        border-radius: 50%;
                        animation: burstOut${i} ${Math.random() * 0.6 + 0.6}s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    }
                `).join('\n')}
            `}} />
        </div>
    );
};

export default SpaceWaitlistModal;
