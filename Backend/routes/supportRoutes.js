const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const SupportTicket = require('../models/SupportTicket');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');

const ticketRules = [
    body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 100 }),
    body('message').trim().notEmpty().withMessage('Message is required'),
];

/**
 * @route   POST /api/support/tickets
 * @desc    Create a new support ticket
 * @access  Private
 */
router.post('/tickets', protect, ticketRules, validate, async (req, res, next) => {
    try {
        const { subject, message, category, priority } = req.body;
        const ticket = await SupportTicket.create({
            userId: req.user._id,
            subject,
            message,
            category,
            priority
        });

        logger.info(`New support ticket created: ${ticket._id} by ${req.user.email}`);
        res.status(201).json({ success: true, ticket });
    } catch (err) {
        logger.error(`Failed to create support ticket: ${err.message} | user: ${req.user?.email}`);
        next(err);
    }
});

/**
 * @route   GET /api/support/my-tickets
 * @desc    Get all tickets for the logged-in user
 * @access  Private
 */
router.get('/my-tickets', protect, async (req, res, next) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, tickets });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/support/tickets
 * @desc    Get all tickets (Staff/Admin only)
 * @access  Private
 */
router.get('/tickets', protect, authorize('staff', 'admin'), async (req, res, next) => {
    try {
        const tickets = await SupportTicket.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, tickets });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/support/tickets/:id
 * @desc    Update ticket status or add response
 * @access  Private
 */
router.patch('/tickets/:id', protect, async (req, res, next) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        // Only owner or staff can respond
        if (ticket.userId.toString() !== req.user._id.toString() && !['staff', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (req.body.status) ticket.status = req.body.status;
        if (req.body.response) {
            ticket.responses.push({
                sender: req.user.name,
                message: req.body.response,
                date: new Date()
            });
            // Auto update status if staff responds
            if (['staff', 'admin'].includes(req.user.role)) {
                ticket.status = 'pending';
            }
        }

        await ticket.save();
        res.json({ success: true, ticket });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
