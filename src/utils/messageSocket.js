const { Server } = require("socket.io");
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload");
const { verifyToken } = require("../middleware/authMiddleware.js");

let io = null;
const userConnectionCount = new Map();

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  io.on("connection", async (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // 1. Restore token-based authentication
    const token = socket.handshake.auth.token;
    try {
      const userId = await verifyToken(token);
      if (!userId) {
        socket.emit("error", { message: "Invalid token." });
        return socket.disconnect(true);
      }

      // 2. Maintain connection count for presence tracking
      const prevCount = userConnectionCount.get(userId) || 0;
      userConnectionCount.set(userId, prevCount + 1);
      socket.data.userId = userId;

      // Join personal room for direct messaging
      socket.join(userId);

      // Notify about online status changes
      if (prevCount === 0) {
        socket.broadcast.emit("user_online", { userId });
      }

      // Send initial online status list
      const onlineUsers = Array.from(userConnectionCount.keys())
        .filter(id => userConnectionCount.get(id) > 0)
        .map(id => ({ userId: id }));
      socket.emit("initial_status", onlineUsers);

      console.log(`✅ Authenticated user ${userId} (${prevCount + 1} connections)`);

    } catch (err) {
      console.error("Auth error:", err.message);
      socket.emit("error", { message: "Authentication failed." });
      socket.disconnect(true);
    }

    // 3. Restore message features
    socket.on("send_message", async (data) => {
      const { senderId, receiverId, text, image } = data;
      
      if (!senderId || !receiverId || (!text && !image)) {
        return socket.emit("error", { message: "Invalid message data." });
      }

      try {
        let imageUrl = null;
        if (image?.base64 && image?.name) {
          const buffer = Buffer.from(image.base64, "base64");
          const fileName = `${Date.now()}-${image.name}`;
          imageUrl = await uploadToS3(buffer, fileName, "social-sync-for-final");
        }

        const message = await MessageService.createMessage(senderId, receiverId, text, imageUrl);
        
        // Deliver to both parties through their personal rooms
        io.to(receiverId).emit("receive_message", message);
        io.to(senderId).emit("receive_message", message);

      } catch (err) {
        console.error("💥 Send message error:", err);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    socket.on("edit_message", async ({ messageId, newText }) => {
      if (!messageId || !newText) {
        return socket.emit("error", { message: "Invalid edit request." });
      }

      try {
        const userId = socket.data.userId;
        const editedMessage = await MessageService.editMessage(messageId, userId, newText);
        
        // Notify both participants
        io.to(editedMessage.senderId).emit("message_edited", editedMessage);
        io.to(editedMessage.receiverId).emit("message_edited", editedMessage);
        
      } catch (err) {
        console.error("💥 Edit message error:", err);
        socket.emit("error", { message: "Failed to edit message." });
      }
    });

    socket.on("delete_message", async ({ messageId }) => {
      if (!messageId) {
        return socket.emit("error", { message: "Message ID required." });
      }

      try {
        const userId = socket.data.userId;
        const deletedMessage = await MessageService.deleteMessage(messageId, userId);
        
        // Notify both participants
        io.to(deletedMessage.senderId).emit("message_deleted", { messageId });
        io.to(deletedMessage.receiverId).emit("message_deleted", { messageId });
        
      } catch (err) {
        console.error("💥 Delete message error:", err);
        socket.emit("error", { message: "Failed to delete message." });
      }
    });

    // 4. Add group features (non-conflicting)
    socket.on("join_group", (groupId) => {
      if (groupId) {
        const roomName = `group_${groupId}`;
        socket.join(roomName);
        console.log(`👥 User ${socket.data.userId} joined group ${groupId}`);
      }
    });

    socket.on("leave_group", (groupId) => {
      if (groupId) {
        const roomName = `group_${groupId}`;
        socket.leave(roomName);
        console.log(`👋 User ${socket.data.userId} left group ${groupId}`);
      }
    });

    // 5. Restore presence features
    socket.on("check_status", (targetUserId) => {
      const isOnline = userConnectionCount.has(targetUserId) && 
                      userConnectionCount.get(targetUserId) > 0;
      socket.emit("user_status", { userId: targetUserId, isOnline });
    });

    // 6. Restore heartbeat
    socket.on("ping", () => {
      socket.emit("pong");
    });

    // 7. Handle disconnection
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId) {
        const count = userConnectionCount.get(userId) || 1;
        const newCount = Math.max(count - 1, 0);
        
        if (newCount === 0) {
          userConnectionCount.delete(userId);
          socket.broadcast.emit("user_offline", { userId });
        } else {
          userConnectionCount.set(userId, newCount);
        }
        console.log(`🚪 User ${userId} disconnected (${newCount} connections remain)`);
      }
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };