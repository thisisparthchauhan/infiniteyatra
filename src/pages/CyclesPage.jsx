import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, ChevronDown, Clock, Zap } from 'lucide-react';
import SEO from '../components/SEO';
import { addCycleBooking } from '../services/cycleService';
import './CyclesPage.css';

const WHATSAPP_NUMBER = '919265799325';

// ─── Cycle Models Data ───
const cycleModels = [
    { id: 'solo', name: 'Solo', tagline: 'For adults', icon: '🚲', isElectric: false, accentColor: '#22c55e', price15: 50, price30: 50, description: 'Perfect for a solo riverfront ride. Lightweight, comfortable adult cycle for a breezy Sabarmati experience.', idealFor: ['Solo travelers', 'Morning riders', 'Adults'] },
    { id: 'junior', name: 'Junior', tagline: 'For kids (5–8 yrs)', icon: '🚲', isElectric: false, accentColor: '#f59e0b', price15: 50, price30: 50, description: 'Safe and fun cycle designed for young riders aged 5 to 8 years. Let the kids enjoy the riverfront too.', idealFor: ['Kids 5-8 years', 'Family trips'] },
    { id: 'balance', name: 'Balance', tagline: 'For toddlers (2–4 yrs)', icon: '🚲', isElectric: false, accentColor: '#ec4899', price15: 50, price30: 50, description: 'Balance bike for tiny adventurers. No pedals — helps toddlers develop balance and confidence.', idealFor: ['Toddlers 2-4 years', 'Family trips'] },
    { id: 'e1', name: 'E1 ⚡', tagline: 'For young at heart', icon: '⚡', isElectric: true, accentColor: '#3b82f6', price15: 100, price30: 100, description: 'Electric cycle for those who want to cruise effortlessly. Smooth, silent, and surprisingly fun.', idealFor: ['Electric lovers', 'Young adults', 'Effortless rides'] },
    { id: 'duo', name: 'Duo', tagline: 'For couples', icon: '🚲', isElectric: false, accentColor: '#e879f9', price15: 100, price30: 100, description: 'A tandem cycle built for two. Ride side by side with your partner along the beautiful Sabarmati.', idealFor: ['Couples', 'Friends', 'Duos'] },
    { id: 'trio', name: 'Trio', tagline: 'For family', icon: '🚲', isElectric: false, accentColor: '#f97316', price15: 150, price30: 150, description: 'Three-seater family cycle — one for you, one for your partner, one for the little one. The perfect family ride.', idealFor: ['Families', 'Groups of 3'] },
    { id: 'genz', name: 'Gen Z ⚡', tagline: 'For hustlers', icon: '⚡', isElectric: true, accentColor: '#22c55e', price15: 150, price30: 150, description: 'The premium electric cycle. Sleek, fast, and built for the bold. The ultimate riverfront experience.', idealFor: ['Electric enthusiasts', 'Premium riders', 'Speed lovers'] },
];

const DURATION_OPTIONS = [
    { label: '15 minutes', mins: 15 },
    { label: '30 minutes', mins: 30 },
    { label: '45 minutes', mins: 45 },
    { label: '1 hour', mins: 60 },
    { label: '1.5 hours', mins: 90 },
    { label: '2 hours', mins: 120 },
];

const INFO_CARDS = [
    { icon: '🪪', title: 'ID Required', desc: 'Carry a valid Indian Government ID. Under-18 riders need parent/guardian ID.' },
    { icon: '⏰', title: 'Timings', desc: 'Open 6 AM – 11 PM daily. Return before closing or full-duration rent applies.' },
    { icon: '🔍', title: 'Inspect Before Riding', desc: 'Check your cycle before starting. Malfunction mid-ride? Swap at station — no refunds.' },
    { icon: '👶', title: 'Kids Policy', desc: 'Junior cycles for ages 5–8 only. ₹500 penalty if child is found above 8 years.' },
    { icon: '💳', title: 'Bring Change', desc: 'Cash payment preferred. Carry exact change while renting.' },
    { icon: '⚠️', title: 'Damage Policy', desc: 'Brake lever ₹50 · Fork ₹500 · Rim ₹200 · Gen Z ₹1,000 · Others as assessed' },
];

