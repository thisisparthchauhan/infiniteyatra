import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bike, Zap, Car, Bus, Train, Plane, Rocket, Ship, ArrowRight
} from 'lucide-react';

const ALL_TRANSPORT = [
    {
        key: 'cycles',
        title: 'Cycles',
        desc: 'Eco-friendly short commutes',
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600',
        link: '/cycles',
        icon: Bike,
        accent: '#22c55e',
    },
    {
        key: 'bikes',
        title: 'Bikes',
        desc: 'Adventure ready motorcycles',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600',
        link: '/transportation/bikes',
        icon: Zap,
        accent: '#f97316',
    },
    {
        key: 'cars',
        title: 'Cars',
        desc: 'Self-Drive & Driven options',
        image: '/assets/transport/tesla_car.png',
        link: '/transportation/cars',
        icon: Car,
        accent: '#3b82f6',
    },
    {
        key: 'traveller',
        title: 'Traveller',
        desc: 'Group travels and vans',
        image: '/assets/transport/red-van-nature.jpg',
        link: '/transportation/traveller',
        icon: Bus,
        accent: '#eab308',
    },
    {
        key: 'bus',
        title: 'Bus',
        desc: 'Intercity luxury bus travel',
        image: '/assets/transport/bus.jpg',
        link: '/transportation/bus',
        icon: Bus,
        accent: '#14b8a6',
    },
    {
        key: 'trains',
        title: 'Trains',
        desc: 'Scenic railway journeys',
        image: '/assets/transport/jaden-william-qVeqpMrZQGk-unsplash.jpg',
        link: '/transportation/trains',
        icon: Train,
        accent: '#8b5cf6',
    },
    {
        key: 'flights',
        title: 'Flights',
        desc: 'Quick intercity routing',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600',
        link: '/transportation/flights',
        icon: Plane,
        accent: '#0ea5e9',
    },
    {
        key: 'private-aviation',
        title: 'Private Aviation',
        desc: 'Luxury charter flights',
        image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=600',
        link: '/private-aviation',
        icon: Rocket,
        accent: '#f59e0b',
    },
    {
        key: 'cruise',
        title: 'River Cruise',
        desc: 'Royal dining on the water',
        image: '/assets/transport/cruise.jpg',
        link: '/cruise',
        icon: Ship,
        accent: '#06b6d4',
    },
];

/**
 * Shows 4 other transport options at the bottom of any transport page.
 * @param {string} currentKey - Key of the current transport to exclude (e.g. 'cruise', 'cycles', 'cars')
 */
export default function ExploreOtherTransport({ currentKey }) {
    // Filter out current, then pick 4 (deterministic shuffle based on key)
    const others = ALL_TRANSPORT.filter(t => t.key !== currentKey);
    // Simple seeded shuffle: use currentKey length as seed offset
    const seed = currentKey ? currentKey.length : 0;
    const picked = others
        .sort((a, b) => {
            const ha = (a.key.charCodeAt(0) + seed) % others.length;
            const hb = (b.key.charCodeAt(0) + seed) % others.length;
            return ha - hb;
        })
        .slice(0, 4);

    return (
        <section className="py-20 relative" style={{ background: '#080b12' }}>
            {/* Top divider */}
            <div className="absolute top-0 left-0 w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

            <div className="max-w-[1100px] mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center justify-between mb-10"
                >
                    <div>
                        <p className="text-[11px] tracking-[0.25em] uppercase text-white/30 mb-2 font-medium">
                            More Ways to Travel
                        </p>
                        <h3 className="text-[clamp(24px,4vw,36px)] font-bold text-white">
                            Explore Other Transport
                        </h3>
                    </div>
                    <Link
                        to="/transportation"
                        className="hidden sm:inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-full transition-all duration-300"
                    >
                        View All <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {picked.map((item, i) => {
                        const IconComp = item.icon;
                        return (
                            <motion.div
                                key={item.key}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <Link
                                    to={item.link}
                                    className="group block rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all duration-400 bg-white/[0.02] hover:bg-white/[0.04]"
                                    style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
                                >
                                    {/* Image */}
                                    <div className="relative h-44 overflow-hidden">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Icon badge */}
                                        <div
                                            className="absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
                                            style={{
                                                background: `${item.accent}18`,
                                                border: `1px solid ${item.accent}35`,
                                            }}
                                        >
                                            <IconComp size={16} style={{ color: item.accent }} />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h4 className="text-[16px] font-semibold text-white mb-1 group-hover:text-white/90 transition-colors">
                                            {item.title}
                                        </h4>
                                        <p className="text-[13px] text-white/40 leading-relaxed mb-3">
                                            {item.desc}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[12px] font-medium transition-colors" style={{ color: item.accent }}>
                                            Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Mobile "View All" link */}
                <div className="sm:hidden text-center mt-8">
                    <Link
                        to="/transportation"
                        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-6 py-3 rounded-full transition-all"
                    >
                        View All Transport <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
