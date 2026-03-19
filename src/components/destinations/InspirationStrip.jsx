import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const InspirationStrip = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.78)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#7C3AED', letterSpacing: '4px' }}
        >
          ✦ NOT SURE WHERE TO GO? ✦
        </p>

        <h2
          className="text-white font-extrabold leading-tight mb-5"
          style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: 1.1 }}
        >
          Let Our{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI
          </span>{' '}
          Plan
          <br />
          Your Perfect Trip
        </h2>

        <p
          className="text-base md:text-lg mb-10 leading-relaxed"
          style={{ color: '#888', maxWidth: '500px' }}
        >
          Tell us your budget, travel style, and dream — we'll build your entire
          itinerary in seconds.
        </p>

        <button
          onClick={() => navigate('/trip-planner')}
          className="inline-flex items-center gap-2 font-bold text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            padding: '16px 40px',
            fontSize: '16px',
            background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
            boxShadow: '0 0 40px rgba(124,58,237,0.5)',
            letterSpacing: '0.3px',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 60px rgba(124,58,237,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.5)'; }}
        >
          <Sparkles size={18} />
          ✨ Start AI Planning — Free
        </button>
      </div>
    </section>
  );
};

export default InspirationStrip;
