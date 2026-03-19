import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, MapPin, Clock, Users, Star, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CATEGORY_FILTERS = ['All', 'Trek', 'Spiritual', 'International', 'Leisure', 'Domestic', 'Beach', 'Wildlife'];

const DURATION_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Weekend (1-3D)', value: 'weekend' },
  { label: 'Short (4-6D)', value: 'short' },
  { label: 'Week (7D)', value: 'week' },
  { label: 'Long (8D+)', value: 'long' },
];

const GROUP_OPTIONS = [
  { label: 'Solo', value: 'solo' },
  { label: 'Couple', value: 'couple' },
  { label: 'Small (3-8)', value: 'small' },
  { label: 'Large (9+)', value: 'large' },
];

const SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
];

const CATEGORY_BADGE = {
  trek: { bg: '#064e3b', text: '#6ee7b7' },
  spiritual: { bg: '#78350f', text: '#fcd34d' },
  international: { bg: '#1e3a8a', text: '#93c5fd' },
  leisure: { bg: '#831843', text: '#f9a8d4' },
  domestic: { bg: '#4c1d95', text: '#c4b5fd' },
  beach: { bg: '#083344', text: '#67e8f9' },
  wildlife: { bg: '#14532d', text: '#86efac' },
  default: { bg: '#1f1f1f', text: '#9ca3af' },
};

const SEASON_BADGE = {
  summer: { bg: '#78350f', text: '#fcd34d', icon: '☀️' },
  monsoon: { bg: '#0c4a6e', text: '#7dd3fc', icon: '🌧️' },
  winter: { bg: '#0c1a3a', text: '#bae6fd', icon: '❄️' },
  autumn: { bg: '#7c2d12', text: '#fdba74', icon: '🍂' },
};

function getCategoryBadge(category) {
  if (!category) return CATEGORY_BADGE.default;
  const key = (Array.isArray(category) ? category[0] : category).toLowerCase();
  return CATEGORY_BADGE[key] || CATEGORY_BADGE.default;
}

function getDurationDays(durationStr) {
  if (!durationStr) return 0;
  return parseInt(durationStr) || 0;
}

function matchesDuration(days, durationFilter) {
  if (durationFilter === 'all') return true;
  if (durationFilter === 'weekend') return days >= 1 && days <= 3;
  if (durationFilter === 'short') return days >= 4 && days <= 6;
  if (durationFilter === 'week') return days === 7;
  if (durationFilter === 'long') return days >= 8;
  return true;
}

// Skeleton card
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
    <div className="aspect-[4/3] bg-gray-800 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
      <div className="h-3 bg-gray-800 rounded animate-pulse w-2/3" />
      <div className="flex justify-between items-center mt-3">
        <div className="h-5 bg-gray-800 rounded animate-pulse w-1/3" />
        <div className="h-8 bg-gray-800 rounded-full animate-pulse w-24" />
      </div>
    </div>
  </div>
);

