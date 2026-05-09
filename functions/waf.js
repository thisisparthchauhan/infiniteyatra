/**
 * 🛡️ WEB APPLICATION FIREWALL (WAF) RULES
 * Input Validation, Rate Limiting, and Security Rules
 */

const validator = require('validator');
const rateLimit = require('express-rate-limit');

// ============= INPUT VALIDATION RULES =============

/**
 * Validate Email
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email.toLowerCase());
}

/**
 * Validate Payment Amount
 */
function validateAmount(amount) {
    if (!amount) return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 999999;
}

/**
 * Validate Booking Data
 */
function validateBookingData(data) {
    const errors = [];

    if (!data.packageId || !validator.isUUID(data.packageId)) {
        errors.push('Invalid package ID');
    }

    if (!data.guestCount || data.guestCount < 1 || data.guestCount > 100) {
        errors.push('Guest count must be between 1 and 100');
    }

    if (!data.startDate || !validator.isISO8601(data.startDate)) {
        errors.push('Invalid start date');
    }

    if (!data.email || !validateEmail(data.email)) {
        errors.push('Invalid email address');
    }

    if (!data.phone || !validator.isMobilePhone(data.phone)) {
        errors.push('Invalid phone number');
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
    };
}

/**
 * Validate User Input (XSS Prevention)
 */
function sanitizeUserInput(input) {
    if (typeof input !== 'string') return input;

    // Remove potentially dangerous characters
    return validator.escape(input)
        .trim()
        .substring(0, 1000); // Limit string length
}

/**
 * Validate SQL Injection Attempts
 */
function detectSQLInjection(input) {
    const sqlPatterns = [
        /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b)/gi,
        /(\-\-|;|\*|\/\*|\*\/)/g,
        /(\bor\b.*=.*|\band\b.*=.*)/gi,
    ];

    if (typeof input !== 'string') return false;

    for (let pattern of sqlPatterns) {
        if (pattern.test(input)) {
            return true; // Potential SQL injection detected
        }
    }
    return false;
}

/**
 * Validate File Upload
 */
function validateFileUpload(file) {
    const errors = [];
    
    // Allowed MIME types
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;

    if (!file) {
        errors.push('No file provided');
    }

    if (!allowedMimes.includes(file?.mimetype)) {
        errors.push('File type not allowed');
    }

    if (file?.size > maxSize) {
        errors.push('File size exceeds 10MB limit');
    }

    // Check filename for dangerous characters
    if (!/^[a-zA-Z0-9._-]+$/.test(file?.originalname)) {
        errors.push('Invalid filename format');
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
    };
}

// ============= WAF MIDDLEWARE =============

/**
 * Comprehensive Input Validation Middleware
 */
function inputValidationMiddleware(req, res, next) {
    try {
        // Validate query parameters
        Object.keys(req.query).forEach(key => {
            if (detectSQLInjection(req.query[key])) {
                return res.status(400).json({
                    error: 'Invalid input detected',
                    details: 'Request contains potentially malicious content',
                });
            }
            req.query[key] = sanitizeUserInput(req.query[key]);
        });

        // Validate body parameters
        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    if (detectSQLInjection(req.body[key])) {
                        return res.status(400).json({
                            error: 'Invalid input detected',
                            details: 'Request contains potentially malicious content',
                        });
                    }
                    req.body[key] = sanitizeUserInput(req.body[key]);
                }
            });
        }

        next();
    } catch (error) {
        console.error('Input validation error:', error);
        res.status(400).json({ error: 'Input validation failed' });
    }
}

/**
 * WAF Rules Middleware
 */
function wafMiddleware(req, res, next) {
    // Block requests with unusual patterns
    const suspiciousPatterns = [
        /\.\.\//, // Path traversal
        /<script/i, // Script tags
        /on\w+\s*=/, // Event handlers
        /javascript:/i, // JavaScript protocol
    ];

    const url = req.originalUrl;

    for (let pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
            console.warn(`Blocked suspicious request: ${url}`);
            return res.status(403).json({
                error: 'Request blocked by WAF',
                details: 'Suspicious pattern detected',
            });
        }
    }

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
}

