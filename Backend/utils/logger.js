// ============================================================
//  utils/logger.js — Winston structured logger
//  Logs to console (dev) + daily rotating files (prod).
// ============================================================

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProd = process.env.NODE_ENV === 'production';

// Human-readable format for dev console
const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) =>
        `${timestamp} ${level}: ${message}${stack ? '\n' + stack : ''}`)
);

// JSON format for log files (parseable by log aggregators)
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }),
    format.json()
);

const logger = createLogger({
    level: isProd ? 'warn' : 'debug',
    transports: [
        // Console (always)
        new transports.Console({ format: devFormat }),

        // Persistent error log
        new transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5 * 1024 * 1024,   // 5MB
            maxFiles: 5,
        }),

        // Combined log (info+)
        new transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 10 * 1024 * 1024,  // 10MB
            maxFiles: 5,
        }),
    ],
});

module.exports = logger;
