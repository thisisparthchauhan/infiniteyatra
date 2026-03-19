import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, MapPin, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CATEGORY_COLORS = {
  trek: { bg: 'rgba(6,78,59,0.8)', color: '#6ee7b7', icon: '🏔️' },
  spiritual: { bg: 'rgba(120,53,15,0.8)', color: '#fcd34d', icon: '🛕' },
  international: { bg: 'rgba(30,58,138,0.8)', color: '#93c5fd', icon: '✈️' },
  leisure: { bg: 'rgba(131,24,67,0.8)', color: '#f9a8d4', icon: '🌴' },
  domestic: { bg: 'rgba(76,29,149,0.8)', color: '#c4b5fd', icon: '🚂' },
  beach: { bg: 'rgba(8,51,68,0.8)', color: '#67e8f9', icon: '🏖️' },
  default: { bg: 'rgba(30,30,30,0.8)', color: '#d1d5db', icon: '🌍' },
};

function getCategoryStyle(category) {
  if (!category) return CATEGORY_COLORS.default;
  const key = (Array.isArray(category) ? category[0] : category).toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

const EditorPickCard = ({ pkg, onWishlistClick, isWishlisted }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const catStyle = getCategoryStyle(pkg.category);

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer overflow-hidden"
      style={{
        width: '380px',
        height: '500px',
        borderRadius: '20px',
        scrollSnapAlign: 'start',
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
        boxShadow: hovered ? '0 0 40px rgba(124,58,237,0.4)' : '0 4px 24px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/package/${pkg.id}`)}
    >
      {/* Background image */}
      <img
        src={pkg.image}
        alt={pkg.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.6s ease',
        }}
      />

      {/* Dark overlay at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
        }}
      />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
        {/* Editor's Pick badge */}
        <span
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            letterSpacing: '1px',
          }}
        >
          EDITOR'S PICK ✦
        </span>

        <div className="flex flex-col items-end gap-2">
          {/* Wishlist */}
          <button
            onClick={(e) => { e.stopPropagation(); onWishlistClick(pkg); }}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <Heart
              size={16}
              className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'}
            />
          </button>
          {/* Rating */}
          {pkg.rating && (
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fcd34d' }}
            >
              ★ {pkg.rating}
            </span>
          )}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        {/* Category tag */}
        <span
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
          style={{ background: catStyle.bg, color: catStyle.color }}
        >
          {catStyle.icon} {(Array.isArray(pkg.category) ? pkg.category[0] : pkg.category || 'Journey').toUpperCase()}
        </span>

        <h3 className="text-white text-xl font-bold mb-1 leading-tight">{pkg.title}</h3>
        {pkg.location && (
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <MapPin size={11} /> {pkg.location}
          </p>
        )}
        {pkg.duration && (
          <p className="text-gray-500 text-xs mb-3">
            {pkg.duration}{pkg.groupSize ? ` · Up to ${pkg.groupSize} People` : ''}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-base">
            {pkg.priceDisplay || `₹${(pkg.price || 0).toLocaleString('en-IN')}`}
            <span className="text-gray-400 font-normal text-xs"> /person</span>
          </span>

          {/* Hover CTA */}
          <span
            className="text-xs font-semibold flex items-center gap-1 text-purple-400 transition-all duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            View Journey <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
};

const EditorsPick = () => {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const q = query(
          collection(db, 'packages'),
          where('isEditorsPick', '==', true),
          where('isActive', '==', true),
          orderBy('rating', 'desc'),
          limit(8)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docs = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            priceDisplay: `₹${(d.data().price || 0).toLocaleString('en-IN')}`,
          }));
          setPicks(docs);
        }
      } catch (err) {
        // Fallback: if index not ready or no results, hide section silently
        console.log('EditorsPick fetch error:', err.message);
        setPicks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPicks();
  }, []);

  const handleWishlistClick = (pkg) => {
    if (!currentUser) {
      addToast('Login to save to your wishlist ❤️', 'info');
      return;
    }
    toggleWishlist(pkg);
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 400, behavior: 'smooth' });
  };

  if (loading || picks.length === 0) return null;

  return (
    <section className="py-12 md:py-16" style={{ background: '#0a0a0a' }}>
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p
              className="text-xs font-semibold uppercase mb-2"
              style={{ color: '#7C3AED', letterSpacing: '3px' }}
            >
              ✦ EDITOR'S PICK
            </p>
            <h2 className="text-white text-2xl md:text-3xl font-bold">Handpicked by Our Explorers</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-500 hover:text-purple-400 transition-colors hidden md:block">
              View All →
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => scroll(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-purple-500 transition-all"
                style={{ background: '#1a1a1a' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-purple-500 transition-all"
                style={{ background: '#1a1a1a' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: '8px',
          }}
        >
          <style>{`
            .editors-scroll::-webkit-scrollbar { display: none; }
          `}</style>
          {picks.map(pkg => (
            <EditorPickCard
              key={pkg.id}
              pkg={pkg}
              isWishlisted={isInWishlist(pkg.id)}
              onWishlistClick={handleWishlistClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorsPick;
