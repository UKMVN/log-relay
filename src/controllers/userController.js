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
                    logId: user.logId
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
                logId: user.logId // Return the logId so the user can use it
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
