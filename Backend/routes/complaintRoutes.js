// ============================================================
//  routes/complaintRoutes.js — With validation & audit trail
// ============================================================

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const logger = require('../utils/logger');
const { upload } = require('../middleware/uploadMiddleware');
const { sendComplaintFiledEmail, sendComplaintResolvedEmail } = require('../utils/email');
const { getIO } = require('../utils/socket');
const { analyzeGrievance } = require('../utils/ai');
const { runComplaintAIPipeline } = require('../services/aiComplaintPipeline');


// ── Validation rules ─────────────────────────────────────────

const createRules = [
    body('title').isString().trim().isLength({ min: 1 }).withMessage('Title is required').isLength({ max: 120 }).withMessage('Title too long'),
    body('category').isIn(['sanitation', 'streetlight', 'water', 'road', 'health', 'pension', 'other']).withMessage('Invalid category'),
    body('ward').trim().notEmpty().withMessage('Ward is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('phone').optional({ checkFalsy: true }).isLength({ min: 10, max: 15 }).withMessage('Invalid phone number'),
];

const updateRules = [
    body('status').optional().isIn(['pending', 'inprogress', 'resolved', 'rejected']).withMessage('Invalid status'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0–100'),
    body('assignedTo').optional().trim().notEmpty().withMessage('assignedTo cannot be empty'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * GET /api/complaints
 * Citizens → own complaints only
 * Staff/Admin → all (with optional filters)
 */
router.get('/', protect, async (req, res, next) => {
    try {
        let filter = {};
        if (req.user.role === 'citizen') {
            filter.userEmail = req.user.email;
        } else {
            // Staff and Admins can filter
            const { email, assignedTo, status, category, ward } = req.query;
            if (email) filter.userEmail = email;
            if (assignedTo) filter.assignedTo = assignedTo;
            if (status) filter.status = status;
            if (category) filter.category = category;
            if (ward) filter.ward = ward;
        }

        const complaints = await Complaint.find(filter)
            .sort({ createdAt: -1 })
            .lean();             // .lean() for read-only, faster
        res.json(complaints);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/complaints/:id
 * Citizens can only see their own
 */
router.get('/:id', protect, async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id }).lean();
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        if (req.user.role === 'citizen' && complaint.userEmail !== req.user.email) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
        }
        res.json(complaint);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/complaints
 * Citizen creates complaint; email/name forced from JWT
 */
router.post('/', protect, upload.single('image'), createRules, validate, async (req, res, next) => {
    try {
        logger.info(`Incoming complaint POST request from ${req.user.email}`);
        const { id, title, description, category, ward, priority, phone, address, date, latitude, longitude } = req.body;

        let imageUrl = null;
        if (req.file) {
            imageUrl = req.file.path;
        }

        // Build a draft first (so AI pipeline can enrich it safely)
        const draft = {
            id: id || `GS-${Date.now()}`,
            title,
            description,
            category,
            ward,
            priority: priority || 'medium',
            // ✅ SECURITY: Always from JWT, never from body
            citizenName: req.user.name,
            userEmail: req.user.email,
            phone,
            address,
            image: imageUrl,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            date: date || new Date().toLocaleDateString('en-GB'),
            timeline: [{ step: 'Complaint Filed', date: date || new Date().toLocaleDateString('en-GB'), done: true, desc: 'Complaint received and registered.' }],
        };

        // 🧠 AI: Multi-agent pipeline (analyzer → vision → priority → routing → dedupe)
        // If anything fails, fall back to the existing single-agent analyzer.
        let aiInsights = null;
        try {
            const pipelineOut = await runComplaintAIPipeline({ complaintDraft: draft });
            aiInsights = pipelineOut.insights;
        } catch (err) {
            logger.warn(`AI pipeline failed, falling back to analyzeGrievance(): ${err.message}`);
            const aiAnalysis = await analyzeGrievance(description || title);
            draft.category = aiAnalysis?.category || draft.category;
            draft.priority = aiAnalysis?.priority || draft.priority;
            aiInsights = { agents: { complaintAnalyzer: aiAnalysis } };
        }

        const complaint = new Complaint({
            ...draft,
            aiInsights,
        });

        const created = await complaint.save();
        logger.info(`Complaint created: ${created.id} by ${req.user.email}`);

        // 📧 Notification: Complaint Submitted
        sendComplaintFiledEmail(req.user.email, req.user.name, created.id, created.title);

        // ⚡ Socket.io Real-time Notification for Admins
        try {
            const io = getIO();
            io.to('admin_room').emit('new_complaint', created);
        } catch (err) {
            logger.error(`Socket notification failed for new complaint: ${err.message}`);
        }

        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/complaints/:id
 * Staff/Admin only — update status, progress, assignment
 */
router.patch('/:id', protect, authorize('staff', 'admin'), updateRules, validate, async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        // Apply allowed updates only
        if (req.body.status !== undefined) complaint.status = req.body.status;
        if (req.body.assignedTo !== undefined) complaint.assignedTo = req.body.assignedTo;
        if (req.body.progress !== undefined) complaint.progress = req.body.progress;
        if (req.body.timelineItem) complaint.timeline.push(req.body.timelineItem);

        // Audit trail
        complaint.lastUpdatedBy = req.user.email;

        const updated = await complaint.save();
        logger.info(`Complaint ${complaint.id} updated by ${req.user.email} → status: ${complaint.status}`);

        // ⚡ Socket.io Real-time Notification
        try {
            const io = getIO();
            // Notify specific user
            io.to(`user_${updated.userEmail}`).emit('status_update', {
                id: updated.id,
                status: updated.status,
                title: updated.title,
                message: `Your complaint status has changed to: ${updated.status}`
            });
            // Notify admins of the update
            io.to('admin_room').emit('complaint_updated', updated);
        } catch (err) {
            logger.error(`Socket notification failed for complaint update: ${err.message}`);
        }

        res.json(updated);
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/complaints/:id
 * Citizens can delete their OWN pending complaints
 * Admins can delete any
 */
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        // Permission check
        const isAdmin = req.user.role === 'admin';
        const isOwner = complaint.userEmail === req.user.email;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this complaint' });
        }

        // Business rule: Citizens can only delete if status is still 'pending'
        if (!isAdmin && complaint.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending complaints can be deleted by users' });
        }

        await Complaint.deleteOne({ id: req.params.id });
        logger.info(`🗑️ Complaint deleted: ${req.params.id} by ${req.user.email}`);

        res.json({ success: true, message: 'Complaint deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
