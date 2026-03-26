import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, ChevronDown, Anchor } from 'lucide-react';
import SEO from '../components/SEO';
import { addCruiseBooking } from '../services/cruiseService';
import './CruisePage.css';

const WHATSAPP_NUMBER = '919265799325';

const OCCASIONS = [
    'None / General Booking', 'Birthday Party', 'Anniversary', 'Pre-Wedding Celebration',
    'Ring Ceremony', 'Business Conference', 'Photoshoot', 'Kitty Party', 'Other',
];

const SLOTS = [
    {
        id: "lunch",
        name: "Lunch Cruise",
        tagline: "Golden hour on the water",
        description: "Enjoy a gourmet buffet lunch with panoramic river views and the iconic Atal Bridge as your backdrop.",
        time: "1:00 PM",
        price: 1199,
        badge: "Daytime Scenic",
        badgeColor: "#d97706",
        topBorderColor: "#f59e0b",
        cardGlow: "rgba(245,158,11,0.06)",
        mood: "afternoon"
    },
    {
        id: "dinner1",
        name: "Dinner Slot 1",
        tagline: "The signature evening experience",
        description: "Golden hour transitions into a magical lit evening on the Sabarmati. The perfect dinner voyage.",
        time: "7:00 PM",
        price: 2499,
        badge: "Most Popular",
        badgeColor: "#c8a84b",
        topBorderColor: "#c8a84b",
        cardGlow: "rgba(200,168,75,0.08)",
        mood: "evening",
        featured: true
    },
    {
        id: "dinner2",
        name: "Dinner Slot 2",
        tagline: "Sail beneath the night sky",
        description: "Full gourmet dining under the stars. Live music, unlimited mocktails, open deck — pure night magic.",
        time: "9:00 PM",
        price: 2499,
        badge: "Evening Glow",
        badgeColor: "#0e7490",
        topBorderColor: "#22d3ee",
        cardGlow: "rgba(14,116,144,0.06)",
        mood: "night"
    },
    {
        id: "party",
        name: "River Blue Party",
        tagline: "Ahmedabad's most electric night out",
        description: "Mocktail bar, dance floor, live beats, and the Sabarmati glittering below. Every Friday & Saturday.",
        time: "11:00 PM – 12:45 AM",
        price: 2599,
        badge: "18+ · Fri & Sat",
        badgeColor: "#7c3aed",
        topBorderColor: "#8b5cf6",
        cardGlow: "rgba(124,58,237,0.07)",
        mood: "party"
    }
];

