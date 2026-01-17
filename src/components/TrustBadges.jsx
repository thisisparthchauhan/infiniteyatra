import React from 'react';
import { Shield, Users, Award, Headphones, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustBadges = () => {
    const badges = [
        {
            icon: Users,
            value: '500+',
            label: 'Happy Travelers',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20'
        },
        {
            icon: Award,
            value: '4.9/5',
            label: 'Average Rating',
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20'
        },
        {
            icon: Shield,
            value: '100%',
            label: 'Safe & Secure',
            color: 'text-green-400',
            bgColor: 'bg-green-500/20'
        },
        {
            icon: Headphones,
            value: '24/7',
            label: 'Support Available',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/20'
        },
        {
            icon: CheckCircle,
            value: 'Certified',
            label: 'Tourism Board',
            color: 'text-indigo-400',
            bgColor: 'bg-indigo-500/20'
        },
        {
            icon: TrendingUp,
            value: '98%',
            label: 'Satisfaction Rate',
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/20'
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background decoration - subtle glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Infinite Yatra</span>?
                    </h2>
                    <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        Trusted by thousands of adventure seekers across India. We turn journeys into lifelong memories.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {badges.map((badge, index) => {
                        const Icon = badge.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-colors duration-300"
                            >
                                <div className={`${badge.bgColor} ${badge.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={28} strokeWidth={2} />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                                    {badge.value}
                                </div>
                                <div className="text-xs md:text-sm text-slate-400 font-medium">
                                    {badge.label}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Additional trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm md:text-base text-slate-400 font-medium"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-400" />
                        <span>Verified by Uttarakhand Tourism</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-400" />
                        <span>100% Secure Payments</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-400" />
                        <span>Best Price Guarantee</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TrustBadges;
