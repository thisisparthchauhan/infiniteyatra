import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Search, Star, MapPin, ChevronRight, SlidersHorizontal, Wifi, Coffee, Car,
  Waves, Dumbbell, X, MessageCircle, ArrowUpDown, Grid3X3, List, ChevronDown,
  Flame, UtensilsCrossed, ShieldCheck, PawPrint, Wind, Sparkles, TreePine,
  LayoutGrid, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/common/SEO';
import HotelCard from '../components/Hotels/HotelCard';

// --- Constants ---

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

const PROPERTY_TYPES = [
  'Hotel', 'Resort', 'Homestay', 'Villa', 'Cottage', 'Dormitory', 'Guest House', 'Camp'
];

const AMENITIES_LIST = [
  { key: 'WiFi', label: 'WiFi', icon: Wifi },
  { key: 'Swimming Pool', label: 'Pool', icon: Waves },
  { key: 'Parking', label: 'Parking', icon: Car },
  { key: 'AC', label: 'AC', icon: Wind },
  { key: 'Kitchen', label: 'Kitchen', icon: UtensilsCrossed },
  { key: 'Pet Friendly', label: 'Pet Friendly', icon: PawPrint },
  { key: 'Breakfast Included', label: 'Breakfast', icon: Coffee },
  { key: 'Gym / Fitness Centre', label: 'Gym', icon: Dumbbell },
  { key: 'Spa', label: 'Spa', icon: Sparkles },
  { key: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed },
];

const MEAL_PLANS = ['Room Only', 'Breakfast Included', 'Half Board', 'Full Board'];

const RATING_OPTIONS = [
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

const PRICE_MIN = 500;
const PRICE_MAX = 50000;
const LOAD_MORE_COUNT = 12;

// --- Helper: parse search params into filter state ---
function parseFilters(searchParams) {
  return {
    search: searchParams.get('q') || '',
    priceMin: Number(searchParams.get('priceMin')) || PRICE_MIN,
    priceMax: Number(searchParams.get('priceMax')) || PRICE_MAX,
    minRating: Number(searchParams.get('rating')) || 0,
    propertyTypes: searchParams.get('types') ? searchParams.get('types').split(',') : [],
    amenities: searchParams.get('amenities') ? searchParams.get('amenities').split(',') : [],
    mealPlan: searchParams.get('meal') || '',
    freeCancellation: searchParams.get('freeCancel') === 'true',
    sort: searchParams.get('sort') || 'recommended',
    view: searchParams.get('view') || 'grid',
  };
}

function filtersToParams(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.priceMin > PRICE_MIN) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax < PRICE_MAX) params.set('priceMax', String(filters.priceMax));
  if (filters.minRating > 0) params.set('rating', String(filters.minRating));
  if (filters.propertyTypes.length) params.set('types', filters.propertyTypes.join(','));
  if (filters.amenities.length) params.set('amenities', filters.amenities.join(','));
  if (filters.mealPlan) params.set('meal', filters.mealPlan);
  if (filters.freeCancellation) params.set('freeCancel', 'true');
  if (filters.sort !== 'recommended') params.set('sort', filters.sort);
  if (filters.view !== 'grid') params.set('view', filters.view);
  return params;
}

function countActiveFilters(filters) {
  let count = 0;
  if (filters.search) count++;
  if (filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) count++;
  if (filters.minRating > 0) count++;
  if (filters.propertyTypes.length) count += filters.propertyTypes.length;
  if (filters.amenities.length) count += filters.amenities.length;
  if (filters.mealPlan) count++;
  if (filters.freeCancellation) count++;
  return count;
}

