import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin, X, ChevronDown, Anchor, Crown, Star, Music, Wine,
    Users, Camera, PartyPopper, Sparkles, Heart, UtensilsCrossed,
    GlassWater, Ship, Clock, Waves, Phone, MessageCircle, Mic2,
    Award, Calendar, ArrowRight
} from 'lucide-react';
import SEO from '../components/common/SEO';
import ExploreOtherTransport from '../components/ExploreOtherTransport';
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

const EXPERIENCES = [
    { icon: UtensilsCrossed, title: '15-Cuisine World Buffet', desc: 'Thai, Chinese, Italian, Mexican, Japanese, Indian & Continental — a global feast on the river.' },
    { icon: Mic2, title: 'Live Performances', desc: 'Curated artists and soulful melodies against the lit Atal Bridge every evening.' },
    { icon: GlassWater, title: 'Unlimited Beverages', desc: 'Premium mocktail bar, soft drinks, and signature concoctions flowing all night.' },
    { icon: Sparkles, title: 'Panoramic Night Views', desc: 'Open deck access with the Ahmedabad skyline and illuminated bridge as your backdrop.' },
    { icon: Music, title: 'Dance Floor', desc: 'DJ nights with party vibes every Friday & Saturday — let the river move you.' },
    { icon: Crown, title: 'VIP Treatment', desc: 'Priority boarding, premium seating arrangements, and personal service throughout.' },
];

