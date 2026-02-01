require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const socketManager = require('./src/socketManager');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Setup WebSocket
socketManager.init(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
