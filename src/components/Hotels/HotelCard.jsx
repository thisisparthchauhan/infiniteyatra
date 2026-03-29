import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Star,
  Wifi,
  Coffee,
  Heart,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  Users,
  Sparkles,
  XCircle,
  BadgeCheck,
  Building2,
  Home,
  TreePine,
  Hotel,
  BedDouble,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80';

const BADGE_STYLES = {
  Bestseller: { bg: 'bg-orange-500/90', icon: Flame },
  New: { bg: 'bg-emerald-500/90', icon: Sparkles },
  'Eco-Friendly': { bg: 'bg-green-600/90', icon: Leaf },
  'Couple Friendly': { bg: 'bg-pink-500/90', icon: Heart },
  'Family Friendly': { bg: 'bg-blue-500/90', icon: Users },
  Premium: { bg: 'bg-amber-500/90', icon: BadgeCheck },
};

const PROPERTY_ICONS = {
  Hotel: Hotel,
  Resort: TreePine,
  Homestay: Home,
  Villa: Building2,
  Hostel: BedDouble,
};

function getRatingLabel(rating) {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  return 'Fair';
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('en-IN');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Dot indicators for image carousel */
const DotIndicators = ({ total, current, onDotClick }) => {
  if (total <= 1) return null;
  // Show max 5 dots, centred around current
  const maxDots = 5;
  let start = Math.max(0, current - Math.floor(maxDots / 2));
  let end = Math.min(total, start + maxDots);
  if (end - start < maxDots) start = Math.max(0, end - maxDots);
  const dots = [];
  for (let i = start; i < end; i++) dots.push(i);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
      {dots.map((idx) => (
        <button
          key={idx}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDotClick(idx);
          }}
          className={`rounded-full transition-all duration-300 ${
            idx === current
              ? 'w-2.5 h-2.5 bg-white shadow-lg shadow-white/30'
              : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
          }`}
          aria-label={`Go to image ${idx + 1}`}
        />
      ))}
    </div>
  );
};

/** Navigation arrow button */
const NavArrow = ({ direction, onClick }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={`absolute top-1/2 -translate-y-1/2 ${
      direction === 'left' ? 'left-2' : 'right-2'
    } z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10
    flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70
    opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110`}
    aria-label={direction === 'left' ? 'Previous image' : 'Next image'}
  >
    {direction === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
  </button>
);

/** Heart/save button */
const SaveButton = ({ saved, onToggle }) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }}
    className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md
      border border-white/10 flex items-center justify-center
      hover:scale-110 active:scale-95 transition-all duration-200"
    aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
  >
    <Heart
      size={18}
      className={`transition-colors duration-300 ${
        saved ? 'text-red-500 fill-red-500' : 'text-white/80 hover:text-red-400'
      }`}
    />
  </button>
);