// Package Card
const PackageCard = ({ pkg, onWishlistClick, isWishlisted }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const badge = getCategoryBadge(pkg.category);
  const seasons = pkg.season
    ? (Array.isArray(pkg.season) ? pkg.season : [pkg.season])
    : [];

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        background: '#111111',
        border: `1px solid ${hovered ? '#7C3AED' : '#1e1e1e'}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/package/${pkg.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <img
          src={pkg.image}
          alt={pkg.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
        />
        {/* Category badge */}
        <span
          className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: badge.bg, color: badge.text }}
        >
          {(Array.isArray(pkg.category) ? pkg.category[0] : pkg.category || 'Journey')}
        </span>
        {/* Wishlist */}
        <button
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={(e) => { e.stopPropagation(); onWishlistClick(pkg); }}
        >
          <Heart size={14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'} />
        </button>
        {/* Rating */}
        {pkg.rating && (
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fcd34d' }}
          >
            <Star size={11} className="fill-yellow-400 text-yellow-400" /> {pkg.rating}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-base leading-tight line-clamp-2 mb-1.5">
          {pkg.title}
        </h3>
        {pkg.location && (
          <p className="flex items-center gap-1 text-gray-500 text-xs mb-1">
            <MapPin size={11} /> {pkg.location}
          </p>
        )}
        {(pkg.duration || pkg.groupSize) && (
          <p className="flex items-center gap-3 text-gray-600 text-xs mb-2">
            {pkg.duration && <span className="flex items-center gap-1"><Clock size={11} /> {pkg.duration}</span>}
            {pkg.groupSize && <span className="flex items-center gap-1"><Users size={11} /> Max {pkg.groupSize}</span>}
          </p>
        )}

        {/* Season tags */}
        {seasons.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {seasons.map(s => {
              const sv = SEASON_BADGE[s.toLowerCase()] || SEASON_BADGE.summer;
              return (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: sv.bg, color: sv.text }}>
                  {sv.icon} {s}
                </span>
              );
            })}
          </div>
        )}

        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
          <div>
            <span className="text-white font-bold text-lg">
              {pkg.priceDisplay || `₹${(pkg.price || 0).toLocaleString('en-IN')}`}
            </span>
            <span className="text-gray-500 text-xs"> /person</span>
          </div>
          <button
            className="text-xs font-semibold text-white px-4 py-2 rounded-full transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/package/${pkg.id}`); }}
          >
            Book Now →
          </button>
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 12;

