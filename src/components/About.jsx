import React, { useRef } from 'react';
import { Heart, Compass, Mountain, Shield, Globe, Users, Rocket, ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import parthImg from '../assets/parth-chauhan.jpg';
import msmeLogo from '../assets/msme-logo.png';

const About = () => {
    const ref = useRef(null);

    // Motion values for mouse position
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation
    const springConfig = { damping: 25, stiffness: 150 };
    const mouseX = useSpring(x, springConfig);
    const mouseY = useSpring(y, springConfig);

    const handleMouseMove = (e) => {
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    return (
        <section
            id="about"
            ref={ref}
            onMouseMove={handleMouseMove}
            className="py-24 relative z-10 overflow-hidden scroll-mt-28"
        >
            <div className="container mx-auto px-6">
                {/* Founder Section */}
                <div className="flex flex-col lg:flex-row gap-12 items-center mb-24">
                    <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-600 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <img
                                src={parthImg}
                                alt="Parth Chauhan"
                                className="relative z-10 w-48 h-48 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full whitespace-nowrap">
                                <p className="text-white font-bold text-sm">Parth Chauhan</p>
                                <p className="text-blue-400 text-xs text-center">Founder</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-2/3 text-center lg:text-left">
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                            Founder's Note
                        </h2>
                        <div className="glass-card p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[50px]"></div>
                            <p className="text-lg text-slate-300 leading-relaxed mb-6 italic relative z-10">
                                "I started Infinite Yatra with a simple belief — travel should do more than take you to places; it should change the way you see life. What began as a love for exploration and meaningful journeys turned into a mission to create travel experiences that feel personal, safe, and truly unforgettable."
                            </p>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-6">
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Our Vision 🚀</h3>
                                    <p className="text-slate-400 text-sm">
                                        From local treks to global journeys — and in the future, to pioneer new frontiers including space travel.
                                    </p>
                                </div>
                                <div className="text-2xl font-bold font-handwritten text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    Explore Infinite.
                                </div>
                            </div>

                            {/* MSME Badge */}
                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4">
                                <div className="h-10 w-fit bg-white rounded p-1 flex items-center justify-center shadow-lg">
                                    <img src={msmeLogo} alt="MSME" className="h-full w-auto object-contain" />
                                </div>
                                <div>
                                    <p className="text-white text-xs font-bold uppercase tracking-wider">Officially Registered</p>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Infinite Yatra is registered under <span className="text-blue-400 font-medium">MSME (Udyam)</span>, Government of India, ensuring trust & compliance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Why Trust Us & Differences Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Why Trust Infinite Yatra */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <Shield className="text-green-400" /> Why Trust Infinite Yatra
                        </h3>

                        <div className="grid gap-4">
                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Users size={20} />
                                </div>
                                <p className="text-slate-200 font-medium">Local & Global Experts</p>
                            </div>

                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                                    <Shield size={20} />
                                </div>
                                <p className="text-slate-200 font-medium">Safety-First Trips (India & International)</p>
                            </div>

                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
                                    <Compass size={20} />
                                </div>
                                <p className="text-slate-200 font-medium">Authentic, Real Experiences</p>
                            </div>

                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Globe size={20} />
                                </div>
                                <p className="text-slate-200 font-medium">Seamless International Travel Support</p>
                            </div>
                        </div>
                    </div>

                    {/* What Makes Us Different */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                            <Rocket className="text-purple-400" /> What Makes Us Different
                        </h3>

                        <div className="grid gap-4">
                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                                <p className="text-slate-200 font-medium">Community-based travel</p>
                            </div>

                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]"></div>
                                <p className="text-slate-200 font-medium">Spiritual + adventure balance</p>
                            </div>

                            <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                                <p className="text-slate-200 font-medium">Not mass tourism — curated for you</p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-8 pt-4">
                            <Link
                                to="/destinations"
                                className="w-full group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] transition-all duration-300"
                            >
                                <span>Explore Our Journeys</span>
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
