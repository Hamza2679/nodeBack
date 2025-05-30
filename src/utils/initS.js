// initSocket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { handleMessageSocket } = require('./messageSocket');
const { handleGroupSocket } = require('./socket');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      skipMiddlewares: true,
    },
  });

  // JWT authentication for socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user || decoded; // Attach user to socket
      next();
    } catch (err) {
      next(new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}, user ID: ${socket.user?.id}`);

    // Attach handlers
    handleMessageSocket(io, socket);
    handleGroupSocket(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initSocket };
