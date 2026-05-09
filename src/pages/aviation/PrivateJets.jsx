import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane, Shield, Clock, Users, Star, MapPin, Phone, Mail,
  Crown, Sparkles, ChevronRight, ArrowRight, MessageCircle,
  Gauge, Navigation, CheckCircle, Heart, Globe, Headphones,
  DollarSign, Send, Mountain, HeartPulse, PlaneTakeoff,
} from 'lucide-react';
import SEO from '../../components/SEO';
import ExploreOtherTransport from '../../components/ExploreOtherTransport';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { privateJetFleet, jetServices, popularRoutes, jetTestimonials } from '../../data/privateJets';

const WHATSAPP_NUMBER = '919265799325';

const ICON_MAP = {
  Plane, MapPin, Sparkles, Users, Shield, Crown, Clock,
  Globe, Headphones, DollarSign, Heart, CheckCircle,
  Mountain, HeartPulse, PlaneTakeoff,
};

// Format INR price from number
const formatPrice = (num) => {
  if (!num) return 'On Request';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

// Reusable gold gradient text
const GoldText = ({ children, className = '' }) => (
  <span className={`bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

// Section wrapper with viewport animation
const Section = ({ children, className = '', id }) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.section>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 mb-3">{children}</p>
);

const SectionHeading = ({ children }) => (
  <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4">
    {children}
  </h2>
);

const GoldDivider = () => (
  <div className="w-20 h-[2px] bg-gradient-to-r from-amber-500 to-yellow-600 mx-auto mb-10" />
);

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=2400&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-[#050505]" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <SectionLabel>Private Aviation</SectionLabel>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight mb-6"
        >
          <GoldText>Fly Beyond</GoldText>
          <br />
          <span className="text-white">First Class</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Experience the pinnacle of air travel. Charter your private jet with India's most trusted luxury travel curator.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <a
            href="#fleet"
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold uppercase tracking-wider rounded-sm hover:from-amber-400 hover:to-yellow-500 transition-all duration-300 text-sm"
          >
            Explore Our Fleet
          </a>
          <a
            href="#inquiry"
            className="px-8 py-4 border border-amber-500/50 text-amber-400 font-bold uppercase tracking-wider rounded-sm hover:bg-amber-500/10 transition-all duration-300 text-sm"
          >
            Request a Quote
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-8 text-zinc-500 text-sm uppercase tracking-widest"
        >
          {[`${privateJetFleet.length} Aircraft`, '50+ Routes', '24/7 Concierge'].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-5 h-8 rounded-full border border-zinc-600 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-amber-500" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── SERVICES ────────────────────────────────────────────────────────────────
function Services() {
  return (
    <Section id="services" className="py-24 px-4 bg-[#050505]">
      <div className="max-w-7xl mx-auto text-center">
        <SectionLabel>What We Offer</SectionLabel>
        <SectionHeading>Aviation Services</SectionHeading>
        <GoldDivider />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {jetServices.map((svc, i) => {
            const Icon = ICON_MAP[svc.icon] || Plane;
            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative p-6 rounded-sm bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/50 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{svc.name}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed mb-4">{svc.description}</p>
                <p className="text-amber-400 font-semibold text-sm">
                  {svc.startingPrice ? `from ${formatPrice(svc.startingPrice)}` : 'On Request'}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── FLEET ───────────────────────────────────────────────────────────────────
function Fleet() {
  return (
    <Section id="fleet" className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto text-center">
        <SectionLabel>The Collection</SectionLabel>
        <SectionHeading>
          Our <GoldText>Fleet</GoldText>
        </SectionHeading>
        <GoldDivider />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {privateJetFleet.map((jet, i) => {
            const seatLabel = jet.seats.min === jet.seats.max
              ? `${jet.seats.max} Seats`
              : `${jet.seats.min}–${jet.seats.max} Seats`;

            return (
              <motion.div
                key={jet.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative rounded-sm overflow-hidden bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={jet.image}
                    alt={jet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                  <span className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                    {jet.type}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 text-left">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-2">{jet.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{jet.tagline}</p>

                  {/* Specs row */}
                  <div className="flex flex-wrap gap-4 mb-5">
                    {[
                      { icon: Users, label: seatLabel },
                      { icon: Navigation, label: `${jet.range.toLocaleString()} km` },
                      { icon: Gauge, label: `${jet.speed} km/h` },
                    ].map(({ icon: Ic, label }) => (
                      <span key={label} className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <Ic className="w-3.5 h-3.5 text-amber-500/70" />
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold text-sm">{formatPrice(jet.pricePerHour)}/hr</span>
                    <Link
                      to={`/private-aviation/${jet.id}`}
                      className="flex items-center gap-1 text-xs uppercase tracking-wider text-zinc-400 hover:text-amber-400 transition-colors font-semibold"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── POPULAR ROUTES ──────────────────────────────────────────────────────────
function PopularRoutes() {
  return (
    <Section id="routes" className="py-24 px-4 bg-[#050505]">
      <div className="max-w-7xl mx-auto text-center">
        <SectionLabel>Top Destinations</SectionLabel>
        <SectionHeading>
          Popular <GoldText>Routes</GoldText>
        </SectionHeading>
        <GoldDivider />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRoutes.map((route, i) => (
            <motion.div
              key={`${route.from}-${route.to}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-sm overflow-hidden h-64"
            >
              <img
                src={route.image}
                alt={`${route.from} to ${route.to}`}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-end p-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-bold text-lg">{route.from}</span>
                  <ArrowRight className="w-5 h-5 text-amber-400" />
                  <span className="text-white font-bold text-lg">{route.to}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{route.duration}</span>
                  <span className="text-amber-400 font-semibold">from {formatPrice(route.startingPrice)}</span>
                </div>
                <a
                  href="#inquiry"
                  className="w-fit px-4 py-2 text-[10px] uppercase tracking-widest font-bold border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-all rounded-sm"
                >
                  Request Quote
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────────
const STEPS = [
  { num: '01', title: 'Tell Us Your Route', desc: 'Share your origin, destination, dates, and passenger count via our form or WhatsApp.' },
  { num: '02', title: 'We Find the Perfect Jet', desc: 'Our aviation desk matches your requirements to the ideal aircraft from our vetted fleet.' },
  { num: '03', title: 'Confirm & Pay', desc: 'Review your proposal, confirm details, and make a secure payment. All-inclusive pricing.' },
  { num: '04', title: 'Red Carpet Arrival', desc: 'Skip the terminal. Board directly from the tarmac with your personalised in-flight experience.' },
];

function HowItWorks() {
  return (
    <Section className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto text-center">
        <SectionLabel>The Process</SectionLabel>
        <SectionHeading>
          How It <GoldText>Works</GoldText>
        </SectionHeading>
        <GoldDivider />

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Gold connector line (desktop) */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-amber-600/30 via-amber-500/60 to-amber-600/30" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full border-2 border-amber-500/50 flex items-center justify-center mb-5 bg-[#0a0a0a] relative z-10">
                <span className="text-amber-400 font-black text-lg">{step.num}</span>
              </div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{step.title}</h4>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── WHY CHOOSE US ───────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: Shield, title: 'Vetted Fleet Partners', desc: 'Every aircraft inspected and certified. We partner only with DGCA-approved operators.' },
  { icon: DollarSign, title: 'Transparent Pricing', desc: 'No hidden fees. Your quote includes fuel, crew, landing charges, and taxes.' },
  { icon: Headphones, title: '24/7 Concierge', desc: 'Your personal aviation advisor — available around the clock, every day of the year.' },
  { icon: Crown, title: 'Bespoke Experience', desc: 'Custom catering, ground transport, hotel reservations, and in-flight preferences. Every detail, handled.' },
];

function WhyChooseUs() {
  return (
    <Section className="py-24 px-4 bg-[#050505]">
      <div className="max-w-6xl mx-auto text-center">
        <SectionLabel>The IY Difference</SectionLabel>
        <SectionHeading>
          Why Choose <GoldText>IY Private Aviation</GoldText>
        </SectionHeading>
        <GoldDivider />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-sm border border-zinc-800 bg-zinc-900/40 hover:border-amber-500/30 transition-all duration-500"
              >
                <Icon className="w-8 h-8 text-amber-400 mx-auto mb-4" strokeWidth={1.5} />
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-2">{item.title}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <Section className="py-24 px-4 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto text-center">
        <SectionLabel>Client Stories</SectionLabel>
        <SectionHeading>
          What Our <GoldText>Clients Say</GoldText>
        </SectionHeading>
        <GoldDivider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {jetTestimonials.map((t, i) => {
            // Generate initials from name
            const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-sm bg-zinc-900/50 border border-zinc-800 text-left relative"
              >
                {/* Gold quote mark */}
                <span className="absolute top-4 right-6 text-6xl text-amber-500/10 font-serif leading-none select-none">&ldquo;</span>

                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black font-bold text-xs">
                    {initials}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── INQUIRY FORM ────────────────────────────────────────────────────────────
function InquiryForm() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', from: '', to: '', date: '', passengers: '', specialRequests: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        passengers: Number(form.passengers) || 0,
        source_type: 'private_jet_inquiry',
        created_at: serverTimestamp(),
      };

      // Save to both collections
      await Promise.all([
        addDoc(collection(db, 'leads'), payload),
        addDoc(collection(db, 'jet_inquiries'), payload),
      ]);

      setSubmitted(true);
      setForm({ name: '', phone: '', email: '', from: '', to: '', date: '', passengers: '', specialRequests: '' });
    } catch (err) {
      console.error('Submission error:', err);
      alert('Something went wrong. Please try again or contact us on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-zinc-900/80 border border-zinc-700 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 rounded-sm px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none transition-all';

  if (submitted) {
    return (
      <Section id="inquiry" className="py-24 px-4 bg-[#050505]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-3">Inquiry Received</h3>
            <p className="text-zinc-400 text-sm mb-6">Our aviation desk will contact you within 2 hours with aircraft options and pricing.</p>
            <button onClick={() => setSubmitted(false)} className="text-amber-400 text-xs uppercase tracking-widest font-bold hover:underline">
              Submit Another Inquiry
            </button>
          </motion.div>
        </div>
      </Section>
    );
  }

  return (
    <Section id="inquiry" className="py-24 px-4 bg-[#050505]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel>Get Started</SectionLabel>
          <SectionHeading>
            Request Your <GoldText>Private Flight</GoldText>
          </SectionHeading>
          <GoldDivider />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className={inputCls} />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" required type="tel" className={inputCls} />
          </div>
          <input name="email" value={form.email} onChange={handleChange} placeholder="Email Address" required type="email" className={inputCls} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <input name="from" value={form.from} onChange={handleChange} placeholder="From (City / Airport)" required className={inputCls} />
            <input name="to" value={form.to} onChange={handleChange} placeholder="To (City / Airport)" required className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <input name="date" value={form.date} onChange={handleChange} type="date" required className={inputCls} />
            <input name="passengers" value={form.passengers} onChange={handleChange} placeholder="Number of Passengers" type="number" min="1" max="50" required className={inputCls} />
          </div>
          <textarea
            name="specialRequests"
            value={form.specialRequests}
            onChange={handleChange}
            placeholder="Special Requests (catering, ground transport, return flight...)"
            rows={3}
            className={inputCls}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold uppercase tracking-widest text-sm rounded-sm hover:from-amber-400 hover:to-yellow-500 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : (
              <>
                <Send className="w-4 h-4" />
                Submit Inquiry
              </>
            )}
          </button>
        </form>

        {/* WhatsApp alternative */}
        <div className="text-center mt-8 pt-8 border-t border-zinc-800">
          <p className="text-zinc-500 text-xs mb-3">Prefer WhatsApp? Chat with our aviation desk</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I\'d like to inquire about a private jet charter.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border border-green-600/40 text-green-400 text-xs uppercase tracking-widest font-bold rounded-sm hover:bg-green-600/10 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </Section>
  );
}

// ─── FOOTER NOTE ─────────────────────────────────────────────────────────────
function FooterNote() {
  return (
    <div className="py-12 px-4 bg-[#050505] border-t border-zinc-900">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-500/60 font-bold mb-2">
          Infinite Yatra — Private Aviation Division
        </p>
        <p className="text-zinc-600 text-[11px] tracking-wider">
          By invitation and inquiry only. Subject to aircraft availability.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function PrivateJets() {
  return (
    <div className="bg-[#050505] min-h-screen text-white">
      <SEO
        title="Private Jets"
        description="Charter private jets across India and beyond. Luxury air travel with 24/7 concierge, vetted fleet, and transparent pricing. Infinite Yatra Private Aviation."
        keywords="private jet india, charter flight, luxury aviation, private plane hire, jet charter mumbai delhi"
        url="/private-aviation"
      />
      <Hero />
      <Services />
      <Fleet />
      <PopularRoutes />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <InquiryForm />
      <ExploreOtherTransport currentKey="private-aviation" />
      <FooterNote />
    </div>
  );
}
