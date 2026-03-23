// ============================================================
//  routes/taxRoutes.js — With validation & centralized errors
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Tax = require('../models/Tax');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

// ── Validation rules ─────────────────────────────────────────
const createRules = [
    body('type').isIn(['house', 'water', 'trade']).withMessage('Tax type must be house, water, or trade'),
    body('amount').notEmpty().withMessage('Amount is required'),
    body('year').notEmpty().withMessage('Year is required'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * GET /api/tax
 * Admin only → all records
 */
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const taxes = await Tax.find({}).sort({ year: -1, userEmail: 1 }).lean();
        res.json(taxes);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/tax/user/:email
 * Citizens → own records only  |  Admin → any user
 */
router.get('/user/:email', protect, async (req, res, next) => {
    try {
        const email = req.user.role === 'admin' ? req.params.email : req.user.email;
        const taxes = await Tax.find({ userEmail: email }).sort({ year: -1 }).lean();
        res.json(taxes);
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/tax/:id/pay
 * Pay a tax record — ownership verified
 */
router.patch('/:id/pay', protect, async (req, res, next) => {
    try {
        const tax = await Tax.findOne({ id: req.params.id });
        if (!tax) return res.status(404).json({ success: false, message: 'Tax record not found' });

        // Ownership check
        if (tax.userEmail !== req.user.email && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to pay this tax' });
        }

        tax.status = 'paid';
        tax.date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const updated = await tax.save();
        logger.info(`Tax ${tax.id} paid by ${req.user.email}`);
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// Keep legacy PUT support
router.put('/:id/pay', protect, async (req, res, next) => {
    req.url = `/${req.params.id}/pay`;
    req.method = 'PATCH';
    router.handle(req, res, next);
});

/**
 * POST /api/tax
 * Create tax record (admin/system)
 */
router.post('/', protect, createRules, validate, async (req, res, next) => {
    try {
        const tax = new Tax({
            ...req.body,
            userEmail: req.user.role === 'citizen' ? req.user.email : req.body.userEmail,
            userName: req.user.role === 'citizen' ? req.user.name : req.body.userName,
        });
        const created = await tax.save();
        logger.info(`Tax record ${created.id} created for ${created.userEmail}`);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