/**
 * Bot Detection Middleware
 */
function botDetectionMiddleware(req, res, next) {
    const userAgent = req.headers['user-agent'] || '';

    // Public crawl bots must be able to fetch metadata and previews.
    // Abuse protection should target sensitive API actions, not legitimate crawlers.
    const allowedBots = [
        /googlebot/i,
        /bingbot/i,
        /linkedinbot/i,
        /whatsapp/i,
        /facebookexternalhit/i,
        /twitterbot/i,
        /slurp/i,
        /duckduckbot/i,
    ];

    if (allowedBots.some(pattern => pattern.test(userAgent))) {
        return next();
    }

    // Only block obvious scraping tools on sensitive write/payment/auth APIs.
    const sensitivePath = /^\/api\/(auth|payments?|bookings?|admin|hotels\/book|transport\/book)/i.test(req.originalUrl || req.path || '');
    const blockedAutomationClients = [
        /scraper/i,
        /python-requests/i,
        /libwww-perl/i,
    ];

    if (sensitivePath && blockedAutomationClients.some(pattern => pattern.test(userAgent))) {
        console.warn(`Blocked automated sensitive request: ${userAgent}`);
        return res.status(403).json({
            error: 'Access denied',
            details: 'Automated requests not allowed for this action',
        });
    }

    next();
}

/**
 * CORS Validation Middleware
 */
function corsValidationMiddleware(req, res, next) {
    const origin = req.headers.origin;
    
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:4173',
        'https://infiniteyatra.com',
        'https://www.infiniteyatra.com',
        'https://infiniteyatra-iy.web.app',
    ];

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin) {
        console.warn(`Blocked CORS request from: ${origin}`);
        return res.status(403).json({
            error: 'CORS policy violation',
            details: 'Origin not allowed',
        });
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
}

// ============= CUSTOM RATE LIMITERS =============

/**
 * Login Rate Limiter
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method !== 'POST',
});

/**
 * 2FA Verification Rate Limiter
 */
const twoFALimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts
    message: '2FA verification attempts exceeded',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * API Endpoint Rate Limiter (per user)
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    keyGenerator: (req) => req.user?.userId || req.ip,
    message: 'Too many API requests',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Search Rate Limiter (prevent search spam)
 */
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 searches per minute
    message: 'Too many search requests',
    standardHeaders: true,
    legacyHeaders: false,
});

// ============= SECURITY EVENT RECORDING =============

/**
 * Log Security Event
 */
function logSecurityEvent(req, eventType, details = {}) {
    const event = {
        timestamp: new Date().toISOString(),
        eventType: eventType,
        method: req.method,
        url: req.originalUrl,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.userId || 'anonymous',
        details: details,
    };

    console.log('[SECURITY EVENT]', event);
    
    // TODO: Send to centralized logging service (e.g., Cloud Logging, Sentry)
}

// ============= REQUEST INSPECTION =============

/**
 * Get Client IP (handles proxies)
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.socket.remoteAddress ||
           req.connection.remoteAddress;
}

/**
 * Get Request Fingerprint (for suspicious activity detection)
 */
function getRequestFingerprint(req) {
    const crypto = require('crypto');
    const fingerprint = JSON.stringify({
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'],
        acceptLanguage: req.headers['accept-language'],
    });
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

// Export all functions
module.exports = {
    // Validation
    validateEmail,
    validateAmount,
    validateBookingData,
    sanitizeUserInput,
    detectSQLInjection,
    validateFileUpload,
    
    // Middleware
    inputValidationMiddleware,
    wafMiddleware,
    botDetectionMiddleware,
    corsValidationMiddleware,
    
    // Rate Limiters
    loginLimiter,
    twoFALimiter,
    apiLimiter,
    searchLimiter,
    
    // Security
    logSecurityEvent,
    getClientIP,
    getRequestFingerprint,
};