// --- Reusable Sidebar Section ---
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 hover:text-white transition-colors"
      >
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Component ---
const AllHotels = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(LOAD_MORE_COUNT);
  const sidebarRef = useRef(null);

  // Update a single filter key (merges with existing)
  const setFilter = useCallback((key, value) => {
    const current = parseFilters(searchParams);
    const updated = { ...current, [key]: value };
    setSearchParams(filtersToParams(updated), { replace: true });
    setVisibleCount(LOAD_MORE_COUNT);
  }, [searchParams, setSearchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setVisibleCount(LOAD_MORE_COUNT);
  }, [setSearchParams]);

  const toggleArrayFilter = useCallback((key, item) => {
    const current = parseFilters(searchParams);
    const arr = current[key];
    const updated = arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
    setFilter(key, updated);
  }, [searchParams, setFilter]);

  // Fetch hotels from Firebase
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        let fetchedHotels = [];
        try {
          const q = query(collection(db, 'hotels'), where('isVisible', '==', true));
          const snapshot = await getDocs(q);
          fetchedHotels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch {
          const allSnapshot = await getDocs(collection(db, 'hotels'));
          fetchedHotels = allSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(h => h.isVisible !== false);
        }
        setHotels(fetchedHotels);
      } catch (error) {
        console.error('Error fetching hotels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  // Filtering + Sorting (memoized)
  const filteredAndSorted = useMemo(() => {
    let result = [...hotels];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(h =>
        h.name?.toLowerCase().includes(q) ||
        h.location?.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q)
      );
    }

    // Price range
    result = result.filter(h => {
      const price = Number(h.price) || 0;
      return price >= filters.priceMin && price <= filters.priceMax;
    });

    // Rating
    if (filters.minRating > 0) {
      result = result.filter(h => (Number(h.rating) || 0) >= filters.minRating);
    }

    // Property types
    if (filters.propertyTypes.length > 0) {
      result = result.filter(h => {
        const types = h.hotelType || [];
        const category = h.category || '';
        return filters.propertyTypes.some(t => types.includes(t) || category === t);
      });
    }

    // Amenities
    if (filters.amenities.length > 0) {
      result = result.filter(h => {
        const hAmenities = h.amenities || [];
        return filters.amenities.every(a => hAmenities.includes(a));
      });
    }

    // Meal plan
    if (filters.mealPlan) {
      result = result.filter(h =>
        h.mealPlan === filters.mealPlan ||
        (filters.mealPlan === 'Breakfast Included' && (h.amenities || []).includes('Breakfast Included'))
      );
    }

    // Free cancellation
    if (filters.freeCancellation) {
      result = result.filter(h => h.freeCancellation === true);
    }

    // Sort
    switch (filters.sort) {
      case 'price-low':
        result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'rating':
        result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case 'newest':
        result.sort((a, b) => {
          const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const db2 = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return db2 - da;
        });
        break;
      default:
        break;
    }

    return result;
  }, [hotels, filters]);

  const visibleHotels = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;
  const activeFilterCount = countActiveFilters(filters);

  const toggleCompare = (hotel) => {
    setCompareList(prev => {
      if (prev.find(h => h.id === hotel.id)) return prev.filter(h => h.id !== hotel.id);
      if (prev.length >= 3) return prev;
      return [...prev, hotel];
    });
  };

  // Build active filter pills for the top bar
  const activeFilterPills = useMemo(() => {
    const pills = [];
    if (filters.search) pills.push({ label: `"${filters.search}"`, clear: () => setFilter('search', '') });
    if (filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) {
      pills.push({ label: `₹${filters.priceMin.toLocaleString()} - ₹${filters.priceMax.toLocaleString()}`, clear: () => { setFilter('priceMin', PRICE_MIN); setFilter('priceMax', PRICE_MAX); } });
    }
    if (filters.minRating > 0) pills.push({ label: `${filters.minRating}+ Stars`, clear: () => setFilter('minRating', 0) });
    filters.propertyTypes.forEach(t => pills.push({ label: t, clear: () => toggleArrayFilter('propertyTypes', t) }));
    filters.amenities.forEach(a => pills.push({ label: a, clear: () => toggleArrayFilter('amenities', a) }));
    if (filters.mealPlan) pills.push({ label: filters.mealPlan, clear: () => setFilter('mealPlan', '') });
    if (filters.freeCancellation) pills.push({ label: 'Free Cancellation', clear: () => setFilter('freeCancellation', false) });
    return pills;
  }, [filters, setFilter, toggleArrayFilter]);

  // --- Sidebar Content (shared between desktop sidebar and mobile sheet) ---
  const SidebarContent = () => (
    <div className="space-y-0">
      {/* Search */}
      <FilterSection title="Search">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Hotel name, city..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => setFilter('priceMin', Math.max(PRICE_MIN, Number(e.target.value) || PRICE_MIN))}
                min={PRICE_MIN}
                max={filters.priceMax}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
            </div>
            <span className="text-zinc-600 text-xs">to</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => setFilter('priceMax', Math.min(PRICE_MAX, Number(e.target.value) || PRICE_MAX))}
                min={filters.priceMin}
                max={PRICE_MAX}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
            </div>
          </div>
          {/* Dual range slider */}
          <div className="relative h-1.5 bg-white/10 rounded-full mt-2">
            <div
              className="absolute h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              style={{
                left: `${((filters.priceMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
                right: `${100 - ((filters.priceMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={500}
              value={filters.priceMin}
              onChange={(e) => setFilter('priceMin', Math.min(Number(e.target.value), filters.priceMax - 500))}
              className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={500}
              value={filters.priceMax}
              onChange={(e) => setFilter('priceMax', Math.max(Number(e.target.value), filters.priceMin + 500))}
              className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>₹{PRICE_MIN.toLocaleString()}</span>
            <span>₹{PRICE_MAX.toLocaleString()}</span>
          </div>
        </div>
      </FilterSection>

      {/* Star / Guest Rating */}
      <FilterSection title="Guest Rating">
        <div className="flex gap-2">
          {RATING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter('minRating', filters.minRating === opt.value ? 0 : opt.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                filters.minRating === opt.value
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Star size={12} className={filters.minRating === opt.value ? 'fill-orange-400 text-orange-400' : 'text-zinc-500'} />
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Property Type */}
      <FilterSection title="Property Type">
        <div className="space-y-2">
          {PROPERTY_TYPES.map(type => {
            const active = filters.propertyTypes.includes(type);
            return (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => toggleArrayFilter('propertyTypes', type)}
                  className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
                    active
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-white/20 bg-white/5 group-hover:border-white/40'
                  }`}
                  style={{ width: 18, height: 18 }}
                >
                  {active && <Check size={12} className="text-white" />}
                </div>
                <span className={`text-sm transition-colors ${active ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {type}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Amenities */}
      <FilterSection title="Amenities">
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES_LIST.map(({ key, label, icon: Icon }) => {
            const active = filters.amenities.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleArrayFilter('amenities', key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  active
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Meal Plan */}
      <FilterSection title="Meal Plan">
        <div className="space-y-2">
          {MEAL_PLANS.map(plan => {
            const active = filters.mealPlan === plan;
            return (
              <label key={plan} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setFilter('mealPlan', active ? '' : plan)}
                  className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? 'border-orange-500 bg-orange-500'
                      : 'border-white/20 bg-transparent group-hover:border-white/40'
                  }`}
                >
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm transition-colors ${active ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {plan}
                </span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Free Cancellation */}
      <FilterSection title="Cancellation Policy">
        <button
          onClick={() => setFilter('freeCancellation', !filters.freeCancellation)}
          className="flex items-center gap-3 w-full"
        >
          <div className={`relative w-10 h-5.5 rounded-full transition-colors ${filters.freeCancellation ? 'bg-orange-500' : 'bg-white/10'}`}
            style={{ width: 40, height: 22 }}
          >
            <div
              className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform ${filters.freeCancellation ? 'translate-x-5' : 'translate-x-0.5'}`}
              style={{ width: 18, height: 18, transform: filters.freeCancellation ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </div>
          <span className={`text-sm ${filters.freeCancellation ? 'text-white font-medium' : 'text-zinc-400'}`}>
            Free Cancellation
          </span>
        </button>
      </FilterSection>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors mt-2"
        >
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SEO title="Browse All Hotels | Infinite Yatra" description="Discover and compare verified hotels, resorts, homestays and villas across India. Filter by price, rating, amenities and more." />

      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-blue-900/30 to-[#0a0a0a] pt-28 pb-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/hotels" className="hover:text-white transition-colors">Hotels</Link>
            <ChevronRight size={12} />
            <span className="text-orange-500">All Hotels</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">
            Browse All Hotels
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Curated hotels, homestays, and resorts across India -- verified for quality, safety, and comfort.
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/my-hotel-bookings" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/10 transition-colors">
              My Bookings
            </Link>
            <Link to="/hotels/compare" className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors">
              Compare Hotels
            </Link>
          </div>
        </div>
      </div>

      {/* Top Bar: Results count + Sort + View + Filter pills */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 max-w-7xl py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: results count + mobile filter btn */}
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors relative"
              >
                <SlidersHorizontal size={15} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-sm text-zinc-500">
                <strong className="text-white">{filteredAndSorted.length}</strong> propert{filteredAndSorted.length !== 1 ? 'ies' : 'y'} found
              </span>
            </div>

            {/* Right: Sort + View toggle */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-9 text-sm text-white font-medium focus:outline-none focus:ring-1 focus:ring-orange-500/50 cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900">{opt.label}</option>
                  ))}
                </select>
                <ArrowUpDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFilter('view', 'grid')}
                  className={`p-2 transition-colors ${filters.view === 'grid' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                  title="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setFilter('view', 'list')}
                  className={`p-2 transition-colors ${filters.view === 'list' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-white'}`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterPills.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              {activeFilterPills.map((pill, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs font-medium whitespace-nowrap shrink-0"
                >
                  {pill.label}
                  <button onClick={pill.clear} className="hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-400 hover:text-red-300 font-medium whitespace-nowrap shrink-0 ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside ref={sidebarRef} className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-[72px] bg-[#111] rounded-2xl border border-white/5 p-5 max-h-[calc(100vh-90px)] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className={`grid gap-6 ${filters.view === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white/5 rounded-2xl overflow-hidden animate-pulse">
                    <div className={`${filters.view === 'list' ? 'h-40' : 'h-56'} bg-zinc-800`} />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-zinc-800 rounded w-3/4" />
                      <div className="h-4 bg-zinc-800 rounded w-1/2" />
                      <div className="h-4 bg-zinc-800 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSorted.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Search size={36} className="text-zinc-600" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No hotels match your filters</h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Try adjusting your search criteria or clearing some filters to see more results.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Clear All Filters
                  </button>
                  <a
                    href="https://wa.me/919265799325?text=Hi%2C%20I%20am%20looking%20for%20a%20hotel%20on%20Infinite%20Yatra."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/15 text-green-400 border border-green-500/30 rounded-xl font-semibold hover:bg-green-500/25 transition-colors"
                  >
                    <MessageCircle size={18} /> WhatsApp Us
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Hotel Grid / List */}
                <div className={`grid gap-6 ${
                  filters.view === 'list'
                    ? 'grid-cols-1'
                    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                }`}>
                  {visibleHotels.map((hotel, idx) => (
                    <motion.div
                      key={hotel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.35 }}
                      className="relative"
                    >
                      {/* Compare checkbox overlay */}
                      <div
                        className="absolute top-3 left-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="flex items-center gap-2 cursor-pointer bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-white/10 hover:border-white/30 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!compareList.find(c => c.id === hotel.id)}
                            onChange={() => toggleCompare(hotel)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            compareList.find(c => c.id === hotel.id)
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-white/30 bg-white/10'
                          }`}>
                            {compareList.find(c => c.id === hotel.id) && <Check size={10} className="text-white" />}
                          </div>
                          <span className="text-[11px] font-medium text-white/80">Compare</span>
                        </label>
                      </div>

                      {filters.view === 'list' ? (
                        /* List View Card */
                        <Link
                          to={`/hotels/${hotel.id}`}
                          className="group flex bg-[#111] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5"
                        >
                          <div className="relative w-72 shrink-0 overflow-hidden">
                            <img
                              src={hotel.image || hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'}
                              alt={hotel.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
                            {hotel.rating && (
                              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold border border-white/10">
                                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-white">{hotel.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  {hotel.category && (
                                    <span className="inline-block text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 mb-2 uppercase tracking-wider">
                                      {hotel.category}
                                    </span>
                                  )}
                                  <h3 className="text-lg font-bold text-white leading-tight line-clamp-1">{hotel.name}</h3>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-zinc-400 text-sm mb-3">
                                <MapPin size={13} className="text-orange-400 shrink-0" />
                                <span className="line-clamp-1">{hotel.location || hotel.city}</span>
                              </div>
                              {hotel.amenities && hotel.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {hotel.amenities.slice(0, 5).map((amenity, i) => (
                                    <span key={i} className="text-[11px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                                      {amenity}
                                    </span>
                                  ))}
                                  {hotel.amenities.length > 5 && (
                                    <span className="text-[11px] text-zinc-600">+{hotel.amenities.length - 5} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-end justify-between pt-3 border-t border-white/5 mt-3">
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Starts from</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-white">₹{Number(hotel.price || 0).toLocaleString()}</span>
                                  <span className="text-sm text-zinc-500">/night</span>
                                </div>
                              </div>
                              <span className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                                View Details
                              </span>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        /* Grid View - use HotelCard */
                        <HotelCard
                          id={hotel.id}
                          slug={hotel.slug}
                          name={hotel.name}
                          city={hotel.city}
                          location={hotel.location}
                          rating={hotel.rating}
                          price={hotel.price}
                          image={hotel.image}
                          imageUrl={hotel.imageUrl}
                          amenities={hotel.amenities}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                      className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      Load More ({filteredAndSorted.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 lg:hidden"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] rounded-t-3xl max-h-[85vh] overflow-hidden lg:hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-5">
                <SidebarContent />
              </div>
              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-zinc-400 border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Show {filteredAndSorted.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-5 py-3.5 shadow-2xl shadow-purple-500/10 flex items-center gap-4 max-w-[90vw]"
          >
            <div className="flex items-center gap-2">
              {compareList.map(h => (
                <div key={h.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-sm text-white font-medium truncate max-w-[100px]">{h.name?.split(' ').slice(0, 2).join(' ')}</span>
                  <button onClick={() => toggleCompare(h)} className="text-zinc-500 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              disabled={compareList.length < 2}
              onClick={() => navigate(`/hotels/compare?ids=${compareList.map(h => h.id).join(',')}`)}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:from-purple-600 hover:to-blue-700 shadow-lg shadow-purple-500/25 transition-all whitespace-nowrap"
            >
              Compare ({compareList.length})
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AllHotels;
