/**
 * Lightweight analytics wrapper around Firebase Analytics.
 *
 * - Loads Firebase Analytics lazily (first event call triggers the import)
 * - Safe to call before init: events are queued and flushed once the SDK
 *   resolves, so we never lose the first page_view
 * - No-op on SSR (no `window`)
 * - Catches all errors silently — analytics must never crash the app
 *
 * Usage:
 *   import { trackEvent, trackPageView } from '../utils/analytics';
 *
 *   trackPageView('/future', 'Infinite Yatra Space Program');
 *   trackEvent('waitlist_submit', { source: 'hero' });
 */

import { getAnalyticsAsync } from '../firebase';

let analyticsPromise = null;
let logEventFn = null;
const queue = [];

const ensureAnalytics = () => {
    if (typeof window === 'undefined') return null; // SSR
    if (analyticsPromise) return analyticsPromise;

    analyticsPromise = (async () => {
        try {
            const analytics = await getAnalyticsAsync();
            const { logEvent } = await import('firebase/analytics');
            logEventFn = (name, params) => logEvent(analytics, name, params);
            // Flush any queued events
            while (queue.length) {
                const [name, params] = queue.shift();
                try { logEventFn(name, params); } catch { /* silent */ }
            }
            return analytics;
        } catch (err) {
            // Most common cause: ad blocker or local dev env without analytics enabled
            return null;
        }
    })();

    return analyticsPromise;
};

export const trackEvent = (name, params = {}) => {
    if (typeof window === 'undefined') return;
    try {
        if (logEventFn) {
            logEventFn(name, params);
        } else {
            queue.push([name, params]);
            ensureAnalytics();
        }
    } catch {
        /* analytics must never crash the app */
    }
};

export const trackPageView = (path, title) => {
    trackEvent('page_view', {
        page_path: path,
        page_title: title,
        page_location: typeof window !== 'undefined' ? window.location.href : '',
    });
};

/**
 * Helper for one-shot scroll-depth milestones. Tracks 25/50/75/100% only
 * once each per page mount.
 */
export const createScrollDepthTracker = (pageName) => {
    const fired = new Set();
    return (percent) => {
        const milestones = [25, 50, 75, 100];
        for (const m of milestones) {
            if (percent >= m && !fired.has(m)) {
                fired.add(m);
                trackEvent('scroll_depth', {
                    page: pageName,
                    depth: m,
                });
            }
        }
    };
};
