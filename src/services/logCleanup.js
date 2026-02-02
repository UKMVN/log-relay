const Log = require('../models/Log');
const User = require('../models/User');

const cleanupLogsByRetention = async () => {
    const users = await User.find({ logRetentionDays: { $ne: null } })
        .select('_id logRetentionDays');

    for (const user of users) {
        const days = Number(user.logRetentionDays);
        if (!Number.isFinite(days) || days <= 0) {
            continue;
        }
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        await Log.deleteMany({ user: user._id, timestamp: { $lt: cutoff } });
    }
};

module.exports = { cleanupLogsByRetention };
