const socketIo = require('socket.io');
const logger = require('./logger');

let io;

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        // Join room based on user role or ID
        socket.on('join_room', (data) => {
            const { userId, role } = data;

            if (role === 'admin' || role === 'staff') {
                socket.join('admin_room');
                logger.info(`Socket ${socket.id} joined admin_room`);
            }

            if (userId) {
                socket.join(`user_${userId}`);
                logger.info(`Socket ${socket.id} joined room user_${userId}`);
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { init, getIO };
