import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, Wallet, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';

// ─── Vehicle Data ───
const vehicles = [
  { id: 'cycles', name: 'Cycles', category: 'Land', tagline: 'Pedal through paradise', price: 'From ₹50/hr', accent: '#22c55e', imgUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800', size: 'small' },
  { id: 'bikes', name: 'Bikes', category: 'Land', tagline: 'Own the open road', price: 'From ₹300/day', accent: '#f97316', imgUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800', size: 'large' },
  { id: 'cars', name: 'Cars', category: 'Land', tagline: 'Your city. Your terms.', price: 'From ₹1,500/day', accent: '#3b82f6', imgUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800', size: 'large' },
  { id: 'traveller', name: 'Traveller', category: 'Land', tagline: 'Move together, arrive together', price: 'From ₹3,000/day', accent: '#eab308', imgUrl: '/assets/transport/red-van-nature.jpg', size: 'small' },
  { id: 'bus', name: 'Bus', category: 'Land', tagline: 'Comfort in numbers', price: 'From ₹500/seat', accent: '#14b8a6', imgUrl: '/assets/transport/bus.jpg', size: 'small' },
  { id: 'trains', name: 'Trains', category: 'Land', tagline: 'India in motion', price: 'From ₹250/seat', accent: '#6366f1', imgUrl: '/assets/transport/jaden-william-qVeqpMrZQGk-unsplash.jpg', size: 'large' },
  { id: 'flights', name: 'Flights', category: 'Air', tagline: 'Sky is not the limit', price: 'From ₹2,500', accent: '#0ea5e9', imgUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=800', size: 'small' },
  { id: 'jet-planes', name: 'Jet Planes', category: 'Air', tagline: 'Above the ordinary', price: 'On Request', accent: '#f59e0b', imgUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800', size: 'large' },
  { id: 'cruise', name: 'Cruise', category: 'Sea', tagline: 'Where horizons have no end', price: 'From ₹15,000', accent: '#06b6d4', imgUrl: '/assets/transport/cruise.jpg', size: 'large' },
];

const filters = [
  { id: 'all', label: 'All Vehicles', icon: '🚐' },
  { id: 'Land', label: '🚲 Land', icon: null },
  { id: 'Air', label: '✈️ Air', icon: null },
  { id: 'Sea', label: '🚢 Sea', icon: null },
];

const stats = [
  { label: 'Vehicles', value: 500, suffix: '+' },
  { label: 'Cities', value: 50, suffix: '+' },
  { label: 'Happy Travelers', value: 10000, suffix: '+' },
  { label: 'Vehicle Types', value: 9, suffix: '' },
];

// ─── Animated Canvas Component ───
const HeroCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let trails = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // City nodes
    const cityNodes = [
      { x: 0.15, y: 0.3 }, { x: 0.25, y: 0.55 }, { x: 0.4, y: 0.25 },
      { x: 0.55, y: 0.45 }, { x: 0.7, y: 0.3 }, { x: 0.8, y: 0.6 },
      { x: 0.35, y: 0.7 }, { x: 0.6, y: 0.7 }, { x: 0.5, y: 0.15 },
      { x: 0.2, y: 0.8 }, { x: 0.85, y: 0.4 }, { x: 0.45, y: 0.55 },
    ];

    // Create trails between random city pairs
    const connections = [
      [0, 2], [2, 4], [4, 5], [1, 3], [3, 5], [0, 1], [6, 7], [2, 8],
      [1, 6], [7, 5], [3, 11], [9, 6], [8, 4], [10, 5],
    ];

    class Trail {
      constructor(from, to) {
        this.from = from;
        this.to = to;
        this.progress = Math.random();
        this.speed = 0.001 + Math.random() * 0.002;
        this.dotSize = 2 + Math.random() * 2;
      }
      update() {
        this.progress += this.speed;
        if (this.progress > 1) this.progress = 0;
      }
      draw(ctx, w, h) {
        const fx = this.from.x * w, fy = this.from.y * h;
        const tx = this.to.x * w, ty = this.to.y * h;

        // Dashed line
        ctx.beginPath();
        ctx.setLineDash([4, 8]);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
        ctx.lineWidth = 1;
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);

        // Moving dot
        const x = fx + (tx - fx) * this.progress;
        const y = fy + (ty - fy) * this.progress;
        ctx.beginPath();
        ctx.arc(x, y, this.dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${0.5 + this.progress * 0.5})`;
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    trails = connections.map(([i, j]) => new Trail(cityNodes[i], cityNodes[j]));

    // Floating particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // City node dots
      cityNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x * canvas.width, node.y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.fill();
      });

      trails.forEach(t => { t.update(); t.draw(ctx, canvas.width, canvas.height); });

      // Particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

// ─── Count-Up Hook ───
const useCountUp = (target, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return [count, ref];
};

// ─── Stat Item ───
const StatItem = ({ value, suffix, label }) => {
  const [count, ref] = useCountUp(value);
  return (
    <div ref={ref} className="text-center px-4 py-6">
      <div className="text-3xl md:text-4xl font-black text-white mb-1 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-slate-400 font-medium">{label}</div>
    </div>
  );
};

// ─── Vehicle Card ───
const VehicleCard = ({ vehicle, index }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      onClick={() => navigate(`/transportation/${vehicle.id}`)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl overflow-hidden cursor-pointer group ${
        // Core bento grid classes based on vehicle ID/index
        (vehicle.id === 'bikes' || vehicle.id === 'flights') ? 'lg:col-span-2 lg:row-span-2 min-h-[360px]' : 
        (vehicle.id === 'cars') ? 'lg:col-span-2 lg:row-span-1 min-h-[280px]' :
        (vehicle.id === 'cruise') ? 'lg:col-span-1 lg:row-span-2 min-h-[360px]' :
        'lg:col-span-1 lg:row-span-1 min-h-[280px]'
      }`}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Glow border on hover */}
      <div
        className="absolute -inset-[2px] rounded-[26px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm z-0"
        style={{ background: `linear-gradient(135deg, ${vehicle.accent}, transparent, ${vehicle.accent})` }}
      />

      <div className="absolute inset-0 rounded-3xl overflow-hidden z-10 border border-white/10 group-hover:border-transparent transition-colors">
        {/* Image */}
        <img
          src={vehicle.imgUrl}
          alt={vehicle.name}
          className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight drop-shadow-lg">{vehicle.name}</h3>
          <p className="text-slate-300 text-sm font-medium mb-3 drop-shadow-md">{vehicle.tagline}</p>

          {/* Price badge */}
          <div
            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-3"
            style={{ background: `${vehicle.accent}22`, color: vehicle.accent, border: `1px solid ${vehicle.accent}44` }}
          >
            {vehicle.price}
          </div>

          {/* CTA slides up on hover */}
          <div className="transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span
              className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl"
              style={{ background: vehicle.accent, color: '#000' }}
            >
              Explore →
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ───
export default function TransportationHub() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredVehicles = activeFilter === 'all'
    ? vehicles
    : vehicles.filter(v => v.category === activeFilter);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-x-hidden">
      <SEO title="Transportation | Infinite Yatra" description="Every Road. Every Sky. Every Sea — one platform to move anywhere in India." url="/transportation" />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-900/15 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[160px]" />
      </div>

      {/* ── HERO ── */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <HeroCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f] z-[1]" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="text-5xl sm:text-6xl md:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight"
          >
            Every Road. Every Sky.{' '}
            <br className="hidden sm:block" />
            Every Sea.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c63ff] to-[#3b82f6]">
              One platform to move anywhere in India — your way.
            </span>
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={28} className="text-white/40" />
        </motion.div>
      </section>

      {/* ── CATEGORY TABS ── */}
      <section className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-3 overflow-x-auto hide-scrollbar">
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                activeFilter === filter.id
                  ? 'bg-gradient-to-r from-[#6c63ff] to-[#3b82f6] text-white border-transparent shadow-[0_0_20px_rgba(108,99,255,0.35)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── VEHICLE SHOWCASE ── */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr] gap-5 auto-rows-[minmax(280px,auto)] grid-flow-dense"
          >
            <AnimatePresence mode="popLayout">
              {filteredVehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white text-center mb-16"
          >
            Why{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c63ff] to-[#3b82f6]">
              Infinite Yatra
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Verified Vehicles', desc: 'Every vehicle is inspected and certified for your safety and comfort.' },
              { icon: MapPin, title: 'Door-to-Door Service', desc: 'Pickup and drop anywhere in your city — on your schedule.' },
              { icon: Wallet, title: 'Zero Hidden Charges', desc: 'What you see is what you pay. No surprises, no fine print.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 group text-center"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#6c63ff]/20 to-[#3b82f6]/20 rounded-2xl flex items-center justify-center mb-6 border border-[#6c63ff]/20 group-hover:scale-110 transition-transform duration-300">
                  <item.icon size={28} className="text-[#6c63ff]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="relative z-10 border-t border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} />
          ))}
        </div>
      </section>

      {/* Bottom spacer for footer */}
      <div className="h-20" />
    </div>
  );
}