/** Badge pill on top-left */
const BadgePill = ({ label, index }) => {
  const config = BADGE_STYLES[label] || { bg: 'bg-white/20', icon: Sparkles };
  const Icon = config.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${config.bg} backdrop-blur-md text-white text-[10px] font-semibold
        px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-lg`}
    >
      <Icon size={10} />
      {label}
    </motion.div>
  );
};

/** Highlight pill (Free WiFi, etc.) */
const HighlightPill = ({ label }) => {
  const iconMap = {
    'Free WiFi': Wifi,
    'Free Cancellation': XCircle,
    'Breakfast Included': Coffee,
  };
  const Icon = iconMap[label] || Sparkles;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
      bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-medium whitespace-nowrap">
      <Icon size={10} className="text-orange-400/80" />
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main HotelCard component
// ---------------------------------------------------------------------------

const HotelCard = ({
  id,
  slug,
  name,
  city,
  location,
  rating,
  price,
  originalPrice,
  image,
  imageUrl,
  images,
  amenities,
  category,
  badges,
  hotelType,
  rooms,
  reviewCount,
  highlights,
  isVisible = true,
}) => {
  // --- Wishlist ---
  let wishlistCtx = null;
  try {
    wishlistCtx = useWishlist();
  } catch {
    // WishlistProvider may not be mounted; fall back to local state
  }
  const [localSaved, setLocalSaved] = useState(false);
  const isSaved = wishlistCtx ? wishlistCtx.isInWishlist(id) : localSaved;

  const handleToggleSave = useCallback(() => {
    if (wishlistCtx) {
      wishlistCtx.toggleWishlist({ id, title: name, name, image: image || imageUrl });
    } else {
      setLocalSaved((p) => !p);
    }
  }, [wishlistCtx, id, name, image, imageUrl]);

  // --- Image carousel ---
  const allImages = (images && images.length > 0)
    ? images
    : [image || imageUrl || FALLBACK_IMAGE];
  const [currentImg, setCurrentImg] = useState(0);
  const touchStartX = useRef(null);

  const nextImage = useCallback(() => {
    setCurrentImg((p) => (p + 1) % allImages.length);
  }, [allImages.length]);
  const prevImage = useCallback(() => {
    setCurrentImg((p) => (p - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextImage() : prevImage();
    }
    touchStartX.current = null;
  };

  // --- Derived data ---
  const badgeList = badges || hotelType || [];
  const propertyType = category || (hotelType && hotelType[0]) || 'Hotel';
  const PropertyIcon = PROPERTY_ICONS[propertyType] || Hotel;
  const highlightList = highlights || amenities || [];
  const numericRating = parseFloat(rating) || 0;
  const hasDiscount = originalPrice && Number(originalPrice) > Number(price);
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const lowRooms = typeof rooms === 'number' && rooms > 0 && rooms <= 5;
  const detailPath = slug ? `/hotels/${slug}` : `/hotels/${id}`;

  // --- Visibility animation ---
  if (!isVisible) return null;

  return (
    <Link to={detailPath} className="block outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={{ y: -6 }}
        className="group relative bg-[#111] rounded-2xl overflow-hidden shadow-xl
          border border-white/[0.06] hover:border-white/15
          transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/5"
      >
        {/* -------- IMAGE SECTION -------- */}
        <div
          className="relative h-56 sm:h-64 w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Images with crossfade */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImg}
              src={allImages[currentImg]}
              alt={`${name} - photo ${currentImg + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </AnimatePresence>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 pointer-events-none" />

          {/* Nav arrows (shown on hover) */}
          {allImages.length > 1 && (
            <>
              <NavArrow direction="left" onClick={prevImage} />
              <NavArrow direction="right" onClick={nextImage} />
            </>
          )}

          {/* Dot indicators */}
          <DotIndicators total={allImages.length} current={currentImg} onDotClick={setCurrentImg} />

          {/* Save button */}
          <SaveButton saved={isSaved} onToggle={handleToggleSave} />

          {/* Badges - top left */}
          {badgeList.length > 0 && (
            <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
              {badgeList.slice(0, 3).map((badge, i) => (
                <BadgePill key={badge} label={badge} index={i} />
              ))}
            </div>
          )}

          {/* Discount tag */}
          {hasDiscount && discountPct > 0 && (
            <div className="absolute bottom-3 left-3 z-10 bg-emerald-500/90 backdrop-blur-md
              text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
              {discountPct}% OFF
            </div>
          )}
        </div>

        {/* -------- CONTENT SECTION -------- */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Top row: name + rating */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] sm:text-base font-bold text-white truncate leading-tight">
                {name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-orange-400 shrink-0" />
                <span className="text-xs text-zinc-500 truncate">{location || city}</span>
              </div>
            </div>

            {/* Rating badge */}
            {numericRating > 0 && (
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20
                  px-2 py-1 rounded-lg">
                  <Star size={12} className="text-orange-400 fill-orange-400" />
                  <span className="text-sm font-bold text-orange-400">{numericRating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {getRatingLabel(numericRating)}
                  </span>
                  {reviewCount && (
                    <span className="text-[10px] text-zinc-600">
                      ({reviewCount})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Property type tag */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
              bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
              <PropertyIcon size={10} />
              {propertyType}
            </span>
          </div>

          {/* Highlight pills */}
          {highlightList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {highlightList.slice(0, 4).map((h) => (
                <HighlightPill key={h} label={h} />
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Price row + scarcity */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold">
                per night
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                {hasDiscount && (
                  <span className="text-sm text-zinc-600 line-through">
                    ₹{formatPrice(originalPrice)}
                  </span>
                )}
                <span className="text-xl font-bold text-white">
                  ₹{formatPrice(price)}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600">+ taxes & fees</span>
            </div>

            <div className="flex flex-col items-end gap-1">
              {/* Scarcity */}
              {lowRooms && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20
                    px-2 py-0.5 rounded-full whitespace-nowrap"
                >
                  Only {rooms} room{rooms > 1 ? 's' : ''} left!
                </motion.span>
              )}

              {/* CTA */}
              <span
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold
                  bg-gradient-to-r from-orange-500 to-amber-500 text-white
                  shadow-lg shadow-orange-500/20
                  group-hover:from-orange-600 group-hover:to-amber-600
                  group-hover:shadow-orange-500/30
                  transition-all duration-300"
              >
                View Details
              </span>
            </div>
          </div>
        </div>

        {/* Quick-view shimmer on hover */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0
            group-hover:opacity-100 transition-opacity duration-500
            bg-gradient-to-tr from-orange-500/[0.02] via-transparent to-amber-500/[0.02]"
        />
      </motion.article>
    </Link>
  );
};

export default HotelCard;
