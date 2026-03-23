// ============================================================
//  middleware/authMiddleware.js — JWT protect + role authorize
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Verify Bearer JWT, attach req.user (from DB, without password)
 */
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Not authorized — no token.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user from DB (catches deactivated accounts)
        const user = await User.findById(decoded.id).select('-password -passwordResetToken -passwordResetExpires');

        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
        }

        req.user = user;
        next();
    } catch (err) {
        logger.warn(`Auth failure: ${err.message} | ip: ${req.ip}`);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }
        return res.status(401).json({ success: false, message: 'Not authorized — invalid token.' });
    }
};

/**
 * Role-based access control
 * Usage: router.get('/admin-only', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            logger.warn(`Unauthorized access attempt by ${req.user?.email} [${req.user?.role}] on ${req.originalUrl}`);
            return res.status(403).json({
                success: false,
                message: `Access denied. This route requires one of: [${roles.join(', ')}].`,
            });
        }
        next();
    };
};

module.exports = { protect,authorize };
