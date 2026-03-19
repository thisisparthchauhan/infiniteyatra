import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { icon: '🌍', value: 195, suffix: '+', label: 'Countries Covered' },
  { icon: '🗺️', value: 50, suffix: '+', label: 'Curated Packages' },
  { icon: '⭐', value: 4.8, suffix: '', label: 'Avg Rating', decimal: true },
  { icon: '🧳', value: 500, suffix: '+', label: 'Happy Travelers' },
];

function useCountUp(target, duration = 1500, decimal = false, startTrigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startTrigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(decimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, decimal, startTrigger]);
  return count;
}

function StatItem({ icon, value, suffix, label, decimal, startTrigger }) {
  const count = useCountUp(value, 1500, decimal, startTrigger);
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 min-w-0">
      <div className="text-2xl md:text-3xl font-bold text-white">
        {icon} {count}{suffix}
      </div>
      <div className="text-xs text-white/50 mt-1 tracking-wider uppercase">{label}</div>
    </div>
  );
}

const HeroSection = ({ onExploreClick }) => {
  const navigate = useNavigate();
  const [showScroll, setShowScroll] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Trigger stats animation on mount after brief delay
  useEffect(() => {
    const t = setTimeout(() => setStatsVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '100vh', minHeight: '600px' }}>
      {/* Purple left glow strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 z-20" style={{ background: '#7C3AED' }} />

      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1920"
        alt="Cinematic mountain hero"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'brightness(0.6) saturate(1.2)' }}
      />

      {/* Dark overlay gradient */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)' }}
      />

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-40 md:pb-44 px-8 md:px-16 lg:px-24">
        {/* Tag line */}
        <div
          className="mb-4 animate-fade-in-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
        >
          <span
            className="text-xs md:text-sm font-medium uppercase"
            style={{ color: '#7C3AED', letterSpacing: '4px' }}
          >
            ✦ 195 Countries. Infinite Stories.
          </span>
        </div>

        {/* Main heading */}
        <div
          className="mb-6 animate-fade-in-up"
          style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
        >
          <h1
            className="text-white font-extrabold leading-tight"
            style={{ fontSize: 'clamp(36px, 7vw, 72px)', lineHeight: 1.05 }}
          >
            Explore the<br />
            World's Most<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Extraordinary
            </span>{' '}
            <span className="text-white">Places.</span>
          </h1>
        </div>

        {/* Subtext */}
        <div
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: '0.9s', animationFillMode: 'both', maxWidth: '520px' }}
        >
          <p className="text-base md:text-lg" style={{ color: '#999', lineHeight: 1.6 }}>
            From the peaks of the Himalayas to the shores of Santorini —
            curated journeys for those who demand more than a vacation.
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3 animate-fade-in-up"
          style={{ animationDelay: '1.2s', animationFillMode: 'both' }}
        >
          <button
            onClick={onExploreClick}
            className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              padding: '14px 32px',
              fontSize: '15px',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            }}
          >
            Explore All Destinations <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/trip-planner')}
            className="inline-flex items-center justify-center gap-2 font-semibold text-white rounded-full border transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              padding: '14px 32px',
              fontSize: '15px',
              border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #7C3AED, #2563EB)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            }}
          >
            <Sparkles size={16} /> Plan with AI ✦
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        ref={statsRef}
        className="absolute bottom-0 left-0 right-0 z-20 flex divide-x"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          divideColor: 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Mobile: 2x2 grid / Desktop: row */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {STATS.map((stat, i) => (
            <StatItem key={i} {...stat} startTrigger={statsVisible} />
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      {showScroll && (
        <div
          className="absolute bottom-28 md:bottom-32 left-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
          style={{ transform: 'translateX(-50%)', opacity: 0.6 }}
        >
          <span className="text-white text-xs tracking-widest uppercase">Scroll to explore</span>
          <ChevronDown
            size={20}
            className="text-white animate-bounce"
          />
        </div>
      )}

      {/* Fade-in-up keyframes */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
