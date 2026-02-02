const User = require('../models/User');

exports.createUser = async (req, res) => {
    try {
        const { username } = req.body;
        // Check if user exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(200).json({
                success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    logId: user.logId,
                    logIdCustom: user.logIdCustom || null,
                    logRetentionDays: user.logRetentionDays ?? 30
                }
            });
        }

        user = new User({ username });
        await user.save();

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                logId: user.logId, // Return the logId so the user can use it
                logIdCustom: user.logIdCustom || null,
                logRetentionDays: user.logRetentionDays ?? 30
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-__v');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.editLogIdCustom = async (req, res) => {
    try {
        const { logId, username, logIdCustom } = req.body;

        if (!logIdCustom || !String(logIdCustom).trim()) {
            return res.status(400).json({ success: false, error: 'logIdCustom is required' });
        }

        if (!logId && !username) {
            return res.status(400).json({ success: false, error: 'logId or username is required' });
        }

        const user = await User.findOne(logId ? { logId } : { username });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const existing = await User.findOne({ logIdCustom });
        if (existing && String(existing._id) !== String(user._id)) {
            return res.status(400).json({ success: false, error: 'logIdCustom already in use' });
        }

        user.logIdCustom = logIdCustom;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                logId: user.logId,
                logIdCustom: user.logIdCustom,
                logRetentionDays: user.logRetentionDays ?? 30
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const logId = req.query.logId || req.headers['x-log-id'];
        if (!logId) {
            return res.status(400).json({ success: false, error: 'logId is required' });
        }

        const user = await User.findOne({ logId });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                logId: user.logId,
                logIdCustom: user.logIdCustom || null,
                logRetentionDays: user.logRetentionDays ?? 30
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { logId, logRetentionDays } = req.body;

        if (!logId) {
            return res.status(400).json({ success: false, error: 'logId is required' });
        }

        if (logRetentionDays === undefined) {
            return res.status(400).json({ success: false, error: 'logRetentionDays is required' });
        }

        const parsed = Number(logRetentionDays);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return res.status(400).json({ success: false, error: 'logRetentionDays must be a number >= 0' });
        }

        const user = await User.findOne({ logId });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.logRetentionDays = parsed === 0 ? null : Math.floor(parsed);
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                logId: user.logId,
                logIdCustom: user.logIdCustom || null,
                logRetentionDays: user.logRetentionDays ?? 30
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
