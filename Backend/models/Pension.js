// ============================================================
//  models/Pension.js — Enhanced with indexes & validation
// ============================================================

const mongoose = require('mongoose');

const pensionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Pension ID is required'],
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [80, 'Name is too long'],
    },
    userEmail: {
        type: String,
        required: [true, 'User email is required'],
        lowercase: true,
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Pension type is required'],
        enum: {
            values: ['oldage', 'widow', 'disability', 'weaver'],
            message: 'Invalid pension type',
        },
    },
    ward: {
        type: String,
        required: [true, 'Ward is required'],
        trim: true,
    },
    amount: {
        type: String,
        required: [true, 'Amount is required'],
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['pending', 'active', 'rejected'],
            message: 'Status must be pending, active, or rejected',
        },
        default: 'pending',
    },
    since: { type: String, default: '—' },
    aadhaar: {
        type: String,
        required: [true, 'Aadhaar number is required'],
        trim: true,
    },
    income: { type: String, trim: true },
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────
pensionSchema.index({ userEmail: 1 });            // User's pensions
pensionSchema.index({ status: 1 });               // Filter by status
pensionSchema.index({ type: 1 });                 // Filter by pension type
pensionSchema.index({ ward: 1 });                 // Ward breakdown

module.exports = mongoose.model('Pension', pensionSchema);
