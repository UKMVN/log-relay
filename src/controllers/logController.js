const logService = require("../services/logService");
const Log = require("../models/Log");

exports.createLog = async (req, res) => {
  try {
    const newLog = await logService.processLogEntry(req.body);
    res.status(201).json({
      success: true,
      data: newLog,
    });
  } catch (error) {
    if (
      error.message === "logId is required" ||
      error.message === "Invalid logId" ||
      error.message === "logId or logIdCustom is required" ||
      error.message === "Invalid logId or logIdCustom"
    ) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logId = req.query.logId || req.headers["x-log-id"];
    let query = {};
    if (logId) {
      const User = require("../models/User");
      const user = await User.findOne({ logId });
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid logId" });
      }
      query = { user: user._id };
    }
    const logs = await Log.find(query).sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
