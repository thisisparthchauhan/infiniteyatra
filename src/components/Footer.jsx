import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, Send, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '../assets/logo-new.png';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

// Custom Icons for brands not in lucide-react (or specific versions)
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

const Footer = () => {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await addDoc(collection(db, 'newsletter_subscribers'), {
                email,
                timestamp: serverTimestamp()
            });
            setStatus('success');
            addToast('Subscribed successfully! Welcome to Infinite Yatra.', 'success');
            setEmail('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
            addToast(`Subscription failed: ${error.message || 'Please try again'}`, 'error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <footer className="relative bg-slate-950 text-white overflow-hidden footer-glass-overlay">
            {/* Background Image or Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

            {/* Top glass border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-white/10"></div>

            <div className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 mb-16">
                    <div className="space-y-6">
                        <div className="flex flex-col">
                            <h3 className="text-3xl font-bold tracking-widest text-white leading-tight" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>
                                INFINITE YATRA
                            </h3>
                            <span className="text-[10px] tracking-[0.3em] font-medium text-slate-300" style={{ fontFamily: "'Raleway', sans-serif" }}>EXPLORE INFINITE</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            Discover breathtaking destinations and create unforgettable memories with Infinite Yatra.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                            <span className="text-xs text-slate-500 font-medium">Explore Infinite</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Company
                        </h4>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href="#"
                                    className="text-slate-400 hover:text-white transition-all duration-300 group inline-flex items-center gap-2"
                                >
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-4 transition-all duration-300 rounded-full"></span>
                                    About Us
                                </a>
                            </li>
                            <li>
                                <Link
                                    to="/careers"
                                    className="text-slate-400 hover:text-white transition-all duration-300 group inline-flex items-center gap-2"
                                >
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-4 transition-all duration-300 rounded-full"></span>
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className="text-slate-400 hover:text-white transition-all duration-300 group inline-flex items-center gap-2"
                                >
                                    <span className="w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-4 transition-all duration-300 rounded-full"></span>
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Contact Us
                        </h4>
                        <ul className="space-y-5">
                            <li>
                                <a
                                    href="tel:+919265799325"
                                    className="text-slate-400 hover:text-white transition-all duration-300 group flex items-center gap-3"
                                >
                                    <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-blue-600/20 transition-all duration-300">
                                        <Phone size={16} className="group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <span>+91 9265799325</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:infiniteyatra@gmail.com"
                                    className="text-slate-400 hover:text-white transition-all duration-300 group flex items-center gap-3"
                                >
                                    <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-purple-600/20 transition-all duration-300">
                                        <Mail size={16} className="group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <span className="text-sm">infiniteyatra@gmail.com</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-lg mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Stay Updated
                        </h4>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Subscribe to our newsletter for exclusive travel deals and inspiration.
                        </p>
                        <form onSubmit={handleSubscribe} className="space-y-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    className="w-full glass bg-white/5 text-white px-4 py-3 rounded-xl outline-none 
                                             border border-white/10 focus:border-blue-500/50 focus:bg-white/10
                                             transition-all duration-300 placeholder:text-slate-500 disabled:opacity-50"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className={`w-full px-4 py-3 rounded-xl transition-all duration-300 font-medium
                                             shadow-lg hover:shadow-xl active:scale-[0.98]
                                             flex items-center justify-center gap-2 group
                                             ${status === 'success'
                                        ? 'bg-green-600 shadow-green-600/20'
                                        : status === 'error'
                                            ? 'bg-red-600 shadow-red-600/20'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-600/20'
                                    }`}
                            >
                                {status === 'loading' ? (
                                    <span>Subscribing...</span>
                                ) : status === 'success' ? (
                                    <>Subscribed <CheckCircle size={16} /></>
                                ) : status === 'error' ? (
                                    <>Error, Try Again <AlertCircle size={16} /></>
                                ) : (
                                    <>Subscribe <Send size={16} className="group-hover:translate-x-1 transition-transform duration-300" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

                    <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} Infinite Yatra. All rights reserved.
                        </p>

                        {/* Social Media Icons */}
                        <div className="flex items-center gap-4">
                            {[
                                { icon: XIcon, href: "https://x.com/infiniteyatra", title: "X (Twitter)", color: "hover:bg-slate-700" },
                                { icon: ThreadsIcon, href: "https://www.threads.com/@infinite.yatra", title: "Threads", color: "hover:bg-slate-700" },
                                { icon: Instagram, href: "https://www.instagram.com/infinite.yatra/", title: "Instagram", color: "hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600" },
                                { icon: WhatsAppIcon, href: "https://api.whatsapp.com/send?phone=919265799325&text=Hey%20Infinite%20Yatra%20%F0%9F%91%8B%2C%20I%E2%80%99m%20interested%20in%20your%20tours.%20Please%20share%20more%20details%20%F0%9F%99%8F", title: "WhatsApp", color: "hover:bg-green-600" },
                                { icon: WhatsAppIcon, href: "https://www.whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08", title: "WhatsApp Channel", color: "hover:bg-green-600", iconColor: "text-green-400" }
                            ].map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={index}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={social.title}
                                        className={`p-3 rounded-xl glass bg-white/5 text-slate-400 
                                                  ${social.color} hover:text-white
                                                  transition-all duration-300 hover:scale-110 hover:-translate-y-1
                                                  border border-white/10 hover:border-transparent
                                                  shadow-lg hover:shadow-xl group`}
                                    >
                                        <Icon size={20} className={social.iconColor || ""} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
