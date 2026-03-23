// ============================================================
//  server.js — Production-hardened Express server
// ============================================================

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const sanitize = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const socketUtil = require('./utils/socket');

dotenv.config();
connectDB();

const app = express();

// ── Security Headers ─────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));

// ── HTTP Request Logging (Morgan → Winston) ───────────────────
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
    stream: { write: (msg) => logger.http(msg.trim()) }
}));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));        // Prevent huge payloads
app.use(express.urlencoded({ extended: false }));

// ── Input Sanitization (global) ──────────────────────────────
app.use(sanitize);

// ── Global API Rate Limiter ───────────────────────────────────
app.use('/api', apiLimiter);

// ── Health Check ─────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Panchayat API is running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ── Static Files (Uploads) ───────────────────────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/tax', require('./routes/taxRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/pensions', require('./routes/pensionRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/ai', require('./routes/aiAgentRoutes'));

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Centralized Error Handler (must be last) ──────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
socketUtil.init(server);

server.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Promise Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

module.exports = app;
