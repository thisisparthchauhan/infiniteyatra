import React from 'react';
import { Shield, Users, Award, Headphones, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustBadges = () => {
    const badges = [
        {
            icon: Users,
            value: '500+',
            label: 'Happy Travelers',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            icon: Award,
            value: '4.9/5',
            label: 'Average Rating',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        },
        {
            icon: Shield,
            value: '100%',
            label: 'Safe & Secure',
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            icon: Headphones,
            value: '24/7',
            label: 'Support Available',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            icon: CheckCircle,
            value: 'Certified',
            label: 'Tourism Board',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
        },
        {
            icon: TrendingUp,
            value: '98%',
            label: 'Satisfaction Rate',
            color: 'text-rose-600',
            bgColor: 'bg-rose-50'
        }
    ];

    return (
        <section className="py-12 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                        Why Choose <span className="text-blue-600">Infinite Yatra</span>?
                    </h2>
                    <p className="text-slate-600 text-lg">
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
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group"
                            >
                                <div className={`${badge.bgColor} ${badge.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={28} strokeWidth={2} />
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                                        {badge.value}
                                    </div>
                                    <div className="text-xs md:text-sm text-slate-600 font-medium">
                                        {badge.label}
                                    </div>
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
                    className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span>Verified by Uttarakhand Tourism</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span>100% Secure Payments</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span>Best Price Guarantee</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TrustBadges;
