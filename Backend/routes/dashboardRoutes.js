// ============================================================
//  routes/dashboardRoutes.js — With next(err) & .lean()
// ============================================================

const express = require('express');
const router = express.Router();
const Pension = require('../models/Pension');
const Certificate = require('../models/Certificate');
const Complaint = require('../models/Complaint');
const Tax = require('../models/Tax');
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * GET /api/dashboard/citizen/:email
 * Citizen dashboard — uses verified JWT email
 */
router.get('/citizen/:email', protect, async (req, res, next) => {
    try {
        const email = req.user.email;

        // Run all counts in parallel
        const [totalComplaints, resolvedComplaints, pendingComplaints, inProgressComplaints, pendingTaxes, recentAnnouncements] =
            await Promise.all([
                Complaint.countDocuments({ userEmail: email }),
                Complaint.countDocuments({ userEmail: email, status: 'resolved' }),
                Complaint.countDocuments({ userEmail: email, status: 'pending' }),
                Complaint.countDocuments({ userEmail: email, status: 'inprogress' }),
                Tax.find({ userEmail: email, status: 'pending' }).lean(),
                Announcement.find().sort({ createdAt: -1 }).limit(5).lean(),
            ]);

        const totalTaxDue = pendingTaxes.reduce((sum, tax) => {
            const amount = parseInt(String(tax.amount).replace(/[₹,]/g, '')) || 0;
            return sum + amount;
        }, 0);

        res.json({
            success: true,
            stats: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints,
                inProgressComplaints,
                totalTaxDue,
            },
            announcements: recentAnnouncements,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/dashboard/admin
 * Admin dashboard — aggregates + analytics
 */
router.get('/admin', protect, authorize('admin'), async (req, res, next) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Fetch everything in parallel for maximum speed
        const [
            allComplaints,
            allPensions,
            allCertificates,
            allTaxes,
            monthlyTrend,
            categoryBreakdown,
            wardPerformance,
        ] = await Promise.all([
            Complaint.find({}).sort({ createdAt: -1 }).lean(),
            Pension.find({}).sort({ createdAt: -1 }).lean(),
            Certificate.find({}).sort({ createdAt: -1 }).lean(),
            Tax.find({}).sort({ year: -1, userEmail: 1 }).lean(),

            // Monthly trend (6 months)
            Complaint.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
                        filed: { $sum: 1 },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // Category breakdown
            Complaint.aggregate([
                { $group: { _id: '$category', value: { $sum: 1 } } },
            ]),

            // Ward performance
            Complaint.aggregate([
                {
                    $group: {
                        _id: '$ward',
                        total: { $sum: 1 },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    },
                },
                {
                    $project: {
                        ward: '$_id',
                        total: 1,
                        resolved_count: '$resolved',
                        resolved: {
                            $cond: [
                                { $eq: ['$total', 0] },
                                0,
                                { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
                            ],
                        },
                        pending: {
                            $cond: [
                                { $eq: ['$total', 0] },
                                0,
                                { $multiply: [{ $divide: [{ $subtract: ['$total', '$resolved'] }, '$total'] }, 100] },
                            ],
                        },
                    },
                },
            ]),
        ]);

        // Calculate summary stats from the raw data
        const stats = {
            totalComplaints: allComplaints.length,
            resolvedComplaints: allComplaints.filter(c => c.status === 'resolved').length,
            pendingComplaints: allComplaints.filter(c => c.status === 'pending').length,
            inProgressComplaints: allComplaints.filter(c => c.status === 'inprogress').length,
            pensionCount: allPensions.length,
            certificateCount: allCertificates.length,
            totalTaxDue: allTaxes.filter(t => t.status !== 'paid').reduce((sum, tax) => {
                const amount = parseInt(String(tax.amount).replace(/[₹,]/g, '')) || 0;
                return sum + amount;
            }, 0)
        };

        console.log(`[Admin Dashboard] Stats: ${JSON.stringify(stats)}`);
        console.log(`[Admin Dashboard] Category Breakdown: ${JSON.stringify(categoryBreakdown)}`);
        console.log(`[Admin Dashboard] Cert IDs: ${allCertificates.slice(0, 3).map(c => c.id).join(', ')}`);
        console.log(`[Admin Dashboard] Pension IDs: ${allPensions.slice(0, 3).map(p => p.id).join(', ')}`);

        res.json({
            success: true,
            stats,
            complaints: allComplaints,
            pensions: allPensions,
            certificates: allCertificates,
            taxes: allTaxes,
            monthlyTrend,
            categoryBreakdown,
            wardPerformance,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/dashboard/staff/:name
 * Staff dashboard — uses verified JWT name
 */
router.get('/staff/:name', protect, authorize('staff', 'admin'), async (req, res, next) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const name = req.params.name;

        // If admin is viewing overview, don't filter by name. Otherwise, filter by specific staff name.
        const filter = (isAdmin && (!name || name === 'all' || name === req.user.name))
            ? {}
            : { assignedTo: name || req.user.name };

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [assignedTasks, highPriority, completedToday] = await Promise.all([
            Complaint.countDocuments({ ...filter, assignedTo: { $exists: true, $ne: 'Unassigned' }, status: { $ne: 'resolved' } }),
            Complaint.countDocuments({ ...filter, assignedTo: { $exists: true, $ne: 'Unassigned' }, status: { $ne: 'resolved' }, priority: 'high' }),
            Complaint.countDocuments({ ...filter, assignedTo: { $exists: true, $ne: 'Unassigned' }, status: 'resolved', updatedAt: { $gte: startOfToday } }),
        ]);

        res.json({
            success: true,
            stats: { assignedTasks, completedToday, highPriority },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
