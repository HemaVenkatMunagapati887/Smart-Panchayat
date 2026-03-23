// ============================================================
//  middleware/validate.js — express-validator middleware
//  Attach to any route. Returns 400 with field errors if invalid.
// ============================================================

const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Run after express-validator chain.
 * If errors found, return 400 with { success: false, errors: [...] }
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error(`[Validation Failed] body: ${JSON.stringify(req.body)} | errors: ${JSON.stringify(errors.array())}`);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

module.exports = validate;
