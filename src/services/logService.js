const Log = require('../models/Log');
const User = require('../models/User');

const socketManager = require('../socketManager');

exports.processLogEntry = async (data) => {
    const { level, message, service, meta, logId } = data;

    if (!logId) {
        throw new Error('logId is required');
    }

    const user = await User.findOne({ logId });
    if (!user) {
        throw new Error('Invalid logId');
    }

    const newLog = new Log({
        level,
        message,
        service,
        meta,
        user: user._id
    });

    await newLog.save();

    // Broadcast to relevant clients
    // We attach logId to the object we send so socketManager can filter
    const logData = newLog.toObject();
    logData.logId = logId;
    socketManager.broadcastLog(logData);

    return newLog;
};
