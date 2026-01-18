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
            bgColor: 'rgba(59, 130, 246, 0.1)'
        },
        {
            icon: Award,
            value: '4.9/5',
            label: 'Average Rating',
            color: 'text-yellow-400',
            bgColor: 'rgba(234, 179, 8, 0.1)'
        },
        {
            icon: Shield,
            value: '100%',
            label: 'Safe & Secure',
            color: 'text-green-400',
            bgColor: 'rgba(34, 197, 94, 0.1)'
        },
        {
            icon: Headphones,
            value: '24/7',
            label: 'Support Available',
            color: 'text-purple-400',
            bgColor: 'rgba(168, 85, 247, 0.1)'
        },
        {
            icon: CheckCircle,
            value: 'Certified',
            label: 'Tourism Board',
            color: 'text-indigo-400',
            bgColor: 'rgba(99, 102, 241, 0.1)'
        },
        {
            icon: TrendingUp,
            value: '98%',
            label: 'Satisfaction Rate',
            color: 'text-rose-400',
            bgColor: 'rgba(244, 63, 94, 0.1)'
        }
    ];

    return (
        <section className="py-20 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Why Choose <span className="text-blue-400">Infinite Yatra</span>?
                    </h2>
                    <p className="text-slate-400 text-lg font-light">
                        Trusted by thousands of adventure seekers across India
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
                                className="glass-card p-6 flex flex-col items-center justify-center text-center group"
                            >
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                                    style={{ background: badge.bgColor, backdropFilter: 'blur(5px)' }}
                                >
                                    <Icon size={24} strokeWidth={1.5} className={badge.color} />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                                    {badge.value}
                                </div>
                                <div className="text-xs md:text-sm text-slate-400 font-medium uppercase tracking-wider">
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
                    className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400"
                >
                    <div className="flex items-center gap-2 glass-btn !py-2 !px-4 !bg-white/5 !border-white/10 hover:!bg-white/10">
                        <CheckCircle size={16} className="text-green-400" />
                        <span>Verified by Uttarakhand Tourism</span>
                    </div>
                    <div className="flex items-center gap-2 glass-btn !py-2 !px-4 !bg-white/5 !border-white/10 hover:!bg-white/10">
                        <CheckCircle size={16} className="text-green-400" />
                        <span>100% Secure Payments</span>
                    </div>
                    <div className="flex items-center gap-2 glass-btn !py-2 !px-4 !bg-white/5 !border-white/10 hover:!bg-white/10">
                        <CheckCircle size={16} className="text-green-400" />
                        <span>Best Price Guarantee</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TrustBadges;
