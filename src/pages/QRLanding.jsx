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
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
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

            <div className="relative z-10 max-w-md mx-auto px-6 py-12 flex flex-col items-center">

                {/* Hero Section */}
                <motion.div
                    className="w-full flex flex-col items-center mb-16 relative"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent absolute top-1/2 -z-10"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                    />

                    <motion.div variants={itemVariants} className="text-center bg-black/50 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                        <h1 className="text-4xl font-bold tracking-widest text-white mb-2" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>
                            INFINITE YATRA
                        </h1>
                        <p className="text-xs tracking-[0.4em] text-blue-300 font-medium uppercase">Explore Infinite</p>
                    </motion.div>
                </motion.div>

                {/* Journey Timeline */}
                <motion.div
                    className="w-full space-y-12 mb-20"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                >
                    {/* Earth */}
                    <motion.div variants={itemVariants} className="relative pl-8 border-l border-blue-900/30">
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                        <div className="flex items-center gap-3 mb-2 text-blue-400">
                            <Map size={18} />
                            <span className="text-xs tracking-widest uppercase">Earth · Present</span>
                        </div>
                        <h2 className="text-xl font-light text-slate-200 mb-1">Rooted in real journeys.</h2>
                        <p className="text-sm text-slate-500">Built on real experiences.</p>
                    </motion.div>

                    {/* Global */}
                    <motion.div variants={itemVariants} className="relative pl-8 border-l border-purple-900/30">
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                            <Globe size={18} />
                            <span className="text-xs tracking-widest uppercase">Global · Expansion</span>
                        </div>
                        <h2 className="text-xl font-light text-slate-200 mb-1">Worldwide Tours</h2>
                        <p className="text-sm text-slate-500">Connecting continents.</p>
                    </motion.div>

                    {/* Space */}
                    <motion.div variants={itemVariants} className="relative pl-8 border-l-0">
                        <motion.div
                            variants={glowVariants}
                            animate="animate"
                            className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                        ></motion.div>
                        <div className="flex items-center gap-3 mb-2 text-white">
                            <Rocket size={18} />
                            <span className="text-xs tracking-widest uppercase">Space · Vision</span>
                        </div>
                        <h2 className="text-xl font-light text-white mb-1">Travel Without Limits</h2>
                        <div className="h-px w-20 bg-gradient-to-r from-white to-transparent my-3"></div>
                        <p className="text-sm text-slate-400 italic">"Local to Global · Earth to Space"</p>
                    </motion.div>
                </motion.div>

                {/* Action Grid */}
                <motion.div
                    className="w-full grid gap-4 mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <ActionButton href="/" icon={<ExternalLink size={18} />} label="Visit Website" primary />
                    <ActionButton href="https://wa.me/919876543210" icon={<Phone size={18} />} label="WhatsApp Us" />
                    <ActionButton href="tel:+919876543210" icon={<Phone size={18} />} label="Call Now" />

                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton href="https://instagram.com/infiniteyatra" icon={<Instagram size={18} />} label="Instagram" />
                        <ActionButton href="mailto:contact@infiniteyatra.com" icon={<Mail size={18} />} label="Email" />
                    </div>
                </motion.div>

                {/* Founder Section */}
                <motion.div
                    className="text-center opacity-80"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.8 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    <h3 className="text-white text-lg font-light tracking-wide mb-1">Parth Chauhan</h3>
                    <p className="text-blue-400 text-xs tracking-widest uppercase mb-4">Founder & Director</p>
                    <div className="w-8 h-8 mx-auto border border-white/20 rounded-full flex items-center justify-center">
                        <Star size={12} className="text-white" fill="currentColor" />
                    </div>
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
            ? 'bg-white text-black hover:scale-[1.02]'
            : 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10'
        }
    `;

    const content = (
        <>
            <div className="flex items-center gap-4">
                <span className={`${primary ? 'text-black' : 'text-blue-400'}`}>{icon}</span>
                <span className="font-medium tracking-wide text-sm">{label}</span>
            </div>
            <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 ${primary ? 'text-black' : 'text-white'}`} />

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </>
    );

    return isInternal ? (
        <Link to={href} className={classes}>{content}</Link>
    ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a>
    );
};

export default QRLanding;
