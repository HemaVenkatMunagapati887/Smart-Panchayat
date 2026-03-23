// ============================================================
//  models/User.js — Enhanced with security fields & indexes
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }, // Not required for Google OAuth users
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,        // ✅ Never returned in queries by default
    },
    googleId: {
        type: String,
        sparse: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    // ✅ SECURITY: Role is server-controlled only
    role: {
        type: String,
        required: true,
        enum: {
            values: ['citizen', 'staff', 'admin'],
            message: 'Role must be citizen, staff, or admin',
        },
        default: 'citizen',
    },

    // ── Password Reset (Token-based) ─────────────────────────
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },

    // ── Account Status ───────────────────────────────────────
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
    loginAttempts: {
        type: Number,
        default: 0,
        select: false,
    },
    // ── Rich Profile Fields ─────────────────────────────────
    phone: {
        type: String,
        trim: true,
    },
    department: {
        type: String,
        trim: true,
        default: '',
    },
    designation: {
        type: String,
        trim: true,
        default: '',
    },
    avatar: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Default silhouette
    },
}, {
    timestamps: true,   // createdAt, updatedAt
});

// ── Indexes ──────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true }); // Fast + unique email lookups
userSchema.index({ role: 1 });                  // Filter by role
userSchema.index({ passwordResetToken: 1 }, { sparse: true }); // Token lookup

// ── Pre-save Hook: Hash password ─────────────────────────────
// Mongoose 9+ supports async middleware without `next`
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(12);      // 12 rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance Methods ─────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Guard against documents where password was not selected / is missing
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

// Safe public profile (strips sensitive fields)
userSchema.methods.toPublicJSON = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model('User', userSchema);
