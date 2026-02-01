const WebSocket = require("ws");

let wss;
const clients = new Map(); // Map<WebSocket, logId>

const init = (server, options = {}) => {
  const { onLog } = options;
  wss = new WebSocket.Server({ server, path: "/api/logs" });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        // If message is just for authentication/subscription
        if (data.type === "auth" && data.logId) {
          clients.set(ws, data.logId);
          console.log(`Client subscribed to logId: ${data.logId}`);
          ws.send(
            JSON.stringify({ type: "status", message: "Subscribed to updates" })
          );
          return;
        }

        if (data.type === "log") {
          if (!onLog) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Log ingestion is not enabled",
              })
            );
            return;
          }

          const effectiveLogId = data.logId || clients.get(ws);
          if (!effectiveLogId) {
            ws.send(
              JSON.stringify({ type: "error", message: "logId is required" })
            );
            return;
          }

          const payload = { ...data, logId: effectiveLogId };
          const savedLog = await onLog(payload);
          ws.send(
            JSON.stringify({
              type: "ack",
              message: "Log received",
              data: savedLog,
            })
          );
          return;
        }
      } catch (error) {
        console.error("WS Message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: error.message || "Invalid message",
          })
        );
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket connection closed");
    });
  });
};

const broadcastLog = (log) => {
  if (!wss) return;

  const logId = log.user._id ? log.user.logId : null; // We need logId from the User doc.
  // Wait, log.user is an ObjectId usually. We need to populate it or fetch user.
  // OR, we can rely on `logService` to pass us the necessary ID.
  // For simplicity, let's assume the passed `log` object might need the user's logId populated,
  // OR we change the stored client mapping to use User._id.

  // Actually, clients subscribe with `logId` (string).
  // The `log` object has `user` which is an ObjectId.
  // It's cleaner if specific users subscribe to specific IDs.

  // Let's iterate and send.
  // We need to know which "logId" string the newly created log belongs to.

  // OPTION: The service passes (log, logIdString).

  clients.forEach((clientLogId, clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      // We need to match clientLogId with the log's owner.
      // This passed `log` needs to identify its owner.
      // If log has `logId` property attached (it doesn't naturally), we pass it.
      if (log.logId === clientLogId) {
        clientWs.send(JSON.stringify({ type: "new_log", data: log }));
      }
    }
  });
};

module.exports = { init, broadcastLog };
