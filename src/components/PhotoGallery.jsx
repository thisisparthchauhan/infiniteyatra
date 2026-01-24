import { useState } from 'react';
import './PhotoGallery.css';

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
    useState(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen]);

    return (
        <div className="photo-gallery">
            <div className="gallery-grid">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="gallery-item"
                        onClick={() => openLightbox(index)}
                    >
                        <img src={image.url} alt={image.alt} loading="lazy" />
                        <div className="gallery-overlay">
                            <span className="view-icon">🔍</span>
                        </div>
                    </div>
                ))}
            </div>

            {lightboxOpen && (
                <div className="lightbox" onClick={closeLightbox}>
                    <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                        ‹
                    </button>

                    <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                        ›
                    </button>

                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            ✕
                        </button>

                        <img
                            src={images[currentImageIndex].url}
                            alt={images[currentImageIndex].alt}
                            className="lightbox-image"
                        />

                        <div className="lightbox-counter">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoGallery;
