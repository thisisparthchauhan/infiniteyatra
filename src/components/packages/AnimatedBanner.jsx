import React from 'react';
import './AnimatedBanner.css';

const AnimatedBanner = () => {
    return (
        <div className="animated-banner">
            {/* Background Layer - Single Brand Lettermark */}
            <div className="background-layer">
                <span className="bg-lettermark">iy</span>
            </div>

            {/* Foreground Layer - Sharp Focus Content */}
            <div className="foreground-layer">
                <div className="hero-content">
                    <h1 className="hero-text">Follow Your</h1>
                    <span className="heart-glow">❤️</span>
                </div>
            </div>
        </div>
    );
};

export default AnimatedBanner;
