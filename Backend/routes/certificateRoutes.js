// ============================================================
//  routes/certificateRoutes.js — With validation & centralized errors
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Certificate = require('../models/Certificate');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

// ── Validation rules ─────────────────────────────────────────
const createRules = [
    body('type').isIn(['birth', 'death', 'caste', 'income', 'residence']).withMessage('Invalid certificate type'),
    body('name').trim().notEmpty().withMessage('Applicant name is required'),
    body('appliedDate').notEmpty().withMessage('Applied date is required'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * GET /api/certificates
 * Admin/Staff → all records
 */
const { authorize } = require('../middleware/authMiddleware');
router.get('/', protect, authorize('admin', 'staff'), async (req, res, next) => {
    try {
        const certificates = await Certificate.find({}).sort({ createdAt: -1 }).lean();
        res.json(certificates);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/certificates/user/:email
 * Citizens → own certificates  |  Admin → any user
 */
router.get('/user/:email', protect, async (req, res, next) => {
    try {
        const email = req.user.role === 'admin' ? req.params.email : req.user.email;
        const certificates = await Certificate.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
        res.json(certificates);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/certificates
 * Apply for a certificate
 */
router.post('/', protect, createRules, validate, async (req, res, next) => {
    try {
        const certificate = new Certificate({
            ...req.body,
            userEmail: req.user.role === 'citizen' ? req.user.email : req.body.userEmail,
        });
        const created = await certificate.save();
        logger.info(`Certificate ${created.id} [${created.type}] applied by ${req.user.email}`);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
