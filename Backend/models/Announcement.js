// ============================================================
//  models/Announcement.js — Enhanced with indexes & validation
// ============================================================

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [150, 'Title is too long'],
    },
    date: {
        type: String,
        required: [true, 'Date is required'],
    },
    body: {
        type: String,
        required: [true, 'Body content is required'],
        trim: true,
        maxlength: [2000, 'Body content is too long'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
    },
    icon: {
        type: String,
        default: 'campaign',
        trim: true,
    },
    // ── Audit ───────────────────────────────────────────────
    createdBy: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// ── Indexes ──────────────────────────────────────────────────
announcementSchema.index({ createdAt: -1 });    // Chronological listing
announcementSchema.index({ category: 1 });      // Filter by category

module.exports = mongoose.model('Announcement', announcementSchema);
