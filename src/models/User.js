const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    logId: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomUUID()
    },
    logIdCustom: {
        type: String,
        unique: true,
        sparse: true
    },
    logRetentionDays: {
        type: Number,
        default: 30
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
