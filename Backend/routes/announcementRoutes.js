// ============================================================
//  routes/announcementRoutes.js — With validation & centralized errors
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

// ── Validation rules ─────────────────────────────────────────
const createRules = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }).withMessage('Title too long'),
    body('date').notEmpty().withMessage('Date is required'),
    body('body').trim().notEmpty().withMessage('Body content is required').isLength({ max: 2000 }).withMessage('Body too long'),
    body('category').trim().notEmpty().withMessage('Category is required'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * GET /api/announcements
 * Public-ish — any authenticated user
 */
router.get('/', protect, async (req, res, next) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        res.json(announcements);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/announcements
 * Admin only — create announcement
 */
router.post('/', protect, authorize('admin'), createRules, validate, async (req, res, next) => {
    try {
        const { title, date, body: bodyText, category, icon } = req.body;
        const announcement = new Announcement({
            title,
            date,
            body: bodyText,
            category,
            icon,
            createdBy: req.user.email,    // Audit trail
        });
        const created = await announcement.save();
        logger.info(`Announcement "${created.title}" created by ${req.user.email}`);
        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/announcements/:id
 * Admin only — delete announcement
 */
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const deleted = await Announcement.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        logger.info(`Announcement "${deleted.title}" deleted by ${req.user.email}`);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
