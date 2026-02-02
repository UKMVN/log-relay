const WebSocket = require("ws");

let wss;
const clients = new Map(); // Map<WebSocket, { logId, logIdCustom }>

const safeSend = (ws, payload) => {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (error) {
    console.error("WS Send error:", error);
  }
};

const init = (server, options = {}) => {
  const { onLog } = options;
  wss = new WebSocket.Server({ server, path: "/api/logs" });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established");

    ws.on("message", async (message) => {
      try {
        const raw = typeof message === "string" ? message : message.toString();
        const data = JSON.parse(raw);

        // If message is just for authentication/subscription
        if (data.type === "auth" && (data.logId || data.logIdCustom)) {
          const logId = data.logId || null;
          const logIdCustom = data.logIdCustom || null;
          clients.set(ws, { logId, logIdCustom });
          console.log(
            `Client subscribed to logId: ${logId || "-"} logIdCustom: ${logIdCustom || "-"}`
          );
          safeSend(ws, { type: "status", message: "Subscribed to updates" });
          return;
        }

        if (data.type === "ping") {
          safeSend(ws, { type: "pong", ts: Date.now() });
          return;
        }

        if (data.type === "log") {
          if (!onLog) {
            safeSend(ws, {
              type: "error",
              message: "Log ingestion is not enabled",
            });
            return;
          }

          const clientInfo = clients.get(ws) || {};
          const effectiveLogId = data.logId || clientInfo.logId;
          const effectiveLogIdCustom = data.logIdCustom || clientInfo.logIdCustom;

          if (!effectiveLogId && !effectiveLogIdCustom) {
            safeSend(ws, {
              type: "error",
              message: "logId or logIdCustom is required",
            });
            return;
          }

          const payload = {
            ...data,
            logId: effectiveLogId,
            logIdCustom: effectiveLogIdCustom,
          };
          const savedLog = await onLog(payload);
          safeSend(ws, {
            type: "ack",
            message: "Log received",
            data: savedLog,
          });
          return;
        }
      } catch (error) {
        console.error("WS Message error:", error);
        safeSend(ws, {
          type: "error",
          message: error.message || "Invalid message",
        });
      }
    });

    ws.on("close", (code, reason) => {
      clients.delete(ws);
      const reasonText =
        typeof reason === "string" ? reason : reason.toString("utf8");
      console.log(`WebSocket connection closed (${code}) ${reasonText}`);
    });

    ws.on("error", (error) => {
      console.error("WebSocket connection error:", error);
    });
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
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

  clients.forEach((clientInfo, clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      if (
        (clientInfo.logId && log.logId === clientInfo.logId) ||
        (clientInfo.logIdCustom && log.logIdCustom === clientInfo.logIdCustom)
      ) {
        safeSend(clientWs, { type: "new_log", data: log });
      }
    }
  });
};

module.exports = { init, broadcastLog };
