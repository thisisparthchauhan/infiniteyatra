import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoGallery = ({ images }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!lightboxOpen) return;

        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    };

    // Add keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen]);

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="relative group cursor-pointer overflow-hidden rounded-xl shadow-md border border-white/5"
                        onClick={() => openLightbox(index)}
                    >
                        <img
                            src={image.url}
                            alt={image.alt}
                            loading="lazy"
                            className="w-full h-40 md:h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white text-2xl transform scale-75 group-hover:scale-100 transition-transform">🔍</span>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={closeLightbox}
                    >
                        <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="absolute -top-12 right-0 text-white hover:text-red-400 z-50 p-2 transition-colors"
                                onClick={closeLightbox}
                            >
                                <X size={32} />
                            </button>

                            <button
                                className="absolute left-0 md:-left-16 text-white hover:bg-white/10 rounded-full p-2 transition-colors z-50 bg-white/5 backdrop-blur-md border border-white/10"
                                onClick={prevImage}
                            >
                                <ChevronLeft size={40} />
                            </button>

                            <motion.img
                                key={currentImageIndex}
                                initial={{ opacity: 0.5, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={images[currentImageIndex].url}
                                alt={images[currentImageIndex].alt}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                            />

                            <button
                                className="absolute right-0 md:-right-16 text-white hover:bg-white/10 rounded-full p-2 transition-colors z-50 bg-white/5 backdrop-blur-md border border-white/10"
                                onClick={nextImage}
                            >
                                <ChevronRight size={40} />
                            </button>

                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-medium px-4 py-2 bg-slate-900/50 rounded-full backdrop-blur-md border border-white/10">
                                {currentImageIndex + 1} / {images.length}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PhotoGallery;
