import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const LazyImage = ({ src, alt, className = '', containerClassName = '', ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '150px 0px', // start loading slightly before it comes into view
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={imgRef} className={`relative overflow-hidden ${containerClassName}`}>
            {/* Skeleton / Placeholder */}
            {(!isLoaded || !isInView) && !hasError && (
                <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-zinc-700/50" />
                </div>
            )}
            
            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-zinc-600">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-[10px] uppercase tracking-wider">Image Unavailable</span>
                </div>
            )}

            {/* Actual Image */}
            {isInView && !hasError && (
                <img
                    src={src}
                    alt={alt}
                    className={`
                        w-full h-full object-cover
                        transition-opacity duration-700 ease-in-out
                        ${isLoaded ? 'opacity-100' : 'opacity-0'}
                        ${className}
                    `}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        setHasError(true);
                        setIsLoaded(true); // stop skeleton
                    }}
                    {...props}
                />
            )}
        </div>
    );
};

export default LazyImage;
