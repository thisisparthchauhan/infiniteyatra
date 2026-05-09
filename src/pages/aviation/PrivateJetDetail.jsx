import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, ArrowRight, Users, Gauge, Navigation, Ruler,
    Plane, Shield, Clock, Star, Phone, Mail, MessageCircle, Crown, Sparkles,
    X, Check, MapPin, ArrowUpRight, Maximize2, Weight, Cog, Mountain,
    ChevronDown, Home, ImageIcon, Send, Loader2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { privateJetFleet } from '../../data/privateJets';
import SEO from '../../components/SEO';

const GOLD = 'text-amber-400';
const GOLD_BG = 'bg-amber-400';
const GOLD_BORDER = 'border-amber-400/20';
const GOLD_GLOW = 'shadow-amber-500/10';

const SPEC_ICONS = {
    wingspan: Ruler, length: Ruler, cabinHeight: Maximize2, cabinWidth: Maximize2,
    cabinLength: Maximize2, maxAltitude: Mountain, baggageCapacity: Weight, engines: Cog
};

const SPEC_LABELS = {
    wingspan: 'Wingspan', length: 'Aircraft Length', cabinHeight: 'Cabin Height',
    cabinWidth: 'Cabin Width', cabinLength: 'Cabin Length', maxAltitude: 'Max Altitude',
    baggageCapacity: 'Baggage Capacity', engines: 'Engines'
};

const CATEGORY_LABELS = { light: 'Light', midsize: 'Midsize', heavy: 'Heavy', ultra: 'Ultra-Long Range' };

