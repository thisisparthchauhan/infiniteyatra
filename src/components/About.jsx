import React, { useRef } from 'react';
import { Heart, Compass, Mountain } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const About = () => {
    const ref = useRef(null);

    // Motion values for mouse position
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation
    const springConfig = { damping: 25, stiffness: 150 };
    const mouseX = useSpring(x, springConfig);
    const mouseY = useSpring(y, springConfig);

    // Transforms for different images to create depth
    // Image 1: Moves opposite to mouse
    const x1 = useTransform(mouseX, [-500, 500], [15, -15]);
    const y1 = useTransform(mouseY, [-500, 500], [15, -15]);

    // Image 2: Moves with mouse
    const x2 = useTransform(mouseX, [-500, 500], [-15, 15]);
    const y2 = useTransform(mouseY, [-500, 500], [-15, 15]);

    // Image 3: Subtle movement
    const x3 = useTransform(mouseX, [-500, 500], [10, -10]);
    const y3 = useTransform(mouseY, [-500, 500], [10, -10]);

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-6">
                                About Infinite Yatra 🌎
                            </h2>
                            <p className="text-lg text-white/80 leading-relaxed font-light">
                                Infinite Yatra is a travel community built by real travelers, for real travelers.
                                We create journeys that feel personal — spiritual yatras, Himalayan treks, cultural trips,
                                and experiences that touch the heart.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4 glass-card p-4 items-center">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Compass className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Our Goal</h3>
                                    <p className="text-white/70 text-sm">
                                        To help people explore, feel alive, and collect unforgettable memories — safely and authentically.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 glass-card p-4 items-center">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mountain className="text-orange-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Himalayan Calm to Indian Culture</h3>
                                    <p className="text-white/70 text-sm">
                                        We combine spirituality, adventure, and comfort to make every trip meaningful.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 glass-card p-4 items-center">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Heart className="text-red-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">More Than Just Tours</h3>
                                    <p className="text-white/70 text-sm">
                                        We don’t just plan tours — we guide you on journeys that stay with you forever.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <p className="text-2xl font-handwritten text-blue-400 font-bold">
                                Explore Infinite... 🚀
                            </p>
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.img
                            style={{ x: x1, y: y1 }}
                            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
                            alt="Mountain"
                            className="rounded-2xl shadow-lg w-full h-64 object-cover mt-8"
                        />
                        <motion.img
                            style={{ x: x2, y: y2 }}
                            src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1776&auto=format&fit=crop"
                            alt="Temple"
                            className="rounded-2xl shadow-lg w-full h-64 object-cover"
                        />
                        <motion.img
                            style={{ x: x3, y: y3 }}
                            src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop"
                            alt="Harshil Valley"
                            className="rounded-2xl shadow-lg w-full h-64 object-cover col-span-2"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
