// ============================================================
//  middleware/sanitize.js — Input sanitization
//  Strips HTML/script injections from req.body fields.
// ============================================================

/** Simple recursive HTML sanitizer (no extra deps) */
function stripHtml(value) {
    if (typeof value !== 'string') return value;
    return value
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')         // strip all HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\0/g, '')              // null byte injection
        .trim();
}

function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            obj[key] = stripHtml(obj[key]);
        } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            sanitizeObject(obj[key]);
        }
    }
    return obj;
}

/**
 * Express middleware — sanitizes req.body in-place.
 * Apply to all routes via app.use(sanitize).
 */
const sanitize = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }
    next();
};

module.exports = sanitize;
