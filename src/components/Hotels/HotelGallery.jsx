import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, Grid3X3 } from 'lucide-react';

const HotelGallery = ({ images = [], hotelName = '', isOpen, onClose, startIndex = 0 }) => {
    const [current, setCurrent] = useState(startIndex);
    const [showGrid, setShowGrid] = useState(false);
    const [zoomed, setZoomed] = useState(false);
    const [touchStart, setTouchStart] = useState(null);

    // Deduplicate images
    const allImages = [...new Set(images.filter(Boolean))];
    if (allImages.length === 0) return null;

    const goTo = useCallback((idx) => {
        setCurrent(idx);
        setZoomed(false);
    }, []);

    const next = useCallback(() => goTo((current + 1) % allImages.length), [current, allImages.length, goTo]);
    const prev = useCallback(() => goTo((current - 1 + allImages.length) % allImages.length), [current, allImages.length, goTo]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'g') setShowGrid(g => !g);
        };
        window.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, next, prev, onClose]);

    // Sync startIndex
    useEffect(() => { setCurrent(startIndex); }, [startIndex]);

    // Touch gestures
    const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? next() : prev();
        }
        setTouchStart(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <h3 className="text-white font-bold text-lg">{hotelName}</h3>
                    <span className="text-sm text-zinc-500">{current + 1} / {allImages.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-white/20 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                        title="Grid view (G)"
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        onClick={() => setZoomed(!zoomed)}
                        className={`p-2 rounded-lg transition-colors ${zoomed ? 'bg-white/20 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                        title="Zoom"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <a
                        href={allImages[current]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                        title="Open original"
                    >
                        <Download size={18} />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors ml-2"
                        title="Close (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {showGrid ? (
                /* Grid View */
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => { goTo(idx); setShowGrid(false); }}
                                className={`relative aspect-[4/3] rounded-xl overflow-hidden group ${current === idx ? 'ring-2 ring-orange-500' : ''}`}
                            >
                                <img src={img} alt={`${hotelName} ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full transition-opacity">{idx + 1}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* Single Image View */
                <div
                    className="flex-1 flex items-center justify-center relative select-none"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Prev Button */}
                    <button
                        onClick={prev}
                        className="absolute left-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Image */}
                    <div className={`max-w-[90vw] max-h-[80vh] transition-transform duration-500 ${zoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'}`} onClick={() => setZoomed(!zoomed)}>
                        <img
                            key={current}
                            src={allImages[current]}
                            alt={`${hotelName} ${current + 1}`}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                            style={{ animation: 'fadeIn 0.3s ease-out' }}
                        />
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={next}
                        className="absolute right-4 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {/* Bottom Thumbnail Strip */}
            {!showGrid && (
                <div className="px-6 py-3 border-t border-white/10 overflow-x-auto">
                    <div className="flex gap-2 justify-center">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${current === idx ? 'ring-2 ring-orange-500 opacity-100 scale-110' : 'opacity-40 hover:opacity-80'}`}
                            >
                                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

export default HotelGallery;