const GALLERY_IMAGES = [
    { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', alt: 'Fine dining on the water', span: 'col-span-1 row-span-1' },
    { src: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80', alt: 'Signature cocktails and mocktails', span: 'col-span-1 row-span-2' },
    { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80', alt: 'Night skyline panorama', span: 'col-span-1 row-span-1' },
    { src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80', alt: 'Party and celebration vibes', span: 'col-span-1 row-span-1' },
    { src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80', alt: 'Elegant dining setup', span: 'col-span-1 row-span-1' },
    { src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', alt: 'River at night', span: 'col-span-1 row-span-2' },
];

const TESTIMONIALS = [
    {
        quote: 'The most magical anniversary celebration we could have imagined. The candlelit dinner on the open deck with the Atal Bridge glowing behind us was absolutely breathtaking. The staff made us feel like royalty.',
        name: 'Priya & Rahul',
        occasion: 'Anniversary',
        rating: 5,
    },
    {
        quote: 'Our corporate event on the river was absolutely stunning. From the welcome drinks to the live music, every detail was perfectly orchestrated. Our clients were genuinely impressed.',
        name: 'Amit Patel',
        occasion: 'Corporate Event',
        rating: 5,
    },
    {
        quote: 'Best birthday party venue in Ahmedabad, hands down! The River Blue Party slot was incredible — the DJ, the vibe, the river views. My friends are still talking about it weeks later.',
        name: 'Sneha Joshi',
        occasion: 'Birthday Celebration',
        rating: 5,
    },
];

const PRIVATE_EVENTS = [
    { icon: '🎂', name: 'Birthday', desc: 'Celebrate your special day on the river with custom decor and cake' },
    { icon: '💍', name: 'Anniversary', desc: 'Romantic candlelit dinner cruise for your milestone moments' },
    { icon: '💒', name: 'Pre-Wedding', desc: 'A dreamy pre-wedding celebration your guests will never forget' },
    { icon: '💎', name: 'Ring Ceremony', desc: 'Say yes against the backdrop of the glittering Sabarmati' },
    { icon: '💼', name: 'Corporate', desc: 'Impress clients and teams with an unforgettable river experience' },
    { icon: '📸', name: 'Photoshoot', desc: 'Golden hour and night-lit bridge — the perfect frame for every shot' },
    { icon: '👑', name: 'Kitty Party', desc: 'Luxury lunch or dinner cruise with your favourite people' },
    { icon: '🥂', name: 'Get-together', desc: 'Friends, family, or reunions — make it an evening to remember' },
];

const INCLUSIONS = [
    { icon: '🥂', label: 'Welcome Drink' },
    { icon: '🍹', label: 'Unlimited Mocktails & Soft Beverages' },
    { icon: '🥣', label: 'Soup with Condiments' },
    { icon: '🥗', label: 'Salad Bar' },
    { icon: '🍢', label: 'Starter Mixed Cuisine' },
    { icon: '🍜', label: 'Thai & Chinese' },
    { icon: '🍝', label: 'Italian & Mexican' },
    { icon: '🍱', label: 'Japanese Cuisine' },
    { icon: '🍛', label: 'Indian Cuisine' },
    { icon: '🫓', label: 'Indian Breads' },
    { icon: '🥘', label: 'Accompaniments' },
    { icon: '🍽️', label: 'Continental Cuisine' },
    { icon: '🍮', label: 'Desserts' },
    { icon: '🧁', label: 'Indian Sweets & Western Desserts' },
    { icon: '🎵', label: 'Live Music Performance' },
    { icon: '🌊', label: 'Open Deck Access' },
];

const SLOT_MOOD_ICONS = {
    afternoon: <Clock size={22} />,
    evening: <Crown size={22} />,
    night: <Star size={22} />,
    party: <Music size={22} />,
};

export default function CruisePage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState('dinner1');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState('');
    const slotsRef = useRef(null);
    const experienceRef = useRef(null);

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
    const scrollToExperience = () => experienceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // WhatsApp message builder
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

    // Firestore submit
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
                title="The Royal Sabarmati River Cruise | Infinite Yatra | Ahmedabad"
                description="Experience Ahmedabad's most luxurious river cruise — 15-cuisine world buffet, live performances, DJ nights, and panoramic views at Atal Bridge, Sabarmati Riverfront."
                url="/cruise"
            />

            {/* ═══════════ SECTION 1 — CINEMATIC HERO ═══════════ */}
            <section className="cruise-section h-[100vh] min-h-[700px] flex items-center justify-center text-center px-4 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=90"
                        alt="Night Water"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(4,8,15,0.55) 0%, rgba(4,8,15,0.3) 30%, rgba(4,8,15,0.85) 75%, rgba(4,8,15,1) 100%)' }} />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(200,168,75,0.1) 0%, transparent 55%)' }} />
                </div>

                {/* Floating golden particles */}
                <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: `${Math.random() * 4 + 2}px`,
                                height: `${Math.random() * 4 + 2}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: 'var(--cruise-gold-primary)',
                                opacity: Math.random() * 0.5 + 0.1,
                                animation: `floatParticle ${Math.random() * 6 + 4}s ease-in-out infinite`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 w-full max-w-5xl pt-16">
                    {/* Location pill */}
                    <div className="fade-up inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8" style={{ background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.25)' }}>
                        <Anchor size={14} style={{ color: 'var(--cruise-gold-primary)' }} />
                        <span style={{ color: 'var(--cruise-gold-primary)', fontSize: '13px', letterSpacing: '0.12em', fontWeight: '500' }}>
                            Atal Bridge &middot; Sabarmati Riverfront &middot; Ahmedabad
                        </span>
                    </div>

                    {/* Sub-label */}
                    <div className="fade-up text-[11px] tracking-[0.3em] uppercase mb-5" style={{ color: 'var(--cruise-text-muted)', transitionDelay: '0.05s' }}>
                        An Infinite Yatra Experience
                    </div>

                    {/* Main headline */}
                    <h1 className="fade-up hero-headline mb-3" style={{ transitionDelay: '0.1s' }}>
                        THE ROYAL
                    </h1>
                    <h1 className="fade-up hero-headline mb-6" style={{ transitionDelay: '0.15s', color: 'var(--cruise-gold-light)' }}>
                        SABARMATI
                    </h1>

                    {/* Subtitle */}
                    <p className="fade-up italic text-[clamp(18px,3vw,24px)] mb-6" style={{ color: 'var(--cruise-text-secondary)', fontFamily: "'Cormorant Garamond', serif", transitionDelay: '0.3s' }}>
                        Where Luxury Meets the River
                    </p>

                    {/* Divider */}
                    <div className="fade-up hero-divider mb-10" style={{ transitionDelay: '0.4s' }}>
                        <div className="hero-divider-line" />
                        <span className="hero-divider-dot">&#10022;</span>
                        <div className="hero-divider-line" />
                    </div>

                    {/* Stats bar */}
                    <div className="fade-up flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-12" style={{ transitionDelay: '0.5s' }}>
                        {[
                            { value: '500+', label: 'Events Hosted' },
                            { value: '50,000+', label: 'Happy Guests' },
                            { value: '4.8', label: 'Google Rating', suffix: <Star size={14} fill="var(--cruise-gold-primary)" stroke="var(--cruise-gold-primary)" className="inline ml-1" /> },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-[clamp(22px,3vw,30px)] font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--cruise-gold-light)' }}>
                                    {stat.value}{stat.suffix}
                                </div>
                                <div className="text-[11px] tracking-[0.15em] uppercase mt-1" style={{ color: 'var(--cruise-text-muted)' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className="fade-up flex flex-col sm:flex-row items-center justify-center gap-5" style={{ transitionDelay: '0.6s' }}>
                        <button onClick={() => openBookingModal('dinner1')} className="btn-gold-primary w-full sm:w-auto">
                            <Crown size={18} />
                            Reserve Your Evening
                        </button>
                        <button onClick={scrollToExperience} className="btn-gold-ghost w-full sm:w-auto">
                            View Experiences <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator">
                    <ChevronDown size={28} style={{ color: 'var(--cruise-gold-primary)' }} />
                </div>
            </section>

            {/* ═══════════ SECTION 2 — THE EXPERIENCE ═══════════ */}
            <section ref={experienceRef} className="cruise-section pt-[120px] pb-[120px]" style={{ background: 'var(--cruise-bg-deep)' }}>
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.2), transparent)' }} />

                <div className="text-center mb-16 fade-up">
                    <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>The Experience</div>
                    <h2 className="text-[clamp(36px,5vw,62px)] font-bold mb-3">AN EVENING LIKE NO OTHER</h2>
                    <p className="italic text-[18px] max-w-xl mx-auto" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                        Six reasons why the Royal Sabarmati is Ahmedabad's most unforgettable evening
                    </p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '20px auto 0' }} />
                </div>

                <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 fade-up-group">
                    {EXPERIENCES.map((exp, i) => {
                        const IconComp = exp.icon;
                        return (
                            <div key={i} className="highlight-card fade-up group" style={{ textAlign: 'center', padding: '44px 32px' }}>
                                <div
                                    className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                    style={{ background: 'var(--cruise-gold-glow)', border: '1px solid var(--cruise-border)' }}
                                >
                                    <IconComp size={28} style={{ color: 'var(--cruise-gold-primary)' }} />
                                </div>
                                <h3 className="text-[22px] font-semibold mb-3">{exp.title}</h3>
                                <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>
                                    {exp.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ═══════════ SECTION 3 — CHOOSE YOUR VOYAGE ═══════════ */}
            <section ref={slotsRef} className="cruise-section pt-[120px] pb-[160px]" style={{ background: 'var(--cruise-bg-primary)' }}>
                <div className="text-center mb-16 fade-up">
                    <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>Select Your Slot</div>
                    <h2 className="text-[clamp(36px,5vw,62px)] font-bold mb-3">CHOOSE YOUR VOYAGE</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                        Four distinct experiences, one legendary river
                    </p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '20px auto 0' }} />
                </div>

                <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 fade-up-group">
                    {SLOTS.map((slot) => {
                        const isParty = slot.id === 'party';
                        const isFeatured = slot.featured;
                        return (
                            <div
                                key={slot.id}
                                className={`slot-card fade-up ${isFeatured ? 'featured' : ''}`}
                                style={{
                                    background: `linear-gradient(160deg, var(--cruise-bg-card), ${slot.cardGlow})`,
                                    borderTop: `3px solid ${slot.topBorderColor}`,
                                    boxShadow: isParty ? '0 0 40px rgba(124,58,237,0.12), inset 0 0 40px rgba(124,58,237,0.03)' : undefined,
                                }}
                            >
                                {/* Top row: mood icon + badges */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ background: `${slot.cardGlow}`, border: `1px solid ${slot.topBorderColor}33`, color: slot.topBorderColor }}
                                        >
                                            {SLOT_MOOD_ICONS[slot.mood]}
                                        </div>
                                        <span className="text-[13px] font-medium" style={{ color: slot.topBorderColor }}>{slot.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isFeatured && (
                                            <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide" style={{ background: 'rgba(200,168,75,0.15)', color: 'var(--cruise-gold-primary)', border: '1px solid rgba(200,168,75,0.3)' }}>
                                                <Crown size={12} /> SIGNATURE
                                            </div>
                                        )}
                                        {isParty && (
                                            <div className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}>
                                                18+
                                            </div>
                                        )}
                                        <div
                                            className="slot-badge"
                                            style={{
                                                background: `rgba(${parseInt(slot.badgeColor.slice(1, 3), 16)}, ${parseInt(slot.badgeColor.slice(3, 5), 16)}, ${parseInt(slot.badgeColor.slice(5, 7), 16)}, 0.15)`,
                                                border: `1px solid rgba(${parseInt(slot.badgeColor.slice(1, 3), 16)}, ${parseInt(slot.badgeColor.slice(3, 5), 16)}, ${parseInt(slot.badgeColor.slice(5, 7), 16)}, 0.35)`,
                                                color: slot.badgeColor,
                                            }}
                                        >
                                            {slot.badge}
                                        </div>
                                    </div>
                                </div>

                                {/* Card title */}
                                <h3 className="text-[28px] font-bold mb-1">{slot.name}</h3>
                                <p className="italic text-[15px] mb-4" style={{ color: slot.topBorderColor, fontFamily: "'Cormorant Garamond', serif" }}>{slot.tagline}</p>
                                <p className="text-[14px] leading-[1.7] mb-6 flex-grow" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300 }}>{slot.description}</p>

                                <div className="h-[1px] w-full mb-6" style={{ background: 'var(--cruise-border)' }} />

                                {/* Price + CTA */}
                                <div className="flex flex-wrap items-end justify-between gap-4">
                                    <div>
                                        <span className="text-[24px] mr-1" style={{ color: 'var(--cruise-gold-dim)', fontFamily: "'Cormorant Garamond', serif" }}>&#8377;</span>
                                        <span className="font-bold leading-none" style={{ fontSize: 'clamp(38px, 5vw, 52px)', color: 'var(--cruise-gold-light)', fontFamily: "'Cormorant Garamond', serif" }}>
                                            {slot.price.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-[13px] ml-2" style={{ color: 'var(--cruise-text-muted)' }}>/person</span>
                                    </div>
                                    <button
                                        className="book-slot-btn"
                                        onClick={() => openBookingModal(slot.id)}
                                        style={{
                                            borderColor: `rgba(${parseInt(slot.topBorderColor.slice(1, 3), 16)}, ${parseInt(slot.topBorderColor.slice(3, 5), 16)}, ${parseInt(slot.topBorderColor.slice(5, 7), 16)}, 0.5)`,
                                            color: slot.topBorderColor,
                                            border: `1px solid rgba(${parseInt(slot.topBorderColor.slice(1, 3), 16)}, ${parseInt(slot.topBorderColor.slice(3, 5), 16)}, ${parseInt(slot.topBorderColor.slice(5, 7), 16)}, 0.5)`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `rgba(${parseInt(slot.topBorderColor.slice(1, 3), 16)}, ${parseInt(slot.topBorderColor.slice(3, 5), 16)}, ${parseInt(slot.topBorderColor.slice(5, 7), 16)}, 0.12)`;
                                            e.currentTarget.style.borderColor = slot.topBorderColor;
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = `rgba(${parseInt(slot.topBorderColor.slice(1, 3), 16)}, ${parseInt(slot.topBorderColor.slice(3, 5), 16)}, ${parseInt(slot.topBorderColor.slice(5, 7), 16)}, 0.5)`;
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        Book Now <ArrowRight size={14} className="inline ml-1" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Animated water ripples */}
                <div className="water-ripple" />
                <div className="water-ripple" />
                <div className="water-ripple" />
            </section>

            {/* ═══════════ SECTION 4 — GALLERY ═══════════ */}
            <section className="cruise-section pt-[100px] pb-[100px]" style={{ background: 'var(--cruise-bg-card)' }}>
                <div className="text-center mb-14 fade-up">
                    <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>Gallery</div>
                    <h2 className="text-[clamp(36px,5vw,56px)] font-bold mb-3">MOMENTS THAT DEFINE THE NIGHT</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                        A glimpse into the Royal Sabarmati experience
                    </p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '20px auto 0' }} />
                </div>

                <div className="max-w-[1100px] mx-auto px-6 fade-up">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[200px] md:auto-rows-[240px]">
                        {GALLERY_IMAGES.map((img, i) => (
                            <div
                                key={i}
                                className={`${img.span} rounded-2xl overflow-hidden relative group`}
                                style={{ border: '1px solid var(--cruise-border)' }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <span className="text-[13px] text-white/90 font-medium">{img.alt}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ SECTION 5 — EVERY VOYAGE INCLUDES ═══════════ */}
            <section className="cruise-section pt-[120px] pb-[120px]" style={{ background: 'var(--cruise-bg-deep)' }}>
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.2), transparent)' }} />

                <div className="text-center mb-16 fade-up">
                    <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>All-Inclusive</div>
                    <h2 className="text-[clamp(36px,5vw,56px)] font-bold mb-3">EVERY VOYAGE INCLUDES</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                        Premium all-inclusive &mdash; nothing extra to pay
                    </p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '20px auto 0' }} />
                </div>

                <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 fade-up-group">
                    {INCLUSIONS.map((item, i) => (
                        <div key={i} className="inclusion-item fade-up">
                            <div className="inclusion-icon-wrap">{item.icon}</div>
                            <span className="text-[14px]">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12 fade-up">
                    <p className="italic text-[14px]" style={{ color: 'var(--cruise-gold-dim)', letterSpacing: '0.08em' }}>
                        &#10022; No hidden charges. No surprises. Just pure luxury. &#10022;
                    </p>
                </div>
            </section>

            {/* ═══════════ SECTION 6 — CELEBRATE WITH US ═══════════ */}
            <section className="cruise-section pt-[100px] pb-[100px] text-center" style={{ background: 'var(--cruise-bg-card)' }}>
                {/* Giant watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full whitespace-nowrap overflow-hidden">
                    <span style={{ fontSize: '28vw', fontFamily: "'Cormorant Garamond', serif", opacity: 0.025, color: 'var(--cruise-text-primary)' }}>CELEBRATE</span>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-6">
                    <div className="fade-up mb-4">
                        <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>Private Events</div>
                        <h2 className="text-[clamp(36px,5vw,56px)] font-bold mb-3">YOUR OCCASION, OUR RIVER</h2>
                        <p className="italic text-[18px] max-w-lg mx-auto" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                            Let the Sabarmati be the canvas for your most cherished celebrations
                        </p>
                        <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '20px auto 0' }} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 fade-up-group">
                        {PRIVATE_EVENTS.map((evt, i) => (
                            <div key={i} className="event-chip fade-up" style={{ padding: '24px 16px' }}>
                                <span className="chip-icon text-[28px]">{evt.icon}</span>
                                <span className="text-[14px] font-semibold" style={{ color: 'var(--cruise-text-primary)' }}>{evt.name}</span>
                                <span className="chip-label text-[11px] leading-snug" style={{ textAlign: 'center' }}>{evt.desc}</span>
                            </div>
                        ))}
                    </div>

                    <div className="fade-up mt-12">
                        <a href={getWhatsAppUrl('private')} target="_blank" rel="noopener noreferrer" className="private-enquiry-btn">
                            <MessageCircle size={20} />
                            Plan Your Private Celebration
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══════════ SECTION 7 — GUEST REVIEWS ═══════════ */}
            <section className="cruise-section pt-[100px] pb-[100px]" style={{ background: 'var(--cruise-bg-primary)' }}>
                <div className="text-center mb-14 fade-up">
                    <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>Testimonials</div>
                    <h2 className="text-[clamp(36px,5vw,56px)] font-bold mb-3">WHAT OUR GUESTS SAY</h2>
                    <p className="italic text-[18px]" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif" }}>
                        Real experiences from real voyagers
                    </p>
                    <div style={{ width: '60px', height: '2px', background: 'var(--cruise-gold-primary)', margin: '20px auto 0' }} />
                </div>

                <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 fade-up-group">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="highlight-card fade-up" style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column' }}>
                            {/* Stars */}
                            <div className="flex items-center gap-1 mb-5">
                                {[...Array(t.rating)].map((_, j) => (
                                    <Star key={j} size={16} fill="var(--cruise-gold-primary)" stroke="var(--cruise-gold-primary)" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-[15px] leading-[1.8] italic flex-grow mb-6" style={{ color: 'var(--cruise-text-secondary)', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", fontSize: '17px' }}>
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Divider */}
                            <div className="h-[1px] w-full mb-5" style={{ background: 'var(--cruise-border)' }} />

                            {/* Author */}
                            <div>
                                <div className="text-[15px] font-semibold" style={{ color: 'var(--cruise-text-primary)' }}>{t.name}</div>
                                <div className="text-[12px] tracking-wide mt-1" style={{ color: 'var(--cruise-gold-dim)' }}>{t.occasion}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════ SECTION 8 — FIND US ═══════════ */}
            <section className="cruise-section pt-[100px] pb-[100px]" style={{ background: 'var(--cruise-bg-deep)' }}>
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-12 fade-up">
                        <div className="text-[11px] tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--cruise-gold-dim)' }}>Location</div>
                        <h2 className="text-[clamp(36px,5vw,52px)] font-bold" style={{ color: 'var(--cruise-text-primary)' }}>FIND US</h2>
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
                                Boarding begins 15 minutes before departure. Please arrive on time.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ SECTION 9 — FINAL CTA ═══════════ */}
            <section className="cruise-section py-[80px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--cruise-bg-primary), var(--cruise-bg-card))' }}>
                {/* Decorative glow */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(200,168,75,0.06) 0%, transparent 60%)' }} />
                <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.3), transparent)' }} />
                <div className="absolute bottom-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.3), transparent)' }} />

                <div className="relative z-10 text-center max-w-3xl mx-auto px-6 fade-up">
                    <Ship size={40} style={{ color: 'var(--cruise-gold-primary)', margin: '0 auto 20px' }} />
                    <h2 className="text-[clamp(32px,5vw,52px)] font-bold mb-4">YOUR ROYAL EVENING AWAITS</h2>
                    <p className="italic text-[20px] mb-3" style={{ color: 'var(--cruise-text-secondary)', fontFamily: "'Cormorant Garamond', serif" }}>
                        The Sabarmati has a table reserved for you
                    </p>
                    <p className="text-[16px] mb-10" style={{ color: 'var(--cruise-gold-primary)' }}>
                        Starting from <strong style={{ fontSize: '22px', fontFamily: "'Cormorant Garamond', serif" }}>&#8377;1,199</strong> per person
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <a href={getWhatsAppUrl('booking')} target="_blank" rel="noopener noreferrer" className="btn-gold-primary w-full sm:w-auto">
                            <MessageCircle size={18} />
                            Book via WhatsApp
                        </a>
                        <button onClick={() => openBookingModal('dinner1')} className="btn-gold-ghost w-full sm:w-auto">
                            <Calendar size={16} />
                            Book Now
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════ EXPLORE OTHER TRANSPORT ═══════════ */}
            <ExploreOtherTransport currentKey="cruise" />

            {/* ═══════════ SECTION 10 — BOOKING MODAL ═══════════ */}
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

                        {/* Modal header */}
                        <div className="text-center mb-8">
                            <Crown size={28} style={{ color: 'var(--cruise-gold-primary)', margin: '0 auto 12px' }} />
                            <h3 className="text-[32px] font-bold" style={{ color: 'var(--cruise-text-primary)' }}>
                                Reserve Your Voyage
                            </h3>
                            <p className="text-[14px] mt-2" style={{ color: 'var(--cruise-text-muted)' }}>Fill in your details and we will confirm within 2 hours</p>
                        </div>

                        {submitted ? (
                            <div className="text-center py-6">
                                <div className="text-6xl mb-6">
                                    <Ship size={56} style={{ color: 'var(--cruise-gold-primary)', margin: '0 auto' }} />
                                </div>
                                <h4 className="text-[24px] font-bold mb-3" style={{ color: 'var(--cruise-gold-light)' }}>Request Received!</h4>
                                <p className="text-[16px] mb-8" style={{ color: 'var(--cruise-text-secondary)' }}>
                                    Our team will contact you within 2 hours to confirm your voyage details.
                                </p>
                                <button className="btn-gold-ghost" onClick={() => setModalOpen(false)}>
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
                                                {s.name} — &#8377;{s.price.toLocaleString('en-IN')}/person ({s.time}){s.id === 'party' ? ' [18+ only]' : ''}
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
                                    <textarea rows={2} className="cruise-input resize-none" placeholder="Dietary restrictions, celebrations..." value={form.requests} onChange={e => handleChange('requests', e.target.value)} />
                                </div>

                                <div className="price-display">
                                    <div className="total-label mb-1">Estimated Total</div>
                                    <div className="total-amount">&#8377;{estimatedTotal.toLocaleString('en-IN')}</div>
                                    <div className="text-[12px] mt-2" style={{ color: 'var(--cruise-text-muted)' }}>
                                        {selectedSlot?.name} &times; {form.guests} guest{form.guests !== 1 ? 's' : ''} <br />
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
                                        <MessageCircle size={16} />
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

            {/* Inline keyframes for floating particles */}
            <style>{`
                @keyframes floatParticle {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
                    25% { transform: translateY(-20px) translateX(10px); opacity: 0.5; }
                    50% { transform: translateY(-10px) translateX(-5px); opacity: 0.3; }
                    75% { transform: translateY(-30px) translateX(15px); opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
