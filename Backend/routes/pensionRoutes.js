// ============================================================
//  routes/pensionRoutes.js — With validation & centralized errors
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Pension = require('../models/Pension');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

// ── Validation rules ─────────────────────────────────────────
const createRules = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('type').isIn(['oldage', 'widow', 'disability', 'weaver']).withMessage('Invalid pension type'),
    body('ward').trim().notEmpty().withMessage('Ward is required'),
    body('amount').notEmpty().withMessage('Amount is required'),
    body('aadhaar').trim().notEmpty().withMessage('Aadhaar number is required')
        .isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * GET /api/pensions
 * Admin/Staff → all records
 */
const { authorize } = require('../middleware/authMiddleware');
router.get('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const pensions = await Pension.find({}).sort({ createdAt: -1 }).lean();
        res.json(pensions);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/pensions/user/:email
 * Citizens → own pensions  |  Admin → any user
 */
router.get('/user/:email', protect, async (req, res, next) => {
    try {
        const email = req.user.role === 'admin' ? req.params.email : req.user.email;
        const pensions = await Pension.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
        res.json(pensions);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/pensions
 * Apply for a new pension
 */
router.post('/', protect, createRules, validate, async (req, res, next) => {
    try {
        const pension = new Pension({
            ...req.body,
            userEmail: req.user.role === 'citizen' ? req.user.email : req.body.userEmail,
        });
        const created = await pension.save();
        logger.info(`Pension application ${created.id} filed by ${req.user.email}`);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
