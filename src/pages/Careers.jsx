import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Globe, Heart, Rocket, ArrowRight, Mail } from 'lucide-react';
import SEO from '../components/SEO';

const Careers = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const benefits = [
        {
            icon: <Globe size={32} className="text-blue-600" />,
            title: "Work from Anywhere",
            description: "We are a remote-first company. Work from the mountains, the beach, or your home."
        },
        {
            icon: <Heart size={32} className="text-red-500" />,
            title: "Health & Wellness",
            description: "Comprehensive health coverage and wellness allowances to keep you fit and happy."
        },
        {
            icon: <Rocket size={32} className="text-purple-600" />,
            title: "Growth Opportunities",
            description: "Learning budget and mentorship to help you grow in your career."
        },
        {
            icon: <Briefcase size={32} className="text-green-600" />,
            title: "Travel Discounts",
            description: "Exclusive discounts on our travel packages for you and your family."
        }
    ];

    const openings = [
        {
            title: "Travel Consultant",
            type: "Full-time",
            location: "Remote",
            department: "Sales"
        },
        {
            title: "Content Creator",
            type: "Part-time / Freelance",
            location: "Remote",
            department: "Marketing"
        },
        {
            title: "Social Media Manager",
            type: "Full-time",
            location: "Remote",
            department: "Marketing"
        }
    ];

    return (
        <div className="pt-20 min-h-screen bg-[#0A0A0A]">
            <SEO
                title="Careers"
                description="Join the Infinite Yatra team. We are looking for passionate individuals to help us build the future of travel."
                url="/careers"
            />
            {/* Hero Section */}
            <div className="relative bg-black text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80 opacity-90"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>

                <div className="relative container mx-auto px-6 text-center max-w-4xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                    >
                        Build the Future of <span className="text-blue-400">Travel</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed"
                    >
                        Join a team of explorers, creators, and tech enthusiasts passionate about making travel unforgettable.
                    </motion.p>
                    <motion.a
                        href="#openings"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
                    >
                        View Open Positions
                        <ArrowRight size={20} />
                    </motion.a>
                </div>
            </div>

            {/* Values / Benefits Section */}
            <div className="py-24 container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Work With Us?</h2>
                    <p className="text-lg text-slate-400">
                        We believe in a culture of freedom, responsibility, and adventure. Here's what you can expect when you join Infinite Yatra.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/5 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-white/10 hover:border-white/20"
                        >
                            <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Open Positions Section */}
            <div id="openings" className="py-24 bg-[#0A0A0A] border-t border-white/10">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Current Openings</h2>
                        <p className="text-lg text-slate-400">
                            Ready to start your journey? Check out our open roles below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {openings.map((job, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group flex flex-col md:flex-row items-center justify-between bg-white/5 hover:bg-white/10 p-8 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-300"
                            >
                                <div className="mb-4 md:mb-0 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h3>
                                    <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400 mt-2 text-sm font-medium">
                                        <span>{job.department}</span>
                                        <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                        <span>{job.type}</span>
                                        <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                        <span>{job.location}</span>
                                    </div>
                                </div>
                                <a
                                    href="mailto:infiniteyatra@gmail.com"
                                    className="inline-flex items-center gap-2 bg-white/10 group-hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold border border-white/10 group-hover:border-blue-600 transition-all duration-300"
                                >
                                    Apply Now
                                    <ArrowRight size={18} />
                                </a>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-12 text-center bg-blue-900/20 p-8 rounded-2xl border border-blue-500/20">
                        <h4 className="text-xl font-bold text-white mb-2">Don't see the right role?</h4>
                        <p className="text-slate-400 mb-6">
                            We are always looking for talented people. Send your resume to <span className="font-semibold text-blue-400">infiniteyatra@gmail.com</span>
                        </p>
                        <a
                            href="mailto:infiniteyatra@gmail.com"
                            className="inline-flex items-center gap-2 text-blue-400 font-bold hover:underline"
                        >
                            <Mail size={20} />
                            Email Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Careers;
