// ============================================================
//  models/Certificate.js — Enhanced with indexes & validation
// ============================================================

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Certificate ID is required'],
        unique: true,
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Certificate type is required'],
        enum: {
            values: ['birth', 'death', 'caste', 'income', 'residence'],
            message: 'Invalid certificate type',
        },
    },
    name: {
        type: String,
        required: [true, 'Applicant name is required'],
        trim: true,
        maxlength: [80, 'Name is too long'],
    },
    userEmail: {
        type: String,
        required: [true, 'User email is required'],
        lowercase: true,
        trim: true,
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['pending', 'approved', 'rejected'],
            message: 'Status must be pending, approved, or rejected',
        },
        default: 'pending',
    },
    appliedDate: { type: String, required: [true, 'Applied date is required'] },
    approvedDate: { type: String },
    documentUrl: { type: String, trim: true },
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────
certificateSchema.index({ userEmail: 1 });            // User's certificates
certificateSchema.index({ status: 1 });               // Filter by status
certificateSchema.index({ type: 1 });                 // Filter by cert type
certificateSchema.index({ userEmail: 1, status: 1 }); // Compound

module.exports = mongoose.model('Certificate', certificateSchema);