const PackageGrid = ({ packages = [], loading = false, activeSeason = 'all' }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [duration, setDuration] = useState('all');
  const [maxPrice, setMaxPrice] = useState(150000);
  const [sortBy, setSortBy] = useState('recommended');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);

  // Compute package price range
  const pkgMaxPrice = useMemo(() => {
    if (!packages.length) return 150000;
    return Math.max(...packages.map(p => p.price || 0), 150000);
  }, [packages]);

  // Reset max price when packages load
  useEffect(() => { setMaxPrice(pkgMaxPrice); }, [pkgMaxPrice]);

  const activeFilters = useMemo(() => {
    const arr = [];
    if (search) arr.push({ label: `"${search}"`, key: 'search' });
    if (category !== 'All') arr.push({ label: category, key: 'category' });
    if (duration !== 'all') arr.push({ label: DURATION_OPTIONS.find(o => o.value === duration)?.label, key: 'duration' });
    if (maxPrice < pkgMaxPrice) arr.push({ label: `Under ₹${maxPrice.toLocaleString('en-IN')}`, key: 'maxPrice' });
    return arr;
  }, [search, category, duration, maxPrice, pkgMaxPrice]);

  const removeFilter = useCallback((key) => {
    if (key === 'search') setSearch('');
    if (key === 'category') setCategory('All');
    if (key === 'duration') setDuration('all');
    if (key === 'maxPrice') setMaxPrice(pkgMaxPrice);
  }, [pkgMaxPrice]);

  const clearAll = useCallback(() => {
    setSearch(''); setCategory('All'); setDuration('all'); setMaxPrice(pkgMaxPrice); setSortBy('recommended');
  }, [pkgMaxPrice]);

  const filteredPackages = useMemo(() => {
    let result = packages.filter(pkg => {
      // Season filter
      if (activeSeason !== 'all') {
        const pkgSeasons = pkg.season
          ? (Array.isArray(pkg.season) ? pkg.season : [pkg.season]).map(s => s.toLowerCase())
          : [];
        if (!pkgSeasons.includes(activeSeason.toLowerCase())) return false;
      }
      // Search
      const q = search.toLowerCase();
      if (q && !pkg.title?.toLowerCase().includes(q) && !pkg.location?.toLowerCase().includes(q)) return false;
      // Category
      if (category !== 'All') {
        const cats = pkg.category
          ? (Array.isArray(pkg.category) ? pkg.category : [pkg.category]).map(c => c.toLowerCase())
          : [];
        if (!cats.includes(category.toLowerCase())) return false;
      }
      // Duration
      const days = getDurationDays(pkg.duration);
      if (!matchesDuration(days, duration)) return false;
      // Price
      if (pkg.price > maxPrice) return false;
      return true;
    });

    // Sort
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price_desc') result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'rating') result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return result;
  }, [packages, activeSeason, search, category, duration, maxPrice, sortBy]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filteredPackages]);

  const visiblePackages = filteredPackages.slice(0, page * PAGE_SIZE);
  const hasMore = visiblePackages.length < filteredPackages.length;

  const handleWishlistClick = useCallback((pkg) => {
    if (!currentUser) {
      addToast('Login to save to your wishlist ❤️', 'info');
      return;
    }
    toggleWishlist(pkg);
  }, [currentUser, toggleWishlist, addToast]);

  return (
    <section className="py-12 md:py-16" style={{ background: '#0a0a0a' }}>
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-1">Find Your Dream Journey</h2>
          <p className="text-gray-500 text-sm">Explore our curated collection of treks, tours, and spiritual journeys.</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search destinations, countries, experiences..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm text-white placeholder-gray-600 rounded-xl outline-none transition-all duration-200"
            style={{
              background: '#111',
              border: '1px solid #2a2a2a',
              padding: '12px 16px 12px 42px',
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#2a2a2a'}
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200"
              style={{
                background: category === cat ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : '#1a1a1a',
                color: category === cat ? '#fff' : '#666',
                border: category === cat ? 'none' : '1px solid #2a2a2a',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(p => !p)}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filters ⚙️
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div
              className="mt-3 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              style={{ background: '#111', border: '1px solid #1e1e1e' }}
            >
              {/* Max Price */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Max Price</p>
                <p className="text-white font-semibold text-sm mb-2">₹{maxPrice.toLocaleString('en-IN')}</p>
                <input
                  type="range"
                  min={0}
                  max={pkgMaxPrice}
                  step={1000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>₹0</span>
                  <span>₹{pkgMaxPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Duration</p>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: duration === opt.value ? '#7C3AED' : '#1a1a1a',
                        color: duration === opt.value ? '#fff' : '#666',
                        border: `1px solid ${duration === opt.value ? '#7C3AED' : '#2a2a2a'}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sort By</p>
                <div className="flex flex-col gap-1.5">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className="text-xs px-3 py-1.5 rounded-full text-left transition-all"
                      style={{
                        background: sortBy === opt.value ? '#7C3AED' : '#1a1a1a',
                        color: sortBy === opt.value ? '#fff' : '#666',
                        border: `1px solid ${sortBy === opt.value ? '#7C3AED' : '#2a2a2a'}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Tags */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {activeFilters.map(f => (
              <span
                key={f.key}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}
              >
                {f.label}
                <button onClick={() => removeFilter(f.key)} className="hover:text-white ml-1">
                  <X size={11} />
                </button>
              </span>
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-white underline transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Count */}
        {!loading && (
          <p className="text-gray-600 text-xs mb-5">
            Showing <span className="text-white font-semibold">{visiblePackages.length}</span> of{' '}
            <span className="text-white font-semibold">{filteredPackages.length}</span> destinations
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-5">🌍</div>
            <h3 className="text-white text-xl font-bold mb-2">No journeys found for this search.</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or browse all destinations.</p>
            <button
              onClick={clearAll}
              className="text-sm font-semibold text-white px-6 py-3 rounded-full transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
            >
              Browse all destinations →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visiblePackages.map(pkg => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isWishlisted={isInWishlist(pkg.id)}
                onWishlistClick={handleWishlistClick}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              className="text-sm font-semibold text-purple-400 border border-purple-500/40 px-8 py-3 rounded-full transition-all hover:bg-purple-500/10 hover:border-purple-400"
            >
              Load More Journeys
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PackageGrid;
