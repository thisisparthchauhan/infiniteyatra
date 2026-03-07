import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const HomeTransport = () => {
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
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                        <Car size={32} className="text-blue-500" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">
                        Move Infinite
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 max-w-lg">
                        From a cycle to a Traveller — book the right ride for your journey. Explore our premium collection of vehicles available for rent.
                    </p>
                    <div className="flex flex-wrap gap-4 mb-8">
                        {['Bikes', 'Cars', 'Travellers', 'Cycles'].map(type => (
                            <span key={type} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300">
                                {type}
                            </span>
                        ))}
                    </div>
                    <Link
                        to="/transport"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 group"
                    >
                        Explore Transport <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex-1 w-full relative"
                >
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 group">
                        <img
                            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0e2b?auto=format&fit=crop&q=80"
                            alt="Transport Rental"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl inline-block max-w-[200px]">
                                <div className="text-blue-400 font-bold mb-1">Self-Drive & Driven</div>
                                <div className="text-slate-300 text-sm">Flexible rentals across multiple cities</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HomeTransport;
