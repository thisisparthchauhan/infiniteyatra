import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, ChevronDown, Check, Zap, Clock } from 'lucide-react';
import SEO from '../../components/SEO';
import ExploreOtherTransport from '../../components/ExploreOtherTransport';
import { listenToVehicles, getVehicleCities } from '../../services/vehicleService';
import { addCycleBooking } from '../../services/cycleService';
import './CyclesPage.css';

const WHATSAPP_NUMBER = '919265799325';

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

export default function CyclesPage() {
    const [vehicles, setVehicles] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('Ahmedabad');
    
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    
    // Booking Form State
    const [form, setForm] = useState({
        name: '', phone: '', email: '',
        date: '', time: '', duration: '30',
        numCycles: 1, requests: '', city: 'Ahmedabad'
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState('');

    const gridRef = useRef(null);

    // Fetch data
    useEffect(() => {
        let mounted = true;
        
        getVehicleCities(true).then(citiesData => {
            if(mounted) setCities(citiesData);
        }).catch(err => console.error(err));

        const unsub = listenToVehicles({ type: 'cycle', isAvailable: true }, (data) => {
            if(mounted) {
                setVehicles(data);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsub();
        };
    }, []);

    // Sync city selection to booking form
    useEffect(() => {
        setForm(prev => ({ ...prev, city: selectedCity }));
    }, [selectedCity]);

    const scrollToGrid = () => {
        gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
    };

    // Filter vehicles by city and sort
    const cityVehicles = vehicles.filter(v => v.cities && v.cities.includes(selectedCity));
    
    // Sort logic: Featured first (ordered by featuredOrder), then rest
    const sortedVehicles = [...cityVehicles].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isFeatured && b.isFeatured) return (a.featuredOrder || 0) - (b.featuredOrder || 0);
        return 0; // maintain original order for non-featured
    });

    // Modals
    const openDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setDetailModalOpen(true);
    };

    const openBooking = (vehicle) => {
        setSelectedVehicle(vehicle);
        setSubmitted(false);
        setFormError('');
        setDetailModalOpen(false); // Close details if open
        setBookingModalOpen(true);
    };

    const handleBookingChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Pricing calculation
    const estimatePrice = () => {
        if (!selectedVehicle) return 0;
        const durationMins = Number(form.duration) || 30;
        const numCycles = Number(form.numCycles) || 1;
        
        const p15 = Number(selectedVehicle.pricing?.per15min) || 0;
        const p30 = Number(selectedVehicle.pricing?.per30min) || 0;
        
        if (durationMins <= 15) return p15 * numCycles;
        const extraBlocks = Math.ceil((durationMins - 15) / 30);
        return (p15 + (extraBlocks * p30)) * numCycles;
    };

    const estimatedTotal = estimatePrice();

    const buildWhatsAppUrl = () => {
        const msg = `Hi Infinite Yatra! I want to book a Cycle.
        
City: ${form.city}
Name: ${form.name}
Phone: ${form.phone}
Cycle: ${selectedVehicle?.name}
Date: ${form.date}
Time: ${form.time}
Duration: ${form.duration} minutes
No. of Cycles: ${form.numCycles}
Special Request: ${form.requests || 'None'}
Estimated Total: ₹${estimatedTotal.toLocaleString('en-IN')}

Please confirm availability.`;
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    };

    const submitBooking = async () => {
        if (!form.name || !form.phone || !form.email || !form.date) {
            setFormError('Please fill in all required fields.');
            return;
        }
        setFormError('');
        setSubmitting(true);
        try {
            await addCycleBooking({
                name: form.name,
                phone: form.phone,
                email: form.email,
                city: form.city,
                cycle_model: selectedVehicle.name,
                cycle_id: selectedVehicle.id,
                price_per_unit: Number(selectedVehicle.pricing?.per15min) || 0,
                date: form.date,
                time_slot: form.time,
                estimated_duration: `${form.duration} mins`,
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
        <div className="cycles-bg min-h-screen font-cycles-sans overflow-x-hidden">
            <SEO title="Cycles & E-Cycles | Infinite Yatra" description="Ride the riverfront. Two wheels, infinite freedom. Zero emissions, zero stress." url="/cycles" />

            {/* ═══ 3A. HERO SECTION ═══ */}
            <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80" alt="Cycling" className="w-full h-full object-cover" />
                    {/* Vignette & Fade Gradients */}
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)' }} />
                    <div className="absolute inset-x-0 bottom-0 h-[40%]" style={{ background: 'linear-gradient(to top, #0a0f0a 0%, transparent 100%)' }} />
                </div>
                
                {/* Particles */}
                <div className="hero-particles">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="hero-particle" style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${8 + Math.random() * 6}s`
                        }} />
                    ))}
                </div>

                <div className="relative z-10 text-center px-6 w-full max-w-5xl mx-auto flex flex-col items-center">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 2 }}>
                        <span className="text-[11px] tracking-[0.3em] font-bold text-[#22c55e]/70 uppercase font-cycles-sans mb-6 block">FEEL THE WIND. OWN THE ROAD.</span>
                    </motion.div>
                    
                    <motion.h1 className="font-cycles-display font-bold text-[#f0f8f0] leading-[0.95] mb-6" style={{ fontSize: 'clamp(56px, 9vw, 120px)' }}>
                        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 1 }} className="block">Two Wheels.</motion.span>
                        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="block">
                            <span className="text-[#22c55e]">Infinite</span> Freedom.
                        </motion.span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="font-cycles-sans italic font-light text-[18px] text-white/65 max-w-2xl mx-auto mb-2 text-center">
                        No traffic. No fuel. No stress.<br/>
                        Just you, the riverfront, and the open air.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }} className="flex flex-col items-center w-full">
                        <div className="city-selector-hero shadow-2xl">
                            <span className="text-xl">🌍</span>
                            <span className="text-slate-300 font-medium">Riding in</span>
                            <div className="relative">
                                <select className="city-select-dropdown" value={selectedCity} onChange={handleCityChange}>
                                    {cities.length > 0 ? (
                                        cities.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                                    ) : (
                                        <option value="Ahmedabad">Ahmedabad</option>
                                    )}
                                </select>
                            </div>
                            <button onClick={scrollToGrid} className="ml-2 text-[#22c55e] hover:text-[#4ade80] transition-colors flex items-center gap-1 font-bold text-sm">
                                → Show Available Cycles
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
                            <button onClick={scrollToGrid} className="px-8 py-3.5 bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-full font-bold transition-all shadow-lg shadow-green-500/20 w-full sm:w-auto">
                                🚲 Explore Cycles →
                            </button>
                            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I want to rent cycles in ${selectedCity}.`)}`} target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-transparent border border-[#22c55e] text-white hover:bg-[#22c55e]/10 rounded-full font-bold transition-all w-full sm:w-auto text-center">
                                📱 Book via WhatsApp
                            </a>
                        </div>
                    </motion.div>
                </div>

                <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                    <ChevronDown size={28} className="text-[#22c55e]/60" />
                </motion.div>
            </section>

            {/* ═══ 3B. EMOTIONAL PULL SECTION ═══ */}
            <section className="py-20 px-6 bg-[#050a06] relative z-10 w-full">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 text-center">
                        <FadeIn delay={0.1}>
                            <div className="text-4xl mb-4">🌿</div>
                            <h3 className="text-[#22c55e] text-xl font-bold mb-2">Zero Emissions</h3>
                            <p className="text-slate-400">Breathe clean air</p>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <div className="text-4xl mb-4">🏙️</div>
                            <h3 className="text-[#22c55e] text-xl font-bold mb-2">12km Riverfront</h3>
                            <p className="text-slate-400">Ready to explore</p>
                        </FadeIn>
                        <FadeIn delay={0.3}>
                            <div className="text-4xl mb-4">⚡</div>
                            <h3 className="text-[#22c55e] text-xl font-bold mb-2">2 mins to start</h3>
                            <p className="text-slate-400">Pick up & go</p>
                        </FadeIn>
                    </div>

                    <FadeIn delay={0.4}>
                        <div className="max-w-[700px] mx-auto text-center">
                            <p className="font-cycles-sans italic text-[26px] md:text-[32px] text-white/80 leading-snug">
                                "The best way to see Ahmedabad is from the seat of a cycle — slow enough to notice, fast enough to feel free."
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ═══ 3C. WHY CHOOSE CYCLES ═══ */}
            <section className="py-20 px-6 bg-[#08120a] relative z-10 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <FadeIn><h2 className="font-cycles-display text-4xl md:text-5xl font-bold text-center mb-16">Why Riders Love This</h2></FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: '🌬️', title: 'Feel Every Breeze', desc: "No windows between you and Ahmedabad's morning air." },
                            { icon: '🛣️', title: "Go Where Cars Can't", desc: "Narrow lanes, riverfront paths, Sabarmati promenades — all yours." },
                            { icon: '💪', title: 'Ride at Your Pace', desc: "No schedules. No drivers. Just your rhythm, your route." },
                            { icon: '🌱', title: 'Zero Guilt Travel', desc: "100% eco-friendly. Good for you, great for the city." },
                            { icon: '💸', title: 'Unbeatable Value', desc: "Starting ₹50 for 15 mins. The best per-minute fun you'll find in the city." },
                            { icon: '⚡', title: 'Electric Options Available', desc: "No effort needed. Let the E-cycle carry you while you soak it all in." },
                        ].map((reason, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="reason-card h-full">
                                    <div className="text-3xl mb-4">{reason.icon}</div>
                                    <h3 className="text-lg font-bold text-white mb-2">{reason.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{reason.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ 3D. HOW IT WORKS ═══ */}
            <section className="py-20 px-6 bg-[#050a06] relative z-10">
                <div className="max-w-6xl mx-auto">
                    <FadeIn><h2 className="font-cycles-display text-4xl md:text-5xl font-bold text-center mb-16">How to Rent in 4 Steps</h2></FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { title: 'CHOOSE YOUR CITY', desc: 'Select your city above and browse available cycle models.' },
                            { title: 'PICK YOUR CYCLE', desc: 'Solo, Duo, Electric, Family — choose what fits your vibe.' },
                            { title: 'BOOK WITH US', desc: 'Submit a request online or WhatsApp us directly. We confirm within 2 hours.' },
                            { title: 'RIDE FREE', desc: 'Arrive at the station, show your ID, grab your cycle, and go.' }
                        ].map((step, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="step-card">
                                    <div className="step-number">0{i+1}</div>
                                    <h3 className="text-sm font-bold text-white mb-2 tracking-wide">{step.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ 3E. FEATURED CYCLES GRID ═══ */}
            <section ref={gridRef} className="py-24 px-6 bg-[#08120a] relative z-10 scroll-mt-20 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                        <FadeIn>
                            <h2 className="font-cycles-display text-4xl md:text-5xl font-bold">Our Best Rides</h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <div className="bg-[#111a12] border border-[#22c55e]/30 rounded-full px-4 py-2 flex items-center gap-2">
                                <MapPin size={16} className="text-[#22c55e]" />
                                <select className="bg-transparent text-white font-medium outline-none cursor-pointer appearance-none pr-4" value={selectedCity} onChange={handleCityChange}>
                                    {cities.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    {cities.length === 0 && <option value="Ahmedabad">Ahmedabad</option>}
                                </select>
                                <ChevronDown size={14} className="text-[#22c55e] -ml-3" />
                            </div>
                        </FadeIn>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-[#22c55e] border-t-transparent rounded-full"></div></div>
                    ) : sortedVehicles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedVehicles.map((vehicle, i) => (
                                <FadeIn key={vehicle.id} delay={i * 0.1}>
                                    <div className="cycle-card">
                                        <div className="relative">
                                            {vehicle.mainImage ? (
                                                <img src={vehicle.mainImage} alt={vehicle.name} className="card-image" />
                                            ) : (
                                                <div className="placeholder-image">
                                                    <span className="text-5xl mb-2">{vehicle.specs?.isElectric ? '⚡' : '🚲'}</span>
                                                    <span className="text-sm opacity-60 font-semibold">{vehicle.name}</span>
                                                    <span className="text-[11px] opacity-40 mt-1">Photo coming soon</span>
                                                </div>
                                            )}
                                            {vehicle.specs?.isElectric && (
                                                <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                    <Zap size={12} fill="currentColor"/> Electric
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <h3 className="text-2xl font-bold text-white mb-1">{vehicle.name}</h3>
                                            <p className="text-slate-400 text-sm italic mb-4">{vehicle.tagline}</p>
                                            
                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <MapPin size={14} className="text-[#22c55e]"/> {selectedCity}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Clock size={14} className="text-[#22c55e]"/> {vehicle.operatingHours || '6 AM – 11 PM'}
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="text-[#22c55e] font-bold text-xl mb-4">
                                                    {vehicle.pricing?.per15min ? `₹${vehicle.pricing.per15min} / 15 min` : 'Price on request'}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openDetails(vehicle)} className="flex-1 py-3 text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition">View Details</button>
                                                    <button onClick={() => openBooking(vehicle)} className="flex-1 py-3 text-sm font-bold text-black bg-[#22c55e] hover:bg-[#16a34a] rounded-xl transition shadow-[0_0_15px_rgba(34,197,94,0.3)]">Book This →</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-[#111a12] rounded-2xl border border-[#22c55e]/20">
                            <h3 className="text-2xl font-bold text-white mb-3">No cycles available in {selectedCity} yet.</h3>
                            <p className="text-slate-400 mb-6">We're expanding soon! Meanwhile, explore what's available in Ahmedabad.</p>
                            <button onClick={() => setSelectedCity('Ahmedabad')} className="px-6 py-2.5 bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 rounded-full font-bold transition">Switch to Ahmedabad →</button>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ 3F. CITY AVAILABILITY BANNER ═══ */}
            <section className="py-12 bg-[#050a06] border-y border-white/5 relative z-10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-[#111a12] border border-[#22c55e]/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
                        <div className="p-3 bg-[#22c55e]/20 rounded-full shrink-0">
                            <MapPin className="text-[#22c55e]" size={24} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">Currently available in: <span className="text-[#22c55e]">Ahmedabad</span></p>
                            <p className="text-slate-500 text-sm mt-1">More cities coming soon — Delhi · Mumbai · Jaipur · Surat</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ 3G. READY TO RIDE CTA ═══ */}
            <section className="py-24 px-6 relative z-10 bg-[#050a06]">
                <div className="max-w-4xl mx-auto">
                    <FadeIn>
                        <div className="relative overflow-hidden rounded-[32px] border border-[#22c55e]/20" style={{ background: 'linear-gradient(135deg, #0a1a0a, #0d2010)'}}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
                            <div className="relative z-10 px-6 py-20 text-center">
                                <h2 className="font-cycles-display text-5xl md:text-6xl font-bold text-white mb-6">The riverfront is waiting.</h2>
                                <div className="text-[#22c55e] font-bold text-2xl md:text-3xl mb-4">Starting from ₹50 / 15 min</div>
                                <p className="text-slate-400 mb-10 max-w-md mx-auto">No advance payment needed for most bookings. Just show up and ride.</p>
                                
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                                    <button onClick={scrollToGrid} className="w-full sm:w-auto px-8 py-4 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded-full transition shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                        🚲 Book Your Cycle Now →
                                    </button>
                                    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#22c55e]/50 text-white hover:bg-[#22c55e]/10 font-bold rounded-full transition text-center">
                                        📱 WhatsApp Us
                                    </a>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ═══ EXPLORE OTHER TRANSPORT ═══ */}
            <ExploreOtherTransport currentKey="cycles" />

            {/* ═══ DETAIL MODAL ═══ */}
            <AnimatePresence>
                {detailModalOpen && selectedVehicle && (
                    <motion.div className="detail-modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setDetailModalOpen(false)}>
                        <motion.div className="detail-modal-content" initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.95, y:20}} onClick={e=>e.stopPropagation()}>
                            <div className="sticky top-0 z-20 flex justify-between items-center p-4 bg-[#0a0f0a]/90 backdrop-blur border-b border-white/5">
                                <h3 className="text-xl font-bold text-white">{selectedVehicle.name}</h3>
                                <button onClick={() => setDetailModalOpen(false)} className="p-2 bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={18}/></button>
                            </div>
                            
                            <div className="p-6">
                                {/* Image Gallery Scroll */}
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                    {selectedVehicle.mainImage && (
                                        <div className="w-[80%] md:w-[60%] shrink-0 aspect-video rounded-xl overflow-hidden snap-center">
                                            <img src={selectedVehicle.mainImage} alt="Main" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {(selectedVehicle.galleryImages || []).map((img, i) => (
                                        <div key={i} className="w-[80%] md:w-[60%] shrink-0 aspect-video rounded-xl overflow-hidden snap-center">
                                            <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <p className="text-slate-300 leading-relaxed mb-6">{selectedVehicle.description}</p>
                                    
                                    <h4 className="font-bold text-white mb-3">Specifications</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-white/5 p-3 rounded-lg"><div className="text-xs text-slate-500 mb-1">Max Load</div><div className="text-sm font-semibold text-white">{selectedVehicle.specs?.maxLoad || 'N/A'}</div></div>
                                        <div className="bg-white/5 p-3 rounded-lg"><div className="text-xs text-slate-500 mb-1">Age Limit</div><div className="text-sm font-semibold text-white">{selectedVehicle.specs?.ageRestriction || 'N/A'}</div></div>
                                        <div className="bg-white/5 p-3 rounded-lg"><div className="text-xs text-slate-500 mb-1">Type</div><div className="text-sm font-semibold text-white flex items-center gap-1">{selectedVehicle.specs?.isElectric ? <><Zap size={12} className="text-blue-400"/> EV</> : 'Pedal'}</div></div>
                                        {selectedVehicle.specs?.isElectric && <div className="bg-white/5 p-3 rounded-lg"><div className="text-xs text-slate-500 mb-1">Range</div><div className="text-sm font-semibold text-white">{selectedVehicle.specs?.batteryRange || 'N/A'}</div></div>}
                                    </div>

                                    {selectedVehicle.specs?.features?.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="font-bold text-white mb-3">Features</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedVehicle.specs.features.map(f => <span key={f} className="bg-white/10 text-slate-300 px-3 py-1 rounded-full text-xs font-medium"><Check size={12} className="inline mr-1 text-[#22c55e]"/>{f}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <h4 className="font-bold text-white mb-3">Pricing</h4>
                                    <div className="bg-white/5 p-4 rounded-xl mb-8">
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <div className="text-slate-400">First 15 mins</div><div className="text-white font-bold text-right">₹{selectedVehicle.pricing?.per15min || '-'}</div>
                                            <div className="text-slate-400">First 30 mins</div><div className="text-white font-bold text-right">₹{selectedVehicle.pricing?.per30min || '-'}</div>
                                            {selectedVehicle.pricing?.perHour && <><div className="text-slate-400">Per Hour</div><div className="text-white font-bold text-right">₹{selectedVehicle.pricing.perHour}</div></>}
                                            {selectedVehicle.pricing?.perDay && <><div className="text-slate-400">Full Day</div><div className="text-white font-bold text-right">₹{selectedVehicle.pricing.perDay}</div></>}
                                        </div>
                                        {selectedVehicle.pricing?.notes && <p className="mt-3 text-xs text-slate-500 italic text-center">{selectedVehicle.pricing.notes}</p>}
                                    </div>

                                    <button onClick={() => openBooking(selectedVehicle)} className="w-full py-4 bg-[#22c55e] text-black font-bold rounded-xl text-lg hover:bg-[#16a34a] transition">
                                        Book This Cycle
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ 3H. BOOKING MODAL ═══ */}
            <AnimatePresence>
                {bookingModalOpen && selectedVehicle && (
                    <motion.div className="cycles-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBookingModalOpen(false)}>
                        <motion.div className="cycles-modal-content" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.3 }} onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div>
                                    <h3 className="font-cycles-display text-2xl font-bold text-white">Book Your Ride</h3>
                                    <p className="text-slate-500 text-sm mt-1">🚲 {selectedVehicle.name}</p>
                                </div>
                                <button onClick={() => setBookingModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition"><X size={20} /></button>
                            </div>

                            {submitted ? (
                                <div className="p-8 text-center">
                                    <div className="text-6xl mb-4">✅</div>
                                    <h3 className="text-2xl font-bold text-white mb-3">Booking Request Received!</h3>
                                    <p className="text-slate-400 mb-2">Our team will confirm your cycle within 2 hours.</p>
                                    <p className="text-[#22c55e] text-sm mb-6">🪪 Carry your Government ID on the day of ride.</p>
                                    <button onClick={() => setBookingModalOpen(false)} className="px-8 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-bold transition">Close Window</button>
                                </div>
                            ) : (
                                <div className="p-6 space-y-5">
                                    {/* City Info */}
                                    <div className="bg-[#111a12] border border-[#22c55e]/20 p-3 rounded-lg flex items-center gap-3">
                                        <MapPin className="text-[#22c55e]" size={16}/>
                                        <div className="font-medium text-white flex-1">City:</div>
                                        <select value={form.city} onChange={e => handleBookingChange('city', e.target.value)} className="bg-transparent text-white outline-none font-bold text-right cursor-pointer">
                                            <option value="Ahmedabad">Ahmedabad</option>
                                            {cities.filter(c => c.name !== 'Ahmedabad' && c.isActive).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                                        <input type="text" value={form.name} onChange={e => handleBookingChange('name', e.target.value)} placeholder="Your full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition" />
                                    </div>

                                    {/* Phone + Email */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone *</label>
                                            <input type="tel" value={form.phone} onChange={e => handleBookingChange('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                                            <input type="email" value={form.email} onChange={e => handleBookingChange('email', e.target.value)} placeholder="you@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition" />
                                        </div>
                                    </div>

                                    {/* Date + Time */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date *</label>
                                            <input type="date" value={form.date} onChange={e => handleBookingChange('date', e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time</label>
                                            <input type="time" value={form.time} onChange={e => handleBookingChange('time', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition" />
                                        </div>
                                    </div>

                                    {/* Duration + Units */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration</label>
                                            <select value={form.duration} onChange={e => handleBookingChange('duration', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition appearance-none cursor-pointer">
                                                <option value="15">15 minutes</option>
                                                <option value="30">30 minutes</option>
                                                <option value="45">45 minutes</option>
                                                <option value="60">1 hour</option>
                                                <option value="120">2 hours</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">No. of Cycles</label>
                                            <input type="number" min={1} max={10} value={form.numCycles} onChange={e => handleBookingChange('numCycles', Math.max(1, Number(e.target.value)))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition" />
                                        </div>
                                    </div>

                                    {/* Request */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Special Request</label>
                                        <textarea rows={2} value={form.requests} onChange={e => handleBookingChange('requests', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#22c55e]/50 transition resize-none" />
                                    </div>

                                    {/* Total */}
                                    <div className="bg-[#111a12] border border-[#22c55e]/30 rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-slate-400 text-sm">Estimated Total</span>
                                            <span className="text-2xl font-black text-[#22c55e]">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="text-slate-500 text-xs">*Estimate only based on base pricing. Final amount at station.</p>
                                    </div>

                                    {formError && <p className="text-red-400 text-sm">{formError}</p>}

                                    {/* Buttons */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center py-3.5 bg-transparent border border-white/20 hover:bg-white/10 text-white rounded-xl font-bold transition text-sm">
                                            📱 Book via WhatsApp
                                        </a>
                                        <button onClick={submitBooking} disabled={submitting} className="flex items-center justify-center py-3.5 bg-[#22c55e] hover:bg-[#16a34a] text-black rounded-xl font-bold transition text-sm disabled:opacity-50">
                                            {submitting ? 'Submitting...' : '✅ Submit Request'}
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