const HOW_STEPS = [
    { num: 1, title: 'Book', desc: 'Choose your cycle model and preferred time. Book via WhatsApp or submit a request online.' },
    { num: 2, title: 'Arrive', desc: 'Head to Sardar Bridge, Sabarmati Riverfront. Carry a valid Government ID.' },
    { num: 3, title: 'Ride', desc: 'Pick up your cycle and enjoy the scenic riverfront. Return before 11 PM.' },
    { num: 4, title: 'Return', desc: 'Drop back at the station. Simple, hassle-free, done.' },
];

// ─── Price estimator ───
function estimatePrice(model, durationMins, numCycles) {
    if (durationMins <= 15) return model.price15 * numCycles;
    const extraBlocks = Math.ceil((durationMins - 15) / 30);
    return (model.price15 + (extraBlocks * model.price30)) * numCycles;
}

// ─── Fade-in wrapper ───
const FadeIn = ({ children, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

const SectionHeading = ({ children, sub }) => (
    <div className="text-center mb-14">
        <h2 className="font-cycles-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">{children}</h2>
        {sub && <p className="text-slate-400 text-lg max-w-2xl mx-auto">{sub}</p>}
    </div>
);

export default function CyclesPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedModelId, setSelectedModelId] = useState('solo');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState('');
    const modelsRef = useRef(null);

    const [form, setForm] = useState({
        name: '', phone: '', email: '',
        date: '', time: '', duration: '30',
        numCycles: 1, requests: '',
    });

    const selectedModel = cycleModels.find(m => m.id === selectedModelId);
    const durationMins = Number(form.duration) || 30;
    const estimatedTotal = selectedModel ? estimatePrice(selectedModel, durationMins, form.numCycles || 1) : 0;

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const openBookingModal = (modelId) => {
        setSelectedModelId(modelId);
        setSubmitted(false);
        setFormError('');
        setModalOpen(true);
    };

    const scrollToModels = () => modelsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const buildWhatsAppUrl = () => {
        const durationLabel = DURATION_OPTIONS.find(d => d.mins === durationMins)?.label || `${durationMins} minutes`;
        const msg = `Hi Infinite Yatra! I want to book a Cycle at Sabarmati Riverfront.

Name: ${form.name}
Phone: ${form.phone}
Cycle: ${selectedModel?.name}
Date: ${form.date}
Time: ${form.time}
Duration: ${durationLabel}
No. of Cycles: ${form.numCycles}
Special Request: ${form.requests || 'None'}
Estimated Total: ₹${estimatedTotal.toLocaleString('en-IN')}

Please confirm availability.`;
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    };

    const handleSubmit = async () => {
        if (!form.name || !form.phone || !form.email || !form.date) {
            setFormError('Please fill in all required fields.');
            return;
        }
        setFormError('');
        setSubmitting(true);
        try {
            const durationLabel = DURATION_OPTIONS.find(d => d.mins === durationMins)?.label || `${durationMins} minutes`;
            await addCycleBooking({
                name: form.name,
                phone: form.phone,
                email: form.email,
                cycle_model: selectedModel.name,
                cycle_id: selectedModel.id,
                price_per_unit: selectedModel.price15,
                date: form.date,
                time_slot: form.time,
                estimated_duration: durationLabel,
                num_cycles: Number(form.numCycles),
                special_request: form.requests,
                estimated_total: estimatedTotal,
            });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setFormError('Something went wrong. Please try WhatsApp booking instead.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="cycles-bg min-h-screen text-white font-sans overflow-x-hidden">
            <SEO
                title="Cycles & E-Cycles | Infinite Yatra"
                description="Explore Ahmedabad's Sabarmati Riverfront on cycles & e-cycles. 7 models from ₹50. Book now!"
                url="/cycles"
            />

            {/* ═══ HERO ═══ */}
            <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80" alt="Cycling on riverfront" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a] via-[#0a0f0a]/75 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f0a]/50 to-transparent" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-sm text-slate-300">
                                <MapPin size={14} className="text-green-400" /> Sardar Bridge, Ahmedabad
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-sm text-slate-300">
                                <Clock size={14} className="text-green-400" /> 6 AM – 11 PM Daily
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-sm text-slate-300">
                                <Zap size={14} className="text-blue-400" /> Electric options available
                            </span>
                        </div>
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.15 }} className="font-cycles-display text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-6 leading-[1.1]">
                        Ride the Riverfront
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10">
                        Explore Ahmedabad's Sabarmati on cycles & e-cycles
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I want to book cycles at Sabarmati Riverfront')}`} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-600/30 flex items-center gap-2">
                            📱 Book via WhatsApp
                        </a>
                        <button onClick={scrollToModels} className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-sm flex items-center gap-2">
                            View All Cycles <ChevronDown size={18} />
                        </button>
                    </motion.div>
                </div>

                <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                    <ChevronDown size={28} className="text-white/30" />
                </motion.div>
            </section>

            {/* ═══ SECTION 2 — CYCLE MODELS GRID ═══ */}
            <section ref={modelsRef} className="relative z-10 py-24 px-6 scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    <FadeIn><SectionHeading sub="7 models for every rider — from toddlers to thrill-seekers">Choose Your Ride</SectionHeading></FadeIn>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cycleModels.map((cycle, i) => (
                            <FadeIn key={cycle.id} delay={i * 0.06}>
                                <div className={`cycle-glass-card overflow-hidden ${cycle.isElectric ? 'border-blue-500/20' : ''}`} style={cycle.isElectric ? { boxShadow: '0 0 20px rgba(59,130,246,0.08)' } : {}}>
                                    {/* Image placeholder */}
                                    <div className="cycle-img-placeholder" data-cycle-id={cycle.id}>
                                        {cycle.realImageUrl ? (
                                            <img src={cycle.realImageUrl} alt={cycle.name} />
                                        ) : (
                                            <>
                                                <span className="placeholder-icon">{cycle.icon}</span>
                                                <span className="placeholder-label">{cycle.name}</span>
                                                <span className="placeholder-sub">Photo coming soon</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">{cycle.name}</h3>
                                            {cycle.isElectric && <span className="electric-badge">⚡ Electric</span>}
                                        </div>
                                        <p className="text-slate-400 text-sm italic mb-3">{cycle.tagline}</p>
                                        <p className="text-slate-500 text-sm mb-4 leading-relaxed">{cycle.description}</p>

                                        {/* Ideal for tags */}
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {cycle.idealFor.map((tag, j) => (
                                                <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-slate-400">{tag}</span>
                                            ))}
                                        </div>

                                        {/* Pricing */}
                                        <div className="bg-white/[0.03] rounded-xl p-4 mb-5 border border-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-sm">First 15 min</span>
                                                <span className="text-white font-bold text-lg">₹{cycle.price15}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-slate-500 text-xs">then every 30 min</span>
                                                <span className="text-slate-300 font-semibold">₹{cycle.price30}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openBookingModal(cycle.id)}
                                            className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                                            style={{ background: `${cycle.accentColor}22`, color: cycle.accentColor, border: `1px solid ${cycle.accentColor}44` }}
                                            onMouseEnter={e => { e.target.style.background = `${cycle.accentColor}33`; }}
                                            onMouseLeave={e => { e.target.style.background = `${cycle.accentColor}22`; }}
                                        >
                                            Book This Cycle
                                        </button>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 3 — PRICING TABLE ═══ */}
            <section className="relative z-10 py-24 px-6 border-y border-white/5">
                <div className="max-w-4xl mx-auto">
                    <FadeIn><SectionHeading sub="No hidden costs — what you see is what you pay">Simple, Transparent Pricing</SectionHeading></FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
                            <table className="cycles-pricing-table">
                                <thead>
                                    <tr>
                                        <th>Cycle</th>
                                        <th>First 15 Mins</th>
                                        <th>Every 30 Mins After</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cycleModels.map(c => (
                                        <tr key={c.id} className={c.isElectric ? 'electric-row' : ''}>
                                            <td className="font-bold">
                                                {c.name}
                                                {c.isElectric && <span className="ml-2 text-xs text-blue-400 font-semibold">Electric</span>}
                                            </td>
                                            <td className="font-semibold text-green-400">₹{c.price15}</td>
                                            <td className="font-semibold text-slate-300">₹{c.price30}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-slate-500 text-sm text-center mt-4">* Prices are per cycle. Government ID required at the time of rental.</p>
                    </FadeIn>
                </div>
            </section>

            {/* ═══ SECTION 4 — HOW IT WORKS ═══ */}
            <section className="relative z-10 py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <FadeIn><SectionHeading>How to Ride with Infinite Yatra</SectionHeading></FadeIn>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {HOW_STEPS.map((step, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="cycle-glass-card p-6 h-full">
                                    <div className="step-circle mb-5">{step.num}</div>
                                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 5 — IMPORTANT INFO ═══ */}
            <section className="relative z-10 py-24 px-6 border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                    <FadeIn><SectionHeading>Good to Know Before You Ride</SectionHeading></FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {INFO_CARDS.map((card, i) => (
                            <FadeIn key={i} delay={i * 0.06}>
                                <div className="info-card-green">
                                    <div className="flex items-start gap-4">
                                        <span className="text-2xl">{card.icon}</span>
                                        <div>
                                            <h4 className="text-white font-bold mb-1">{card.title}</h4>
                                            <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <div className="h-20" />

            {/* ═══ SECTION 6 — BOOKING MODAL ═══ */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div className="cycles-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)}>
                        <motion.div className="cycles-modal-content" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3 }} onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div>
                                    <h3 className="font-cycles-display text-2xl font-bold text-white">Book Your Ride</h3>
                                    <p className="text-slate-500 text-sm mt-1">🚲 Sabarmati Riverfront Cycles</p>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition"><X size={20} /></button>
                            </div>

                            {submitted ? (
                                <div className="p-8 text-center">
                                    <div className="text-6xl mb-4">🚲</div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Booking Request Received!</h3>
                                    <p className="text-slate-400 mb-2">Our team will confirm your cycle within 2 hours.</p>
                                    <p className="text-green-400 text-sm mb-6">🪪 Carry your Government ID on the day of ride.</p>
                                    <button onClick={() => setModalOpen(false)} className="px-8 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-bold transition">Close</button>
                                </div>
                            ) : (
                                <div className="p-6 space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                                        <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Your full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition placeholder:text-slate-600" />
                                    </div>

                                    {/* Phone + Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone *</label>
                                            <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition placeholder:text-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                                            <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="you@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition placeholder:text-slate-600" />
                                        </div>
                                    </div>

                                    {/* Model Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cycle Model</label>
                                        <select value={selectedModelId} onChange={e => setSelectedModelId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition appearance-none cursor-pointer">
                                            {cycleModels.map(m => (
                                                <option key={m.id} value={m.id} className="bg-[#111] text-white">
                                                    {m.name} — ₹{m.price15}/15min ({m.tagline})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date + Time */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Date *</label>
                                            <input type="date" value={form.date} onChange={e => handleChange('date', e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Time</label>
                                            <input type="time" value={form.time} onChange={e => handleChange('time', e.target.value)} min="06:00" max="22:30" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition" />
                                        </div>
                                    </div>

                                    {/* Duration + Num Cycles */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Duration</label>
                                            <select value={form.duration} onChange={e => handleChange('duration', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition appearance-none cursor-pointer">
                                                {DURATION_OPTIONS.map(d => (
                                                    <option key={d.mins} value={d.mins} className="bg-[#111] text-white">{d.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Number of Cycles</label>
                                            <input type="number" min={1} max={10} value={form.numCycles} onChange={e => handleChange('numCycles', Math.max(1, Math.min(10, Number(e.target.value))))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition" />
                                        </div>
                                    </div>

                                    {/* Special Request */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Special Request (Optional)</label>
                                        <textarea rows={2} value={form.requests} onChange={e => handleChange('requests', e.target.value)} placeholder="Any preferences or requests..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500/50 transition resize-none placeholder:text-slate-600" />
                                    </div>

                                    {/* Estimated Total */}
                                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-slate-400 text-sm">
                                                {selectedModel?.name} × {form.numCycles} cycle{form.numCycles > 1 ? 's' : ''} × {DURATION_OPTIONS.find(d => d.mins === durationMins)?.label || `${durationMins} min`}
                                            </span>
                                            <span className="text-2xl font-black text-green-400">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="text-slate-500 text-xs">*Estimate only. Actual charges at rental station.</p>
                                    </div>

                                    {formError && (
                                        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{formError}</p>
                                    )}

                                    {/* Submit buttons */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition text-sm">
                                            📱 Book via WhatsApp
                                        </a>
                                        <button onClick={handleSubmit} disabled={submitting} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black rounded-xl font-bold transition text-sm disabled:opacity-50">
                                            {submitting ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <>✅ Submit Request</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
