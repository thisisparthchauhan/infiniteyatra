import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Rocket, Map, Phone, Mail, Instagram, ExternalLink, ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const XIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const ThreadsIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.005 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75c2.46 0 4.71-.915 6.45-2.43l-1.35-1.59c-1.395 1.215-3.195 1.95-5.1 1.95-4.23 0-7.65-3.42-7.65-7.65s3.42-7.65 7.65-7.65c4.155 0 7.545 3.285 7.65 7.41.045 1.845-.51 2.82-1.08 3.36-.39.375-.9.585-1.515.585-.855 0-1.455-.555-1.455-1.605V9.63c0-2.31-1.89-4.2-4.2-4.2-2.31 0-4.2 1.89-4.2 4.2s1.89 4.2 4.2 4.2c1.065 0 2.04-.405 2.79-1.065.645 1.11 1.695 1.89 3.03 1.89 1.47 0 2.64-.675 3.39-1.83.69-1.065.9-2.475.84-4.05-.135-5.295-4.455-9.525-9.75-9.525zm0 9.45c-1.155 0-2.1-.945-2.1-2.1s.945-2.1 2.1-2.1 2.1.945 2.1 2.1-.945 2.1-2.1 2.1z" />
    </svg>
);

const WhatsAppIcon = ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

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
                    <ActionButton href="https://api.whatsapp.com/send?phone=919265799325&text=Hey%20Infinite%20Yatra%20%F0%9F%91%8B%2C%20I%E2%80%99m%20interested%20in%20your%20tours.%20Please%20share%20more%20details%20%F0%9F%99%8F" icon={<WhatsAppIcon size={20} />} label="WhatsApp Us" />
                    <ActionButton href="tel:+919265799325" icon={<Phone size={20} />} label="Call Now" />

                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton href="https://instagram.com/infinite.yatra" icon={<Instagram size={20} />} label="Instagram" />
                        <ActionButton href="mailto:infiniteyatra@gmail.com" icon={<Mail size={20} />} label="Email" />
                    </div>

                    {/* New Social Media Section */}
                    <div className="flex justify-center gap-4 mt-6">
                        <SocialButton href="https://x.com/infiniteyatra" icon={XIcon} />
                        <SocialButton href="https://www.threads.com/@infinite.yatra" icon={ThreadsIcon} />
                        <SocialButton href="https://www.whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08" icon={WhatsAppIcon} />
                    </div>

                    <p className="text-center text-[10px] text-slate-600 tracking-wider mt-6">Designed for instant connection and zero friction.</p>

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

const SocialButton = ({ href, icon: Icon }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="p-3 bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 transition-all duration-300"
    >
        <Icon size={18} />
    </a>
);

export default QRLanding;
