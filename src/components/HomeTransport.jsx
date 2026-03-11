import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Car, 
    Bike, 
    Zap, 
    Bus, 
    Train, 
    Plane, 
    Ship, 
    Rocket,
    ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTransportConfig } from '../services/transportService';

export const transportItems = [
    {
        title: "Cycles",
        desc: "Eco-friendly short commutes",
        image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80",
        type: "Cycles",
        icon: "Bike",
        animation: {
            y: [0, -8, 0],
            transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }
    },
    {
        title: "Bikes",
        desc: "Adventure ready motorcycles",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80",
        type: "Bikes",
        icon: "Zap",
        animation: {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
        }
    },
    {
        title: "Cars",
        desc: "Self-Drive & Driven options",
        image: "/assets/transport/tesla_car.png",
        type: "Cars",
        icon: "Car",
        animation: {
            x: [-5, 5, -5],
            y: [0, 2, 0],
            transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
    },
    {
        title: "Traveller",
        desc: "Group travels and vans",
        image: "/assets/transport/urbania_traveller.png",
        type: "Traveller",
        icon: "Bus",
        animation: {
            y: [0, 3, 0],
            transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
        }
    },
    {
        title: "Bus",
        desc: "Intercity luxury bus travel",
        image: "/assets/transport/cyberpunk_bus.png",
        type: "Bus",
        icon: "Bus",
        animation: {
            x: [-4, 4, -4],
            transition: { duration: 3, repeat: Infinity, ease: "linear" }
        }
    },
    {
        title: "Trains",
        desc: "Scenic railway journeys",
        image: "/assets/transport/bullet_train.jpg",
        type: "Trains",
        icon: "Train",
        animation: {
            x: [-8, 8, -8],
            transition: { duration: 4, repeat: Infinity, ease: "linear" }
        }
    },
    {
        title: "Flights",
        desc: "Quick intercity routing",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80",
        type: "Flights",
        icon: "Plane",
        animation: {
            x: [-5, 15],
            y: [5, -15],
            opacity: [0, 1, 0],
            transition: { duration: 2, repeat: Infinity, ease: "easeOut" }
        }
    },
    {
        title: "Jet Planes",
        desc: "Private luxury aviation",
        image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80",
        type: "Jet Planes",
        icon: "Rocket",
        animation: {
            y: [5, -40],
            x: [-5, 40],
            scale: [1, 1.5, 0],
            opacity: [1, 0, 0],
            transition: { duration: 1.5, repeat: Infinity, ease: "easeIn" }
        }
    },
    {
        title: "Cruise",
        desc: "Ocean & river voyages",
        image: "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&q=80",
        type: "Cruise",
        icon: "Ship",
        animation: {
            rotate: [-5, 5, -5],
            y: [0, -5, 0],
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
    }
];

const iconMap = {
    Bike, Zap, Car, Bus, Train, Plane, Rocket, Ship
};

const getIconComponent = (iconName) => iconMap[iconName] || Car;

const HomeTransport = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [config, setConfig] = useState(null);
    const [visibleCategories, setVisibleCategories] = useState([]);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const fetchedConfig = await getTransportConfig();
                setConfig(fetchedConfig);
                
                // Keep only visible categories
                let visible = (fetchedConfig.categories || []).filter(c => c.isVisible);
                
                // Map local animations
                visible = visible.map(cat => {
                    const localMatch = transportItems.find(li => li.type.toLowerCase() === cat.type.toLowerCase() || li.title.toLowerCase() === cat.title.toLowerCase());
                    return {
                        ...cat,
                        animation: localMatch?.animation || { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                    };
                });

                // Fallback if empty
                if (visible.length === 0) visible = transportItems;
                
                setVisibleCategories(visible);
            } catch (error) {
                console.error("Failed to load config:", error);
                setVisibleCategories(transportItems);
                setConfig({
                    homepageHeading: "Move Infinite",
                    homepageSubtext: "From a cycle to a Cruise — book the right ride for your journey. Explore our premium collection of vehicles available for rent.",
                    buttonPrefix: "Explore"
                });
            }
        };

        fetchConfig();
    }, []);

    useEffect(() => {
        if (visibleCategories.length === 0) return;
        
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % visibleCategories.length);
        }, 5000); // 5 seconds

        return () => clearInterval(interval);
    }, [visibleCategories.length]);

    if (visibleCategories.length === 0 || !config) return null;

    const activeItem = visibleCategories[activeIndex];
    const ActiveIcon = getIconComponent(activeItem.icon);

    return (
        <section className="py-20 bg-[#0a0a0a] text-white relative overflow-hidden border-t border-white/5">
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full"
                >
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeItem.id || activeItem.type}
                                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center p-3"
                            >
                                <motion.div animate={activeItem.animation}>
                                    <ActiveIcon size={32} className="text-blue-500" />
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">
                        {config.homepageHeading}
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-lg">
                        {config.homepageSubtext}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-8 max-w-lg">
                        {visibleCategories.map((cat, idx) => (
                            <button 
                                key={cat.id || cat.type} 
                                onClick={() => setActiveIndex(idx)}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
                                    activeItem.type === cat.type
                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                            >
                                {cat.title}
                            </button>
                        ))}
                    </div>
                    <Link
                        to={`/transport/search?type=${activeItem.type.toLowerCase()}`}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 group"
                    >
                        {config.buttonPrefix} {activeItem.title} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full relative h-[400px] md:h-[500px]"
                >
                    <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 group">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={activeIndex}
                                src={activeItem.image}
                                alt={activeItem.title}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </AnimatePresence>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 z-10 pointer-events-none">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.5 }}
                                    className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl inline-block max-w-[250px]"
                                >
                                    <div className="text-blue-400 font-bold mb-1">{activeItem.title}</div>
                                    <div className="text-slate-300 text-sm">{activeItem.desc}</div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                    
                    {/* Carousel Indicators */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {visibleCategories.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    idx === activeIndex ? 'w-8 bg-blue-500' : 'w-2 bg-white/20 hover:bg-white/40'
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HomeTransport;
