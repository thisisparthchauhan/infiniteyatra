import React, { useState, useEffect, Suspense } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Lazy-import react-simple-maps pieces
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const MapTooltip = ({ pkg, pos }) => {
  if (!pkg) return null;
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: pos.x + 16,
        top: pos.y - 80,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(124,58,237,0.35)',
          minWidth: '200px',
          maxWidth: '240px',
        }}
      >
        {pkg.image && (
          <img
            src={pkg.image}
            alt={pkg.title}
            className="w-full object-cover"
            style={{ height: '80px' }}
          />
        )}
        <div className="p-3">
          <p className="text-white text-sm font-bold leading-tight">{pkg.title}</p>
          {pkg.location && <p className="text-gray-500 text-xs mt-0.5">{pkg.location}</p>}
          <p className="text-purple-400 text-xs font-semibold mt-1">
            {pkg.priceDisplay || `₹${(pkg.price || 0).toLocaleString('en-IN')}`}
          </p>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
};

// Mobile bottom sheet
const BottomSheet = ({ pkg, onClose }) => {
  const navigate = useNavigate();
  if (!pkg) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="rounded-t-3xl overflow-hidden"
        style={{ background: '#111', border: '1px solid #2a2a2a', maxHeight: '60vh' }}
        onClick={e => e.stopPropagation()}
      >
        {pkg.image && <img src={pkg.image} alt={pkg.title} className="w-full object-cover" style={{ height: '160px' }} />}
        <div className="p-5">
          <h3 className="text-white text-lg font-bold">{pkg.title}</h3>
          {pkg.location && <p className="text-gray-500 text-sm mt-1">{pkg.location}</p>}
          <p className="text-purple-400 font-semibold mt-2">{pkg.priceDisplay || `₹${(pkg.price || 0).toLocaleString('en-IN')}`}</p>
          <button
            className="w-full mt-4 text-white font-semibold py-3 rounded-full"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
            onClick={() => navigate(`/package/${pkg.id}`)}
          >
            View Package →
          </button>
        </div>
      </div>
    </div>
  );
};

const WorldMapView = () => {
  const [packages, setPackages] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mobileSheet, setMobileSheet] = useState(null);
  const [zoom, setZoom] = useState(1.2);
  const [center, setCenter] = useState([20, 10]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const fetchPkgs = async () => {
      try {
        const snap = await getDocs(collection(db, 'packages'));
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data(), priceDisplay: `₹${(d.data().price || 0).toLocaleString('en-IN')}` }))
          .filter(p => p.lat && p.lng && p.isActive !== false);
        setPackages(docs);
      } catch (err) {
        console.log('WorldMap fetch error:', err.message);
      }
    };
    fetchPkgs();
  }, []);

  const withMarkers = packages.filter(p => p.lat && p.lng);

  return (
    <section style={{ background: '#0a0a0a', padding: '12px 0 32px' }}>
      <div className="container mx-auto px-4 md:px-8">
        {/* Map header */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}
          >
            <MapPin size={13} />
            📍 {withMarkers.length} Destination{withMarkers.length !== 1 ? 's' : ''} Worldwide
          </div>
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.4, 6))}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.4, 0.8))}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => { setZoom(1.2); setCenter([20, 10]); }}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              title="Reset View"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Map container */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            height: isMobile ? '60vh' : '65vh',
            background: '#0d1117',
            border: '1px solid #1a1a1a',
          }}
        >
          <ComposableMap
            projection="geoMercator"
            style={{ width: '100%', height: '100%', background: '#0d1117' }}
          >
            <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z); }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: { fill: '#1a1a1a', stroke: '#2d2d2d', strokeWidth: 0.5, outline: 'none' },
                        hover: { fill: '#252525', stroke: '#3d3d3d', strokeWidth: 0.5, outline: 'none' },
                        pressed: { fill: '#1a1a1a', outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {withMarkers.map(pkg => (
                <Marker
                  key={pkg.id}
                  coordinates={[pkg.lng, pkg.lat]}
                  onMouseEnter={e => {
                    if (!isMobile) {
                      setTooltip(pkg);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseMove={e => {
                    if (!isMobile) setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => {
                    if (isMobile) setMobileSheet(pkg);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={6}
                    fill="#7C3AED"
                    stroke="#fff"
                    strokeWidth={1.5}
                    style={{
                      animation: 'pulse 2s ease-in-out infinite',
                      cursor: 'pointer',
                    }}
                  />
                  <style>{`
                    @keyframes pulse {
                      0%, 100% { opacity: 1; r: 6; }
                      50% { opacity: 0.7; r: 8; }
                    }
                  `}</style>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>

          {withMarkers.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-gray-600 text-sm">No packages with location data found.</p>
              <p className="text-gray-700 text-xs mt-1">Add lat/lng fields to your packages in the admin panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip (desktop) */}
      {tooltip && !isMobile && <MapTooltip pkg={tooltip} pos={tooltipPos} />}

      {/* Bottom sheet (mobile) */}
      {mobileSheet && isMobile && <BottomSheet pkg={mobileSheet} onClose={() => setMobileSheet(null)} />}
    </section>
  );
};

export default WorldMapView;
