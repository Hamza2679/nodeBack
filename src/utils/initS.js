// initSocket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const handleMessageSocket = require('./messageSocket');
const { handleGroupSocket } = require('./socket');
const { verifyToken } = require("../middleware/authMiddleware"); // ADD MISSING IMPORT

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 30000, // 30 seconds recovery window
      skipMiddlewares: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Missing token"));
      
      const userId = await verifyToken(token);
      if (!userId) return next(new Error("Invalid token"));
      
      socket.userId = userId;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error("Token expired"));
      }
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.userId}`);
    
    // Join user-specific rooms
    socket.join(socket.userId);
    socket.join(`user_${socket.userId}`);
    
    handleMessageSocket(io, socket);
    handleGroupSocket(io, socket);
  });

  return io;
}

module.exports = { initSocket };