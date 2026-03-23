// ============================================================
//  models/Tax.js — Enhanced with indexes & validation
// ============================================================

const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    id: {
        type: String,
        required: [true, 'Tax ID is required'],
        unique: true,
        trim: true,
    },
    userEmail: {
        type: String,
        required: [true, 'User email is required'],
        lowercase: true,
        trim: true,
    },
    userName: {
        type: String,
        required: [true, 'User name is required'],
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Tax type is required'],
        enum: {
            values: ['house', 'water', 'trade'],
            message: 'Tax type must be house, water, or trade',
        },
    },
    amount: {
        type: String,
        required: [true, 'Amount is required'],
    },
    year: {
        type: String,
        required: [true, 'Year is required'],
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['paid', 'pending'],
            message: 'Status must be paid or pending',
        },
        default: 'pending',
    },
    date: { type: String, default: '—' },
    description: { type: String, trim: true },
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────
taxSchema.index({ userEmail: 1 });              // User's tax list
taxSchema.index({ status: 1 });                 // Filter by paid/pending
taxSchema.index({ userEmail: 1, status: 1 });   // Compound: user + status
taxSchema.index({ year: -1 });                  // Sort by year

module.exports = mongoose.model('Tax', taxSchema);
