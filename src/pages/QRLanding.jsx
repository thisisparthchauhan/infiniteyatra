import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Rocket, Map, Phone, Mail, Instagram, ExternalLink, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const QRLanding = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.8, staggerChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const glowVariants = {
        animate: {
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
            {/* Background Animation */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black"></div>
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: Math.random() * 0.5 + 0.1,
                            scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [null, 0],
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: Math.random() * 2 + 'px',
                            height: Math.random() * 2 + 'px',
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-md mx-auto px-6 py-16 flex flex-col items-center">

                {/* Hero Section */}
                <motion.div
                    className="w-full flex flex-col items-center mb-16 relative"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent absolute top-1/2 -z-10"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                    />

                    <motion.div variants={itemVariants} className="text-center p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-blue-400 text-2xl">🔹</span>
                            <h1 className="text-3xl font-bold tracking-widest text-white leading-tight mb-1" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>
                                INFINITE YATRA
                            </h1>
                            <p className="text-sm tracking-[0.3em] text-slate-400 font-medium uppercase">Explore Infinite</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Journey Timeline */}
                <motion.div
                    className="w-full space-y-16 mb-24 pl-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                >
                    {/* Earth */}
                    <motion.div variants={itemVariants} className="relative pl-10 border-l border-blue-900/30 pb-4">
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                        <div className="flex items-center gap-3 mb-3 text-blue-400">
                            <span className="text-lg">🌍</span>
                            <span className="text-xs tracking-[0.2em] font-bold uppercase">EARTH · PRESENT</span>
                        </div>
                        <h2 className="text-xl font-light text-white mb-2 leading-tight">
                            Rooted in real journeys.<br />
                            <span className="font-bold">Built on real experiences.</span>
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed font-light">
                            Infinite Yatra began with authentic, on-ground travel experiences. Every journey is designed from real exploration, real planning, and real execution — not just theory.
                        </p>
                    </motion.div>

                    {/* Global */}
                    <motion.div variants={itemVariants} className="relative pl-10 border-l border-purple-900/30 pb-4">
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                        <div className="flex items-center gap-3 mb-3 text-purple-400">
                            <span className="text-lg">🌐</span>
                            <span className="text-xs tracking-[0.2em] font-bold uppercase">GLOBAL · EXPANSION</span>
                        </div>
                        <h2 className="text-xl font-light text-white mb-2 leading-tight">
                            Worldwide Tours<br />
                            <span className="font-bold">Connecting continents.</span>
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed font-light">
                            We are expanding from local and national travel to curated worldwide tours, connecting cultures, destinations, and people across continents through seamless travel experiences.
                        </p>
                    </motion.div>

                    {/* Space */}
                    <motion.div variants={itemVariants} className="relative pl-10 border-l-0">
                        <motion.div
                            variants={glowVariants}
                            animate="animate"
                            className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                        ></motion.div>
                        <div className="flex items-center gap-3 mb-3 text-white">
                            <span className="text-lg">🚀</span>
                            <span className="text-xs tracking-[0.2em] font-bold uppercase">SPACE · VISION</span>
                        </div>
                        <h2 className="text-xl font-light text-white mb-2 leading-tight">
                            Travel Without Limits<br />
                            <span className="font-bold italic text-blue-200">Local to Global · Earth to Space</span>
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed font-light">
                            Infinite Yatra is built with a future-first mindset. Our long-term vision goes beyond Earth — preparing for the next era of exploration where travel has no boundaries.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Action Buttons Header */}
                <motion.div
                    className="w-full mb-8 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <h3 className="text-xs tracking-[0.3em] font-bold uppercase text-slate-500 mb-6">🔘 Quick Connect Actions</h3>
                </motion.div>

                {/* Action Grid */}
                <motion.div
                    className="w-full grid gap-4 mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <ActionButton href="/" icon={<span className="text-lg">🌐</span>} label="Visit Website" primary />
                    <ActionButton href="https://wa.me/919876543210" icon={<span className="text-lg">📲</span>} label="WhatsApp Us" />
                    <ActionButton href="tel:+919876543210" icon={<span className="text-lg">📞</span>} label="Call Now" />

                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton href="https://instagram.com/infiniteyatra" icon={<span className="text-lg">📸</span>} label="Instagram" />
                        <ActionButton href="mailto:contact@infiniteyatra.com" icon={<span className="text-lg">✉️</span>} label="Email" />
                    </div>

                    <p className="text-center text-[10px] text-slate-600 tracking-wider mt-4">Designed for instant connection and zero friction.</p>

                </motion.div>

                {/* Founder Section */}
                <motion.div
                    className="text-center w-full pt-12 border-t border-white/5 relative"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 1 }}
                >
                    {/* Decorative Element */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center">
                        <Star size={10} className="text-slate-600" fill="currentColor" />
                    </div>

                    <div className="flex flex-col items-center gap-1 mb-4">
                        <span className="text-2xl mb-2">👤</span>
                        <h3 className="text-white text-xl font-light tracking-wide">Parth Chauhan</h3>
                        <p className="text-blue-400 text-[10px] tracking-[0.2em] uppercase font-bold">Founder & Director</p>
                    </div>

                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-light">
                        A founder-led brand driven by long-term vision, execution discipline, and future-scale ambition.
                    </p>
                </motion.div>

            </div>
        </div>
    );
};

const ActionButton = ({ href, icon, label, primary }) => {
    // Determine if internal or external link
    const isInternal = href.startsWith('/');
    const classes = `
      group relative w-full flex items-center justify-between p-4 rounded-xl 
      transition-all duration-300 overflow-hidden
      ${primary
            ? 'bg-white text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            : 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10'
        }
    `;

    const content = (
        <>
            <div className="flex items-center gap-4">
                <span>{icon}</span>
                <span className="font-medium tracking-wide text-sm">{label}</span>
            </div>

            {/* Arrow Icon */}
            <div className={`transform transition-transform duration-300 group-hover:translate-x-1 ${primary ? 'text-black' : 'text-slate-400 group-hover:text-white'}`}>
                <ArrowRight size={16} />
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </>
    );

    return isInternal ? (
        <Link to={href} className={classes}>{content}</Link>
    ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
    );
};

export default QRLanding;
