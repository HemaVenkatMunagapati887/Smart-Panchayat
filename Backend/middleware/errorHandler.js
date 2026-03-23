// ============================================================
//  middleware/errorHandler.js — Centralized Error Handler
//  All unhandled errors flow through here.
// ============================================================

const logger = require('../utils/logger');

/**
 * Operational vs Programmer errors
 * Mongoose CastError → 400
 * Mongoose ValidationError → 400
 * JWT errors → 401
 * Mongo duplicate key → 409
 * Everything else → 500
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';

    // Mongoose Cast Error (bad ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // Mongoose Duplicate Key
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please login again.';
    }

    // Log the error
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode} | ${message}`, {
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
        user: req.user?.email || 'unauthenticated',
        ip: req.ip,
    });

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
