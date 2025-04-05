const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true,
        enum: ['user', 'assistant'] // Either the user or the AI assistant
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new Schema({
    userID: {
        type: String,
        required: true,
        index: true // For faster queries by userID
    },
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        default: 'New Chat'
    }
});

module.exports = mongoose.model('Chat', chatSchema);