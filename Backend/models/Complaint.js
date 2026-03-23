// ============================================================
//  models/Complaint.js — Enhanced with indexes & validation
// ============================================================

const mongoose = require('mongoose');

const timelineItemSchema = new mongoose.Schema({
    step: { type: String, required: true },
    date: { type: String },
    done: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    desc: { type: String },
}, { _id: false });

const complaintSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Complaint ID is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['sanitation', 'streetlight', 'water', 'road', 'health', 'pension', 'other'],
            message: 'Invalid category',
        },
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['pending', 'inprogress', 'resolved', 'rejected'],
            message: 'Invalid status',
        },
        default: 'pending',
    },
    date: { type: String },
    ward: {
        type: String,
        required: [true, 'Ward is required'],
        trim: true,
    },
    priority: {
        type: String,
        required: true,
        enum: {
            values: ['low', 'medium', 'high'],
            message: 'Priority must be low, medium, or high',
        },
        default: 'medium',
    },
    progress: {
        type: Number,
        default: 0,
        min: [0, 'Progress cannot be negative'],
        max: [100, 'Progress cannot exceed 100'],
    },
    assignedTo: { type: String, default: 'Unassigned', trim: true },
    citizenName: { type: String, required: [true, 'Citizen name is required'], trim: true },
    userEmail: { type: String, required: [true, 'User email is required'], lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true, maxlength: [300, 'Address is too long'] },
    image: { type: String },
    timeline: [timelineItemSchema],

    // ── Location ──────────────────────────────────────────────
    latitude: { type: Number },
    longitude: { type: Number },

    // ── AI ──────────────────────────────────────────────────
    aiInsights: { type: Object },

    // ── Audit ─────────────────────────────────────────────────
    lastUpdatedBy: { type: String },    // email of staff/admin who last updated

}, { timestamps: true });

// ── Indexes (performance) ─────────────────────────────────────
complaintSchema.index({ userEmail: 1 });                    // citizen queries
complaintSchema.index({ status: 1 });                       // status filters
complaintSchema.index({ category: 1 });                     // category filters
complaintSchema.index({ ward: 1 });                         // ward breakdown
complaintSchema.index({ assignedTo: 1 });                   // staff queries
complaintSchema.index({ createdAt: -1 });                   // chronological sort
complaintSchema.index({ status: 1, category: 1 });          // compound for dashboard

module.exports = mongoose.model('Complaint', complaintSchema);
