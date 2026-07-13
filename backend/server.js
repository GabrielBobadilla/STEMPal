const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || true, credentials: true },
});
const setupSocketHandlers = require('./socket/handlers');
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`STEMPal Server running on port ${PORT}`);
});

module.exports = { app, server, io };
