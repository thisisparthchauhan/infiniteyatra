import React from 'react';
import { Grid3X3, Map } from 'lucide-react';

const SEASONS = [
  { key: 'all', label: 'All', icon: '🌸' },
  { key: 'summer', label: 'Summer', icon: '☀️' },
  { key: 'monsoon', label: 'Monsoon', icon: '🌧️' },
  { key: 'winter', label: 'Winter', icon: '❄️' },
  { key: 'autumn', label: 'Autumn', icon: '🍂' },
];

const SeasonFilterStrip = ({ activeSeason, setActiveSeason, viewMode, setViewMode }) => {
  return (
    <div
      className="w-full z-40"
      style={{
        position: 'sticky',
        top: '64px',
        background: '#0d0d0d',
        borderBottom: '1px solid #1a1a1a',
      }}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between gap-4 py-3">
        {/* Season Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0 pb-1 md:pb-0">
          {SEASONS.map((season) => {
            const isActive = activeSeason === season.key;
            return (
              <button
                key={season.key}
                onClick={() => setActiveSeason(season.key)}
                className="flex-shrink-0 flex items-center gap-1.5 font-medium text-sm rounded-full transition-all duration-200 whitespace-nowrap"
                style={{
                  padding: '8px 18px',
                  background: isActive
                    ? 'linear-gradient(135deg, #7C3AED, #2563EB)'
                    : '#1a1a1a',
                  color: isActive ? '#fff' : '#888',
                  border: isActive ? 'none' : '1px solid #2a2a2a',
                }}
              >
                <span>{season.icon}</span>
                <span>{season.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Toggle */}
        <div
          className="flex items-center gap-1 flex-shrink-0 rounded-full p-1"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <button
            onClick={() => setViewMode('grid')}
            className="rounded-full p-2 transition-all duration-200"
            title="Grid View"
            style={{
              background: viewMode === 'grid' ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : 'transparent',
              color: viewMode === 'grid' ? '#fff' : '#666',
            }}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className="rounded-full p-2 transition-all duration-200"
            title="Map View"
            style={{
              background: viewMode === 'map' ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : 'transparent',
              color: viewMode === 'map' ? '#fff' : '#666',
            }}
          >
            <Map size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonFilterStrip;