const PrivateJetDetail = () => {
    const { jetId } = useParams();
    const navigate = useNavigate();

    const jet = useMemo(() => privateJetFleet.find(j => j.id === jetId), [jetId]);
    const otherJets = useMemo(() => privateJetFleet.filter(j => j.id !== jetId), [jetId]);

    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIdx, setGalleryIdx] = useState(0);
    const [showInquiry, setShowInquiry] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', from: '', to: '', date: '', passengers: '2', specialRequests: ''
    });

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phone) return;
        setIsSubmitting(true);
        try {
            const inquiry = {
                ...formData,
                aircraftId: jet.id,
                aircraftName: jet.name,
                aircraftType: jet.type,
                status: 'new',
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'jet_inquiries'), inquiry);
            await addDoc(collection(db, 'leads'), {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                source_type: 'private_jet_inquiry',
                sourcePage: `/private-aviation/${jet.id}`,
                packageName: `Private Jet: ${jet.name} (${formData.from} → ${formData.to})`,
                status: 'new',
                createdAt: serverTimestamp()
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting jet inquiry:', err);
            alert('Something went wrong. Please try again or contact us on WhatsApp.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openInquiryWithRoute = (from, to) => {
        setFormData(prev => ({ ...prev, from, to }));
        setShowInquiry(true);
    };

    // ─── 404 ───
    if (!jet) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
            <Plane size={48} className="text-amber-400" />
            <h1 className="text-3xl font-bold">Aircraft Not Found</h1>
            <p className="text-zinc-500">The aircraft you're looking for is not in our fleet.</p>
            <Link to="/private-aviation" className="px-6 py-3 bg-amber-400 text-black rounded-xl font-bold hover:bg-amber-300 transition-colors">
                View Our Fleet
            </Link>
        </div>
    );

    const gallery = jet.gallery?.length > 0 ? jet.gallery : [jet.image];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-amber-500/30">
            <SEO
                title={`${jet.name} — Private Jet Charter | Infinite Yatra Aviation`}
                description={`Charter the ${jet.name}. ${jet.type} with ${jet.seats.min}-${jet.seats.max} seats, ${jet.range} km range. ${jet.tagline}. Request a quote from Infinite Yatra.`}
                image={jet.image}
            />

            {/* ─── Breadcrumb ─── */}
            <div className="container mx-auto px-4 max-w-7xl pt-24 pb-4">
                <nav className="flex items-center gap-2 text-xs text-zinc-500">
                    <Link to="/" className="hover:text-white transition-colors flex items-center gap-1"><Home size={12} /> Home</Link>
                    <ChevronRight size={10} />
                    <Link to="/private-aviation" className="hover:text-amber-400 transition-colors">Private Jets</Link>
                    <ChevronRight size={10} />
                    <span className="text-amber-400">{jet.name}</span>
                </nav>
            </div>

            {/* ─── Header ─── */}
            <div className="container mx-auto px-4 max-w-7xl mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                {jet.type}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                                {CATEGORY_LABELS[jet.category] || jet.category}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{jet.name}</h1>
                        <p className="text-zinc-400 text-lg italic">{jet.tagline}</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={() => setShowInquiry(true)}
                            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-6 py-3 rounded-xl font-bold hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                            Request This Aircraft
                        </button>
                    </div>
                </div>

                {/* Quick Specs Strip */}
                <div className="flex flex-wrap gap-6 mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-amber-400" />
                        <span className="text-sm"><strong className="text-white">{jet.seats.min}-{jet.seats.max}</strong> <span className="text-zinc-500">Passengers</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Navigation size={16} className="text-amber-400" />
                        <span className="text-sm"><strong className="text-white">{jet.range.toLocaleString()} km</strong> <span className="text-zinc-500">Range</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gauge size={16} className="text-amber-400" />
                        <span className="text-sm"><strong className="text-white">{jet.speed} km/h</strong> <span className="text-zinc-500">Speed</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-amber-400" />
                        <span className="text-sm text-zinc-400">Best for: <strong className="text-white">{jet.bestFor}</strong></span>
                    </div>
                </div>
            </div>

            {/* ─── Photo Gallery ─── */}
            <div className="container mx-auto px-4 max-w-7xl mb-12">
                <div
                    className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[40vh] min-h-[320px] max-h-[480px] rounded-2xl overflow-hidden cursor-pointer"
                    onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}
                >
                    <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden">
                        <img src={gallery[0]} alt={jet.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                    {gallery.slice(1, 5).map((img, i) => (
                        <div key={i} className="relative group overflow-hidden hidden md:block">
                            <img src={img} alt={`${jet.name} ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-2">
                    <button onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}
                        className="text-sm text-zinc-500 hover:text-amber-400 flex items-center gap-1 transition-colors">
                        <ImageIcon size={14} /> View all {gallery.length} photos
                    </button>
                </div>
            </div>

            {/* ─── Two Column Layout ─── */}
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* About */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Crown size={20} className="text-amber-400" /> About This Aircraft
                            </h2>
                            <p className="text-zinc-300 leading-relaxed text-[15px] mb-6">{jet.cabinDescription}</p>

                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Cabin Features</h3>
                            <div className="flex flex-wrap gap-2">
                                {jet.cabinFeatures.map((feature, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-sm text-amber-400 bg-amber-400/5 border border-amber-400/10 px-3 py-1.5 rounded-lg">
                                        <Check size={12} strokeWidth={3} /> {feature}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Technical Specs */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Cog size={20} className="text-amber-400" /> Technical Specifications
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(jet.specs).map(([key, value]) => {
                                    const Icon = SPEC_ICONS[key] || Cog;
                                    return (
                                        <div key={key} className="bg-white/[0.03] border border-amber-400/10 rounded-xl p-4 hover:border-amber-400/30 transition-colors">
                                            <Icon size={16} className="text-amber-400 mb-2" />
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">{SPEC_LABELS[key] || key}</p>
                                            <p className="text-sm font-bold text-white">{value}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Routes & Estimated Pricing */}
                        {jet.estimatedPricing?.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                    <MapPin size={20} className="text-amber-400" /> Routes & Estimated Pricing
                                </h2>
                                <p className="text-xs text-zinc-500 mb-6">
                                    Prices are indicative and subject to date, availability, and specific requirements.
                                </p>

                                <div className="space-y-3">
                                    {jet.estimatedPricing.map((route, i) => {
                                        const [from, to] = route.route.split(' → ');
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-xl hover:border-amber-400/20 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 text-white font-bold">
                                                        <span>{from}</span>
                                                        <ArrowRight size={16} className="text-amber-400" />
                                                        <span>{to}</span>
                                                    </div>
                                                    <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">
                                                        <Clock size={10} className="inline mr-1" />{route.duration}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className="text-xs text-zinc-500 block">Starting from</span>
                                                        <span className="text-lg font-bold text-amber-400">₹{route.price.toLocaleString()}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => openInquiryWithRoute(from, to)}
                                                        className="px-4 py-2 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-lg text-sm font-bold hover:bg-amber-400 hover:text-black transition-all"
                                                    >
                                                        Get Quote
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        <hr className="border-white/5" />

                        {/* Inquiry Form (Embedded) */}
                        <section id="inquiry">
                            <div className="bg-gradient-to-br from-amber-400/5 to-transparent border border-amber-400/10 rounded-2xl p-8">
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                    <Send size={20} className="text-amber-400" /> Charter This Aircraft
                                </h2>
                                <p className="text-sm text-zinc-500 mb-6">Fill out the form and our aviation desk will respond within 2 hours.</p>

                                {submitted ? (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check size={32} className="text-green-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Inquiry Received!</h3>
                                        <p className="text-zinc-500 mb-6">Our aviation team will contact you within 2 hours with a detailed quote.</p>
                                        <a
                                            href={`https://wa.me/919265799325?text=${encodeURIComponent(`Hi, I just submitted an inquiry for ${jet.name}. Can you share a quote?`)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="text-green-400 hover:text-green-300 font-medium text-sm flex items-center gap-1 justify-center"
                                        >
                                            <MessageCircle size={14} /> Or chat with us on WhatsApp for faster response
                                        </a>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Full Name *</label>
                                                <input name="name" value={formData.name} onChange={handleChange} required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                                                    placeholder="Your name" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Phone *</label>
                                                <input name="phone" value={formData.phone} onChange={handleChange} required
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                                                    placeholder="+91 98765 43210" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Email</label>
                                            <input name="email" type="email" value={formData.email} onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                                                placeholder="your@email.com" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">From</label>
                                                <input name="from" value={formData.from} onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                                                    placeholder="Departure city" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">To</label>
                                                <input name="to" value={formData.to} onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors"
                                                    placeholder="Destination city" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Preferred Date</label>
                                                <input name="date" type="date" value={formData.date} onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Passengers</label>
                                                <select name="passengers" value={formData.passengers} onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors [color-scheme:dark]">
                                                    {[...Array(13)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1} className="bg-zinc-900">{i + 1} Passenger{i > 0 ? 's' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Special Requests</label>
                                            <textarea name="specialRequests" value={formData.specialRequests} onChange={handleChange} rows={3}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-400/50 focus:outline-none transition-colors resize-none"
                                                placeholder="Catering preferences, ground transport, hotel arrangements..." />
                                        </div>
                                        <button type="submit" disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-4 rounded-xl text-lg hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Request Quote for {jet.name}</>}
                                        </button>
                                        <div className="text-center">
                                            <a href={`https://wa.me/919265799325?text=${encodeURIComponent(`Hi, I'm interested in chartering the ${jet.name}. Can you share availability and pricing?`)}`}
                                               target="_blank" rel="noopener noreferrer"
                                               className="text-sm text-green-400 hover:text-green-300 font-medium inline-flex items-center gap-1">
                                                <MessageCircle size={14} /> Prefer WhatsApp? Chat with our aviation desk
                                            </a>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* ─── Right Sidebar ─── */}
                    <div className="hidden lg:block">
                        <div className="sticky top-28 space-y-4">
                            {/* Pricing Card */}
                            <div className="bg-gradient-to-br from-amber-400/5 to-white/[0.02] border border-amber-400/20 rounded-2xl p-6 shadow-2xl shadow-black/50">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Charter from</p>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-3xl font-bold text-amber-400">₹{(jet.pricePerHour || 0).toLocaleString()}</span>
                                    <span className="text-sm text-zinc-500">/ hour</span>
                                </div>
                                <p className="text-xs text-zinc-600 mb-6">Final pricing based on route, date & requirements</p>

                                <button
                                    onClick={() => setShowInquiry(true)}
                                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-4 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] text-lg mb-3"
                                >
                                    Request This Aircraft
                                </button>

                                <a href={`https://wa.me/919265799325?text=${encodeURIComponent(`Hi, I'm interested in the ${jet.name}. Can you share pricing?`)}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl font-medium text-sm hover:bg-green-500/20 transition-colors">
                                    <MessageCircle size={16} /> WhatsApp Us
                                </a>

                                {/* Quick Specs */}
                                <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Type</span>
                                        <span className="text-white font-medium">{jet.type}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Passengers</span>
                                        <span className="text-white font-medium">{jet.seats.min}-{jet.seats.max}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Range</span>
                                        <span className="text-white font-medium">{jet.range.toLocaleString()} km</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Max Speed</span>
                                        <span className="text-white font-medium">{jet.speed} km/h</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <Shield size={16} className="text-amber-400 shrink-0" />
                                    <span>Verified & inspected aircraft</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <Crown size={16} className="text-amber-400 shrink-0" />
                                    <span>Transparent, no-hidden-fee pricing</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <Clock size={16} className="text-amber-400 shrink-0" />
                                    <span>24/7 aviation concierge</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <Sparkles size={16} className="text-amber-400 shrink-0" />
                                    <span>Bespoke catering & ground transport</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Mobile Bottom Bar ─── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/95 backdrop-blur-xl border-t border-amber-400/10 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xl font-bold text-amber-400">₹{(jet.pricePerHour || 0).toLocaleString()}</span>
                        <span className="text-xs text-zinc-500 ml-1">/ hour</span>
                    </div>
                    <button onClick={() => setShowInquiry(true)}
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95">
                        Request Quote
                    </button>
                </div>
            </div>

            {/* ─── Other Aircraft ─── */}
            {otherJets.length > 0 && (
                <div className="container mx-auto px-4 max-w-7xl mt-16 pt-12 border-t border-white/5 pb-24">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                        <Plane size={20} className="text-amber-400" /> Explore Other Aircraft
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherJets.slice(0, 3).map(j => (
                            <Link key={j.id} to={`/private-aviation/${j.id}`}
                                className="group bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-amber-400/20 transition-all">
                                <div className="h-44 overflow-hidden">
                                    <img src={j.image} alt={j.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                </div>
                                <div className="p-5">
                                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{j.type}</span>
                                    <h4 className="font-bold text-white text-lg mt-1 mb-1">{j.name}</h4>
                                    <p className="text-xs text-zinc-500 mb-3">{j.seats.min}-{j.seats.max} seats · {j.range.toLocaleString()} km range</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-amber-400">₹{(j.pricePerHour || 0).toLocaleString()}/hr</span>
                                        <span className="text-xs text-zinc-500 group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                                            View Details <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Gallery Lightbox ─── */}
            <AnimatePresence>
                {galleryOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
                        onClick={() => setGalleryOpen(false)}
                    >
                        <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 z-10" onClick={() => setGalleryOpen(false)}>
                            <X size={24} />
                        </button>
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full hover:bg-white/20 z-10"
                            onClick={(e) => { e.stopPropagation(); setGalleryIdx((galleryIdx - 1 + gallery.length) % gallery.length); }}>
                            <ChevronLeft size={24} />
                        </button>
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full hover:bg-white/20 z-10"
                            onClick={(e) => { e.stopPropagation(); setGalleryIdx((galleryIdx + 1) % gallery.length); }}>
                            <ChevronRight size={24} />
                        </button>
                        <img src={gallery[galleryIdx]} alt={`${jet.name} ${galleryIdx + 1}`}
                            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
                        <div className="absolute bottom-6 text-center text-sm text-zinc-500">
                            {galleryIdx + 1} / {gallery.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Quick Inquiry Modal ─── */}
            <AnimatePresence>
                {showInquiry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowInquiry(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#111] border border-amber-400/20 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Request Quote</h3>
                                    <p className="text-xs text-amber-400">{jet.name}</p>
                                </div>
                                <button onClick={() => setShowInquiry(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                    <X size={20} className="text-zinc-500" />
                                </button>
                            </div>
                            <div className="p-6">
                                {submitted ? (
                                    <div className="text-center py-8">
                                        <Check size={32} className="text-green-400 mx-auto mb-3" />
                                        <h4 className="font-bold text-white mb-1">Inquiry Sent!</h4>
                                        <p className="text-sm text-zinc-500">We'll contact you within 2 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <input name="name" value={formData.name} onChange={handleChange} required placeholder="Full Name *"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none" />
                                        <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="Phone *"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none" />
                                        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none" />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input name="from" value={formData.from} onChange={handleChange} placeholder="From (City)"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none" />
                                            <input name="to" value={formData.to} onChange={handleChange} placeholder="To (City)"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input name="date" type="date" value={formData.date} onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none [color-scheme:dark]" />
                                            <select name="passengers" value={formData.passengers} onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-400/50 focus:outline-none [color-scheme:dark]">
                                                {[...Array(13)].map((_, i) => <option key={i + 1} value={i + 1} className="bg-zinc-900">{i + 1} pax</option>)}
                                            </select>
                                        </div>
                                        <button type="submit" disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Submit Inquiry</>}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PrivateJetDetail;
