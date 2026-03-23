// ============================================================
//  middleware/rateLimiter.js — express-rate-limit configs
//  Different limits for auth vs general API routes.
// ============================================================

const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';
const noop = (req, res, next) => next();

/** Strict limiter for login/signup — brute-force protection */
const authLimiter = isProd
    ? rateLimit({
        windowMs: 15 * 60 * 1000,         // 15 minutes
        max: 10,                          // 10 attempts per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many login attempts. Please try again after 15 minutes.',
        },
        skipSuccessfulRequests: true,     // Don't count successful logins
    })
    : noop; // Disabled in development for easier testing

/** General API limiter — prevents abuse */
const apiLimiter = isProd
    ? rateLimit({
        windowMs: 10 * 60 * 1000,         // 10 minutes
        max: 300,                         // 300 requests per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: 'Too many requests. Please slow down.',
        },
    })
    : noop;

/** Password reset limiter — very strict */
const resetLimiter = isProd
    ? rateLimit({
        windowMs: 60 * 60 * 1000,         // 1 hour
        max: 5,
        message: {
            success: false,
            message: 'Too many password reset attempts. Please try again after 1 hour.',
        },
    })
    : noop;

module.exports = { authLimiter, apiLimiter, resetLimiter };
