const Log = require('../models/Log');
const User = require('../models/User');

const socketManager = require('../socketManager');

exports.processLogEntry = async (data) => {
    const { level, message, service, meta, logId, logIdCustom, timeLog } = data;

    if (!logId && !logIdCustom) {
        throw new Error('logId or logIdCustom is required');
    }

    const user = await User.findOne({
        $or: [
            logId ? { logId } : null,
            logIdCustom ? { logIdCustom } : null
        ].filter(Boolean)
    });
    if (!user) {
        throw new Error('Invalid logId or logIdCustom');
    }

    const newLog = new Log({
        level,
        message,
        service,
        meta,
        timeLog: timeLog || Date.now(),
        user: user._id
    });

    await newLog.save();

    // Broadcast to relevant clients
    // We attach logId to the object we send so socketManager can filter
    const logData = newLog.toObject();
    logData.logId = user.logId;
    if (user.logIdCustom) {
        logData.logIdCustom = user.logIdCustom;
    }
    socketManager.broadcastLog(logData);

    return newLog;
};
