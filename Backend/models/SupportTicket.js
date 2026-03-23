const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['general', 'technical', 'complaint', 'suggestion', 'other'],
        default: 'general',
    },
    status: {
        type: String,
        enum: ['open', 'pending', 'resolved', 'closed'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    responses: [{
        sender: String,
        message: String,
        date: { type: Date, default: Date.now },
    }]
}, {
    timestamps: true,
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
