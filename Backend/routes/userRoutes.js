// ============================================================
//  routes/userRoutes.js — Auth routes with full security
// ============================================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validate = require('../middleware/validate');
const { authLimiter, resetLimiter } = require('../middleware/rateLimiter');
const { protect, authorize } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');
const { OAuth2Client } = require('google-auth-library');

const { upload } = require('../middleware/uploadMiddleware');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helpers ─────────────────────────────────────────────────

const generateToken = (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '24h' });

// ── Validation Chains ────────────────────────────────────────

const signupRules = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    // ✅ SECURITY: Role cannot be set from frontend — always defaults to 'citizen'
];

const loginRules = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    // ✅ SECURITY: No 'role' field accepted from frontend
];

const resetRequestRules = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetConfirmRules = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * @route   POST /api/users/signup
 * @desc    Register new citizen user
 * @access  Public
 */
router.post('/signup', authLimiter, signupRules, validate, async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // ✅ SECURITY: Role is always 'citizen' — never from request body
        const user = await User.create({ name, email, password, role: 'citizen' });

        logger.info(`New user registered: ${email}`);

        res.status(201).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user, return JWT with server-assigned role
 * @access  Public
 */
router.post('/login', authLimiter, loginRules, validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Select sensitive fields needed for auth logic
        const user = await User.findOne({ email }).select('+password +loginAttempts');

        if (!user) {
            logger.warn(`Failed login attempt: Email not found (${email})`);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            await user.save();

            logger.warn(`Failed login attempt for email: ${email} | Total attempts: ${user.loginAttempts}`);
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // --- SUCCESSFUL LOGIN ---
        logger.info(`User logged in: ${email} [${user.role}]`);

        // Reset attempts and update last login
        user.loginAttempts = 0;
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || user.profilePicture || '',
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/users/forgot-password
 * @desc    Generate a time-limited reset token (sent via email in prod)
 * @access  Public
 */
router.post('/forgot-password', resetLimiter, resetRequestRules, validate, async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // ✅ SECURITY: Always return 200 to prevent email enumeration
        if (!user) {
            return res.json({ success: true, message: 'If that email is registered, a reset token has been generated.' });
        }

        // Generate a secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save({ validateBeforeSave: false });

        // In production: send via email (nodemailer/sendgrid)
        // For demo: return token in response
        logger.info(`Password reset token generated for: ${email}`);

        res.json({
            success: true,
            message: 'Reset token generated.',
            // ⚠️ DEMO ONLY: In production, send this in an email, never in the response!
            resetToken: rawToken,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/users/reset-password
 * @desc    Reset password using valid token
 * @access  Public
 */
router.post('/reset-password', resetLimiter, resetConfirmRules, validate, async (req, res, next) => {
    try {
        const { token, email, newPassword } = req.body;

        // Hash the incoming token to compare with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email,
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },  // token not expired
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        // Set new password (hashing handled by pre-save hook)
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        logger.info(`Password reset successful for: ${email}`);

        res.json({ success: true, message: 'Password reset successfully. Please login.' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', protect, upload.single('avatar'), async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const allowedUpdates = ['name', 'phone', 'gender'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) user[field] = req.body[field];
        });

        // Handle avatar upload if a file was sent
        if (req.file) {
            // Store the Cloudinary URL
            user.avatar = req.file.path;
        } else if (req.body.avatar && req.body.avatar.startsWith('http')) {
            // Support updating via URL if still needed (e.g. from a separate input or a default button)
            user.avatar = req.body.avatar;
        }

        await user.save();

        logger.info(`Profile updated for user: ${user.email}`);

        // When sending back the response, make sure the toPublicJSON includes the updated fields
        const updatedUser = user.toPublicJSON();
        updatedUser.avatar = user.avatar; // Ensure avatar is included
        updatedUser.phone = user.phone;
        updatedUser.gender = user.gender;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (err) {
        logger.error(`Profile update failed for user ${req.user?.email}: ${err.message}`);
        next(err);
    }
});

/**
 * @route   PUT /api/users/change-password
 * @desc    Change logged-in user password
 * @access  Private
 */
router.put('/change-password', protect, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], validate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+password');
        const { currentPassword, newPassword } = req.body;

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password incorrect' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res, next) => {
    try {
        res.json({
            success: true,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                phone: req.user.phone,
                gender: req.user.gender,
                avatar: req.user.avatar,
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/users/google
 * @desc    Authenticate or register user via Google OAuth
 * @access  Public
 */
router.post('/google', authLimiter, [
    body('credential').notEmpty().withMessage('Google credential is required'),
], validate, async (req, res, next) => {
    try {
        const { credential } = req.body;

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Google account does not have an email.' });
        }

        // Check if user exists by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Link googleId if the user signed up with email/password before
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (picture && !user.profilePicture) {
                user.profilePicture = picture;
            }
            user.lastLogin = new Date();
            await user.save();

            logger.info(`Google login: ${email} [${user.role}]`);
        } else {
            // Register new user — always as citizen
            user = await User.create({
                name,
                email,
                googleId,
                profilePicture: picture || '',
                role: 'citizen',
            });

            logger.info(`New Google user registered: ${email}`);
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
        }

        res.json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.profilePicture || user.avatar,
            token: generateToken(user._id, user.role),
        });
    } catch (err) {
        logger.error(`Google auth failed: ${err.message}`);
        if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
            return res.status(401).json({ success: false, message: 'Invalid or expired Google token.' });
        }
        next(err);
    }
});

// ══════════════════════════════════════════════════════════════
//  ADMIN — Staff Management
// ══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/users/staff
 * @desc    Get all staff members (admin only)
 */
router.get('/staff', protect, authorize('admin'), async (req, res, next) => {
    try {
        const staff = await User.find({ role: 'staff' })
            .select('name email phone avatar department designation isActive createdAt lastLogin')
            .sort({ createdAt: -1 });

        res.json({ success: true, staff });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/users/staff
 * @desc    Create a new staff member (admin only)
 */
const createStaffRules = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional({ checkFalsy: true }).isLength({ min: 10, max: 15 }),
    body('department').optional().trim().isLength({ max: 60 }),
    body('designation').optional().trim().isLength({ max: 60 }),
];

router.post('/staff', protect, authorize('admin'), createStaffRules, validate, async (req, res, next) => {
    try {
        const { name, email, password, phone, department, designation } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
        }

        const staff = await User.create({
            name,
            email,
            password,
            phone: phone || '',
            role: 'staff',
            department: department || '',
            designation: designation || '',
        });

        logger.info(`Admin ${req.user.email} created staff member: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Staff member created successfully.',
            staff: {
                _id: staff._id,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                department: staff.department,
                designation: staff.designation,
                isActive: staff.isActive,
                createdAt: staff.createdAt,
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PATCH /api/users/staff/:id
 * @desc    Toggle staff active status (admin only)
 */
router.patch('/staff/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const staff = await User.findOne({ _id: req.params.id, role: 'staff' });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        staff.isActive = !staff.isActive;
        await staff.save();

        logger.info(`Admin ${req.user.email} toggled staff ${staff.email} active=${staff.isActive}`);

        res.json({ success: true, message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'}.`, staff });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/users/staff/:id
 * @desc    Delete a staff member (admin only)
 */
router.delete('/staff/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const staff = await User.findOneAndDelete({ _id: req.params.id, role: 'staff' });
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        logger.info(`Admin ${req.user.email} deleted staff member: ${staff.email}`);

        res.json({ success: true, message: 'Staff member removed.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
