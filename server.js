require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const socketManager = require("./src/socketManager");
const logService = require("./src/services/logService");
const { cleanupLogsByRetention } = require("./src/services/logCleanup");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Setup WebSocket
socketManager.init(server, {
  onLog: logService.processLogEntry,
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const runCleanup = async () => {
    try {
      await cleanupLogsByRetention();
    } catch (error) {
      console.error("Log cleanup error:", error);
    }
  };

  runCleanup();
  setInterval(runCleanup, 60 * 60 * 1000);
});
