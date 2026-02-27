'use client';
// Re-export Framer Motion for use in client components
// This file acts as the boundary — server components never import directly from 'framer-motion'
export {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useInView,
    useAnimation,
    type HTMLMotionProps,
    type Variants,
} from 'framer-motion';

// Convenience wrappers
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function FadeIn({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function SlideIn({
    children,
    direction = 'left',
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    direction?: 'left' | 'right' | 'up' | 'down';
    delay?: number;
    className?: string;
}) {
    const initial = {
        left: { opacity: 0, x: -40 },
        right: { opacity: 0, x: 40 },
        up: { opacity: 0, y: 40 },
        down: { opacity: 0, y: -40 },
    }[direction];

    return (
        <motion.div
            initial={initial}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function ScaleIn({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