export default function CruisePage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState('dinner1');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState('');
    const slotsRef = useRef(null);

    // Fade-up observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    // Form state
    const [form, setForm] = useState({
        name: '', phone: '', email: '',
        guests: 2, date: '', occasion: OCCASIONS[0], requests: '',
    });

    const selectedSlot = SLOTS.find(s => s.id === selectedSlotId);
    const estimatedTotal = (selectedSlot?.price || 0) * (form.guests || 1);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const openBookingModal = (slotId) => {
        setSelectedSlotId(slotId);
        setSubmitted(false);
        setFormError('');
        setModalOpen(true);
    };

    const scrollToSlots = () => slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // ── WhatsApp message builder ──
    const getWhatsAppUrl = (type = 'booking') => {
        let msg = '';
        if (type === 'private') {
            msg = `Hi Infinite Yatra! I want to enquire about a private River Cruise booking for a special occasion.`;
        } else {
            msg = `Hi Infinite Yatra! I want to book the River Cruise.

Name: ${form.name}
Phone: ${form.phone}
Slot: ${selectedSlot?.name} (${selectedSlot?.time})
Date: ${form.date}
Guests: ${form.guests}
Occasion: ${form.occasion}
Special Requests: ${form.requests || 'None'}
Estimated Total: ₹${estimatedTotal.toLocaleString('en-IN')}`;
        }
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    };

    // ── Firestore submit ──
    const handleSubmit = async () => {
        if (!form.name || !form.phone || !form.email || !form.date) {
            setFormError('Please fill in all required fields.');
            return;
        }
        setFormError('');
        setSubmitting(true);
        try {
            await addCruiseBooking({
                name: form.name,
                phone: form.phone,
                email: form.email,
                slot: `${selectedSlot.name} - ${selectedSlot.time}`,
                slot_price: selectedSlot.price,
                guests: Number(form.guests),
                date: form.date,
                occasion: form.occasion,
                special_requests: form.requests,
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
        <div className="cruise-page">
            <SEO
                title="River Cruise | Infinite Yatra | Ahmedabad"
                description="Sail the Sabarmati — Ahmedabad's most luxurious river dining experience. Gourmet buffet, live music, open deck."
                url="/cruise"
            />

            {/* SECTION 1 — HERO */}
            <section className="cruise-section h-[100vh] min-h-[700px] flex items-center justify-center text-center px-4 relative">
                {/* Background Image & Overlays */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=90" 
                        alt="Night Water" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,8,15,0.5) 0%, rgba(4,8,15,0.3) 40%, rgba(4,8,15,0.85) 80%, rgba(4,8,15,1) 100%)' }}></div>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(200,168,75,0.08) 0%, transparent 60%)' }}></div>
                </div>

                <div className="relative z-10 w-full max-w-4xl pt-16">
                    <div className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8" style={{ background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.3)' }}>
                        <Anchor size={14} style={{ color: 'var(--cruise-gold-primary)' }} />
                        <span style={{ color: 'var(--cruise-gold-primary)', fontSize: '13px', letterSpacing: '0.1em', fontWeight: '500' }}>
                            Atal Bridge · Sabarmati Riverfront · Ahmedabad
                        </span>
                    </div>

                    <div className="fade-up text-[11px] tracking-[0.25em] uppercase mb-4" style={{ color: 'var(--cruise-text-muted)' }}>
                        An Infinite Yatra Experience
                    </div>

                    <h1 className="fade-up hero-headline mb-6" style={{ transitionDelay: '0.1s' }}>
                        Sail the Sabarmati
                    </h1>

                    <p className="fade-up italic text-[22px] mb-8" style={{ color: 'var(--cruise-text-secondary)', fontFamily: "'Cormorant Garamond', serif", transitionDelay: '0.3s' }}>
                        Ahmedabad's most luxurious river dining experience
                    </p>

                    <div className="fade-up hero-divider mb-12" style={{ transitionDelay: '0.5s' }}>
                        <div className="hero-divider-line"></div>
                        <span className="hero-divider-dot">✦</span>
                        <div className="hero-divider-line"></div>
                    </div>

                    <div className="fade-up flex flex-col sm:flex-row items-center justify-center gap-5" style={{ transitionDelay: '0.6s' }}>
                        <a href={getWhatsAppUrl('booking')} target="_blank" rel="noopener noreferrer" className="btn-gold-primary w-full sm:w-auto">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            Book via WhatsApp
                        </a>
                        <button onClick={scrollToSlots} className="btn-gold-ghost w-full sm:w-auto">
                            Check Availability <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator">
                    <ChevronDown size={28} style={{ color: 'var(--cruise-gold-primary)' }} />
                </div>
            </section>

            {/* SECTION 2 — EXPERIENCE HIGHLIGHTS */}
            <section className="cruise-section pt-[120px] pb-[120px]" style={{ background: 'var(--cruise-bg-deep)' }}>
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.2), transparent)' }}></div>
                
                <div className="text-center mb-16 fade-up">
                    <h2 className="text-[clamp(38px,5vw,62px)] font-bold mb-2">Five Reasons to Step Aboard</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>Every voyage is a world unto itself</p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '16px auto' }}></div>
                </div>

                <div className="highlights-grid fade-up-group">
                    {/* Card 1 - Large */}
                    <div className="highlight-card card-large fade-up" style={{ borderLeft: '3px solid var(--cruise-gold-primary)' }}>
                        <div className="text-[32px] mb-4" style={{ color: 'var(--cruise-gold-primary)' }}>⚜</div>
                        <h3 className="text-[26px] font-semibold mb-3">World Cuisine Buffet</h3>
                        <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>
                            Thai, Chinese, Italian, Mexican, Japanese, Indian & Continental — <br className="hidden sm:block" /> fifteen cuisines on one magical voyage
                        </p>
                    </div>

                    {/* Card 2 - Tall */}
                    <div className="highlight-card card-tall fade-up flex flex-col">
                        <div className="text-[32px] mb-4" style={{ color: 'var(--cruise-gold-primary)' }}>♪</div>
                        <h3 className="text-[26px] font-semibold mb-3">Live Music</h3>
                        <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>
                            Soothing live performances as the lit Atal Bridge glides past your panoramic window.
                        </p>
                        <div className="music-wave-bars mt-auto">
                            <div className="music-wave-bar"></div>
                            <div className="music-wave-bar"></div>
                            <div className="music-wave-bar"></div>
                            <div className="music-wave-bar"></div>
                            <div className="music-wave-bar"></div>
                        </div>
                    </div>

                    {/* Card 3 - Small */}
                    <div className="highlight-card card-small fade-up">
                        <div className="text-[32px] mb-4" style={{ color: 'var(--cruise-gold-primary)' }}>🍸</div>
                        <h3 className="text-[26px] font-semibold mb-3">Mocktail Bar</h3>
                        <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>
                            Unlimited mocktails & soft beverages throughout your journey
                        </p>
                    </div>

                    {/* Card 4 - Small */}
                    <div className="highlight-card card-small fade-up">
                        <div className="text-[32px] mb-4" style={{ color: 'var(--cruise-gold-primary)' }}>🌃</div>
                        <h3 className="text-[26px] font-semibold mb-3">Night Skyline</h3>
                        <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>
                            Open deck access — Ahmedabad lit up, perfectly framed
                        </p>
                    </div>

                    {/* Card 5 - Full Width */}
                    <div className="highlight-card fade-up col-span-1 md:col-span-3">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="text-[40px]" style={{ color: 'var(--cruise-gold-primary)' }}>✨</div>
                            <div>
                                <h3 className="text-[26px] font-semibold mb-2">Private Events</h3>
                                <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>
                                    Birthdays, anniversaries, pre-wedding, business conferences — fully customizable spatial arrangements and menus.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 — CHOOSE YOUR VOYAGE */}
            <section ref={slotsRef} className="cruise-section pt-[120px] pb-[160px]" style={{ background: 'var(--cruise-bg-primary)' }}>
                <div className="text-center mb-16 fade-up">
                    <h2 className="text-[clamp(38px,5vw,62px)] font-bold mb-2">Choose Your Voyage</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>Select the experience that calls to you</p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '16px auto' }}></div>
                </div>

                <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-5 fade-up-group">
                    {SLOTS.map((slot, index) => (
                        <div key={slot.id} className={`slot-card fade-up ${slot.featured ? 'featured' : ''}`} style={{ borderTopColor: slot.topBorderColor, background: `linear-gradient(160deg, var(--cruise-bg-card), ${slot.cardGlow})` }}>
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                                <h3 className="text-[28px] font-bold">{slot.name}</h3>
                                <div className="slot-badge" style={{ background: `rgba(${parseInt(slot.badgeColor.slice(1,3), 16)}, ${parseInt(slot.badgeColor.slice(3,5), 16)}, ${parseInt(slot.badgeColor.slice(5,7), 16)}, 0.15)`, borderColor: `rgba(${parseInt(slot.badgeColor.slice(1,3), 16)}, ${parseInt(slot.badgeColor.slice(3,5), 16)}, ${parseInt(slot.badgeColor.slice(5,7), 16)}, 0.4)`, color: slot.badgeColor }}>
                                    {slot.badge}
                                </div>
                            </div>
                            
                            <p className="italic text-[16px] mb-4" style={{ color: slot.topBorderColor }}>{slot.tagline}</p>
                            <p className="text-[15px] leading-[1.6] mb-6 flex-grow" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>{slot.description}</p>
                            
                            <div className="flex items-center gap-2 mb-6" style={{ color: 'var(--cruise-text-primary)' }}>
                                <span className="text-lg">⏰</span> <span className="text-[15px] font-medium">{slot.time}</span>
                            </div>

                            <div className="h-[1px] w-full mb-6" style={{ background: 'var(--cruise-border)' }}></div>

                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <span className="text-[28px] mr-1" style={{ color: 'var(--cruise-gold-dim)', fontFamily: "'Cormorant Garamond', serif" }}>₹</span>
                                    <span className="font-bold leading-none" style={{ fontSize: 'clamp(40px, 5vw, 56px)', color: 'var(--cruise-gold-light)', fontFamily: "'Cormorant Garamond', serif" }}>
                                        {slot.price.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-[14px] ml-2" style={{ color: 'var(--cruise-text-muted)' }}>/person</span>
                                </div>
                                <button 
                                    className="book-slot-btn"
                                    onClick={() => openBookingModal(slot.id)}
                                    style={{ borderColor: `rgba(${parseInt(slot.topBorderColor.slice(1,3), 16)}, ${parseInt(slot.topBorderColor.slice(3,5), 16)}, ${parseInt(slot.topBorderColor.slice(5,7), 16)}, 0.5)`, color: slot.topBorderColor }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${parseInt(slot.topBorderColor.slice(1,3), 16)}, ${parseInt(slot.topBorderColor.slice(3,5), 16)}, ${parseInt(slot.topBorderColor.slice(5,7), 16)}, 0.12)`; e.currentTarget.style.borderColor = slot.topBorderColor; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `rgba(${parseInt(slot.topBorderColor.slice(1,3), 16)}, ${parseInt(slot.topBorderColor.slice(3,5), 16)}, ${parseInt(slot.topBorderColor.slice(5,7), 16)}, 0.5)`; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    Book This Slot →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Animated water ripples at bottom */}
                <div className="water-ripple"></div>
                <div className="water-ripple"></div>
                <div className="water-ripple"></div>
            </section>

            {/* SECTION 4 — EVERY VOYAGE INCLUDES */}
            <section className="cruise-section pt-[120px] pb-[120px]" style={{ background: 'var(--cruise-bg-deep)' }}>
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.2), transparent)' }}></div>
                
                <div className="text-center mb-16 fade-up">
                    <h2 className="text-[clamp(38px,5vw,62px)] font-bold mb-2">Every Voyage Includes</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>Premium all-inclusive — nothing extra to order</p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '16px auto' }}></div>
                </div>

                <div className="max-w-[1100px] mx-auto px-6 space-y-4 fade-up-group">
                    {/* Row 1 - Welcome */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up">
                        <div className="inclusion-item">
                            <div className="inclusion-icon-wrap">🥂</div>
                            <span className="text-[15px]">Welcome Drink</span>
                        </div>
                        <div className="inclusion-item">
                            <div className="inclusion-icon-wrap">🍹</div>
                            <span className="text-[15px]">Unlimited Mocktails & Soft Beverages Bar</span>
                        </div>
                    </div>

                    {/* Row 2 - Food Journey (3 cols) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🥣</div><span className="text-[15px]">Soup with Condiments</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🥗</div><span className="text-[15px]">Salad Bar</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍢</div><span className="text-[15px]">Starter Mixed Cuisine</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍜</div><span className="text-[15px]">Thai & Chinese</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍝</div><span className="text-[15px]">Italian & Mexican</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍱</div><span className="text-[15px]">Japanese Cuisine</span></div>
                    </div>

                    {/* Row 3 - Indian Table (3 cols) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍛</div><span className="text-[15px]">Indian Cuisine</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🫓</div><span className="text-[15px]">Indian Breads</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🥘</div><span className="text-[15px]">Accompaniments</span></div>
                    </div>

                    {/* Row 4 - Desserts (3 cols) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍽️</div><span className="text-[15px]">Continental Cuisine</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🍮</div><span className="text-[15px]">Desserts</span></div>
                        <div className="inclusion-item"><div className="inclusion-icon-wrap">🧁</div><span className="text-[15px]">Indian Sweets & Western Dessert</span></div>
                    </div>

                    {/* Row 5 - Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-up">
                        <div className="inclusion-item">
                            <div className="inclusion-icon-wrap">🎵</div>
                            <span className="text-[15px]">Live Music Performance</span>
                        </div>
                        <div className="inclusion-item">
                            <div className="inclusion-icon-wrap">🌊</div>
                            <span className="text-[15px]">Open Deck Access</span>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 fade-up">
                    <p className="italic text-[14px]" style={{ color: 'var(--cruise-gold-dim)', letterSpacing: '0.08em' }}>
                        ✦ No hidden charges. No surprises. ✦
                    </p>
                </div>
            </section>

            {/* SECTION 5 — MAKE IT UNFORGETTABLE */}
            <section className="cruise-section pt-[100px] pb-[100px] text-center" style={{ background: 'var(--cruise-bg-card)' }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full whitespace-nowrap overflow-hidden">
                    <span style={{ fontSize: '30vw', fontFamily: "'Cormorant Garamond', serif", opacity: 0.03, color: 'var(--cruise-text-primary)' }}>CELEBRATE</span>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6">
                    <div className="fade-up mb-12">
                        <h2 className="text-[clamp(38px,5vw,62px)] font-bold mb-2">Make It Unforgettable</h2>
                        <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>Private bookings for life's most precious moments</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 fade-up">
                        <div className="event-chip"><span className="chip-icon">🎂</span><span className="chip-label">Birthday</span></div>
                        <div className="event-chip"><span className="chip-icon">💍</span><span className="chip-label">Anniversary</span></div>
                        <div className="event-chip"><span className="chip-icon">💒</span><span className="chip-label">Pre-Wedding</span></div>
                        <div className="event-chip"><span className="chip-icon">💍</span><span className="chip-label">Ring Ceremony</span></div>
                        <div className="event-chip"><span className="chip-icon">💼</span><span className="chip-label">Business Conference</span></div>
                        <div className="event-chip"><span className="chip-icon">📸</span><span className="chip-label">Photoshoot</span></div>
                        <div className="event-chip"><span className="chip-icon">👑</span><span className="chip-label">Kitty Party</span></div>
                        <div className="event-chip"><span className="chip-icon">🥂</span><span className="chip-label">Social Get-together</span></div>
                    </div>

                    <div className="fade-up">
                        <a href={getWhatsAppUrl('private')} target="_blank" rel="noopener noreferrer" className="private-enquiry-btn">
                            Enquire for Private Booking →
                        </a>
                    </div>
                </div>
            </section>

            {/* SECTION 6 — FIND US */}
            <section className="cruise-section pt-[100px] pb-[100px]" style={{ background: 'var(--cruise-bg-primary)' }}>
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12 fade-up">
                        <h2 className="text-[52px] font-bold" style={{ color: 'var(--cruise-text-primary)' }}>Find Us</h2>
                    </div>

                    <div className="map-container fade-up">
                        <iframe
                            title="Cruise Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.8!2d72.5714!3d23.0225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84f5a0000001%3A0x0!2sAtal+Bridge!5e0!3m2!1sen!2sin!4v1710000000000"
                            width="100%"
                            height="400"
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>

                    <div className="address-card fade-up">
                        <MapPin size={24} style={{ color: 'var(--cruise-gold-primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p className="font-bold text-[18px] mb-1">Near Atal Bridge, Sabarmati Riverfront</p>
                            <p className="text-[15px] mb-3" style={{ color: 'var(--cruise-text-secondary)' }}>West Side, Sardar Bridge, Ahmedabad 380009</p>
                            <p className="italic text-[14px]" style={{ color: 'var(--cruise-gold-primary)' }}>
                                ⏰ Boarding begins 15 minutes before departure. Please arrive on time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 7 — BOOKING MODAL */}
            {modalOpen && (
                <div className="cruise-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="cruise-modal" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setModalOpen(false)} 
                            className="absolute top-6 right-6 p-2 rounded-full transition-colors"
                            style={{ color: 'var(--cruise-text-muted)', background: 'rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--cruise-text-muted)'; }}
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-center text-[34px] font-bold mb-8" style={{ color: 'var(--cruise-text-primary)' }}>
                            Reserve Your Voyage
                        </h3>

                        {submitted ? (
                            <div className="text-center py-6">
                                <div className="text-6xl mb-6">🚢</div>
                                <h4 className="text-[24px] font-bold mb-3" style={{ color: 'var(--cruise-gold-light)' }}>Request Received!</h4>
                                <p className="text-[16px] mb-8" style={{ color: 'var(--cruise-text-secondary)' }}>
                                    Our team will contact you within 2 hours to confirm your voyage details.
                                </p>
                                <button 
                                    className="btn-gold-ghost"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="cruise-input-label">Full Name *</label>
                                    <input type="text" className="cruise-input" placeholder="Your full name" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cruise-input-label">Phone *</label>
                                        <input type="tel" className="cruise-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="cruise-input-label">Email *</label>
                                        <input type="email" className="cruise-input" placeholder="you@email.com" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="cruise-input-label">Select Slot</label>
                                    <select className="cruise-input appearance-none" value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)} style={{ cursor: 'pointer' }}>
                                        {SLOTS.map(s => (
                                            <option key={s.id} value={s.id} style={{ background: '#0b1220', color: '#f0e8d0' }}>
                                                {s.name} — ₹{s.price.toLocaleString('en-IN')}/person ({s.time}){s.id === 'party' ? ' [18+ only]' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="cruise-input-label">Number of Guests</label>
                                        <input type="number" min={1} max={50} className="cruise-input" value={form.guests} onChange={e => handleChange('guests', Math.max(1, Math.min(50, Number(e.target.value))))} />
                                    </div>
                                    <div>
                                        <label className="cruise-input-label">Preferred Date *</label>
                                        <input type="date" className="cruise-input" value={form.date} onChange={e => handleChange('date', e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                    </div>
                                </div>

                                <div>
                                    <label className="cruise-input-label">Special Occasion</label>
                                    <select className="cruise-input appearance-none" value={form.occasion} onChange={e => handleChange('occasion', e.target.value)} style={{ cursor: 'pointer' }}>
                                        {OCCASIONS.map(o => (
                                            <option key={o} value={o} style={{ background: '#0b1220', color: '#f0e8d0' }}>{o}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="cruise-input-label">Special Requests (Optional)</label>
                                    <textarea rows={2} className="cruise-input resize-none" placeholder="Dietary restrictions, celebrations..." value={form.requests} onChange={e => handleChange('requests', e.target.value)}></textarea>
                                </div>

                                <div className="price-display">
                                    <div className="total-label mb-1">Estimated Total</div>
                                    <div className="total-amount">₹{estimatedTotal.toLocaleString('en-IN')}</div>
                                    <div className="text-[12px] mt-2" style={{ color: 'var(--cruise-text-muted)' }}>
                                        {selectedSlot?.name} × {form.guests} guest{form.guests !== 1 ? 's' : ''} <br/>
                                        *Final price subject to GST.
                                    </div>
                                </div>

                                {formError && (
                                    <div className="p-3 rounded-xl border" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'rgb(248, 113, 113)', fontSize: '14px' }}>
                                        {formError}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <a href={getWhatsAppUrl('booking')} target="_blank" rel="noopener noreferrer" className="btn-gold-primary text-center flex-1 justify-center whitespace-nowrap" style={{ padding: '14px 28px', fontSize: '14px', fontWeight: '600' }}>
                                        Book via WhatsApp
                                    </a>
                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={submitting} 
                                        className="btn-gold-ghost flex-1 justify-center whitespace-nowrap"
                                        style={{ padding: '14px 28px', fontSize: '14px', fontWeight: '600', opacity: submitting ? 0.7 : 1 }}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
