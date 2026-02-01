const logId = localStorage.getItem("logId");
const username = localStorage.getItem("username");

if (!logId) {
  window.location.href = "index.html";
}

document.getElementById("displayUsername").textContent = username || "User";
document.getElementById("displayLogId").textContent = logId || "";

const setStatus = (message) => {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = message;
  }
};

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("logId");
  localStorage.removeItem("username");
  window.location.href = "index.html";
});

document.getElementById("copyLogIdBtn").addEventListener("click", async () => {
  if (!logId) {
    setStatus("Log ID not found");
    return;
  }

  try {
    await navigator.clipboard.writeText(logId);
    setStatus("Log ID copied");
  } catch (err) {
    const tempInput = document.createElement("textarea");
    tempInput.value = logId;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    setStatus("Log ID copied");
  }
});

const fetchLogs = async () => {
  // Always get the latest from storage
  const currentLogId = localStorage.getItem("logId");
  try {
    const res = await fetch(`/api/logs?logId=${currentLogId}`);
    const data = await res.json();

    if (data.success) {
      renderLogs(data.data);
      setStatus("Updated just now");
    } else {
      console.error("Failed to fetch logs:", data.error);
    }
  } catch (err) {
    console.error("Error fetching logs:", err);
  }
};

const renderLogs = (logs) => {
  const tbody = document.getElementById("logsBody");
  tbody.innerHTML = "";

  logs.forEach((log) => {
    const row = document.createElement("tr");
    const date = new Date(log.timestamp).toLocaleString();
    const meta = log.meta ? JSON.stringify(log.meta) : "-";

    row.innerHTML = `
            <td>${date}</td>
            <td class="level-${log.level}">${log.level.toUpperCase()}</td>
            <td>${log.service}</td>
            <td>${log.message}</td>
            <td>${meta}</td>
        `;
    tbody.appendChild(row);
  });
};

// Initial load
fetchLogs();

document.getElementById("refreshBtn").addEventListener("click", fetchLogs);

// Optional: WebSocket Listener for real-time updates
const setupWebSocket = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/logs`);

  ws.onopen = () => {
    setStatus("Live (WS Connected)");
    // Send auth/init message if needed, but here simple connection is open.
    // Wait, the current WS implementation expects a message to *create* a log.
    // It does not broadcast logs to connected clients yet.
    // So this WS is only for *sending* logs atm.
    // We will just stick to polling or manual refresh for viewing for now unless requested.
  };
};

// setupWebSocket();
