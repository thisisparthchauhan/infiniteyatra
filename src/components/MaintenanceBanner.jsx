import React, { useState } from 'react';
import { X, Sparkles, Hammer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const MaintenanceBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-blue-900 via-slate-900 to-blue-900 text-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-white/5 pattern-grid-lg opacity-10"></div>

                <div className="container mx-auto px-4 py-3 relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm md:text-base">
                        <div className="p-2 bg-white/10 rounded-full animate-pulse">
                            <Hammer size={16} className="text-yellow-400" />
                        </div>
                        <p>
                            <span className="font-bold text-yellow-400">Under Active Development:</span>
                            {' '}We're currently upgrading your experience! You might see some changes as we polish our new features.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={18} className="text-slate-400 hover:text-white" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MaintenanceBanner;
