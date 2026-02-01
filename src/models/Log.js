const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    level: {
        type: String,
        required: true,
        enum: ['info', 'warn', 'error', 'debug']
    },
    message: {
        type: String,
        required: true
    },
    service: {
        type: String,
        default: 'default-service'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    meta: {
        type: Object
    }
});

module.exports = mongoose.model('Log', LogSchema);
