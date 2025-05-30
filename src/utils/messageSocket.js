const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
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
            credentials: true
        }
    });

    // Authentication Middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        try {
            const userId = await verifyToken(token);
            if (!userId) return next(new Error("Invalid token"));
            socket.userId = userId;
            next();
        } catch (err) {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 User ${socket.userId} connected: ${socket.id}`);

        // Join personal room
        socket.join(socket.userId);
        
        // Online status tracking
        const prevCount = userConnectionCount.get(socket.userId) || 0;
        userConnectionCount.set(socket.userId, prevCount + 1);
        
        if (prevCount === 0) {
            socket.broadcast.emit("user_online", { userId: socket.userId });
        }
        
        const onlineUsers = Array.from(userConnectionCount.keys())
            .filter(id => userConnectionCount.get(id) > 0)
            .map(id => ({ userId: id }));
        socket.emit("initial_status", onlineUsers);

        // Status check handler
        socket.on("check_status", (targetUserId) => {
            const userIdToCheck = targetUserId?.userId || targetUserId;
            const isOnline = userConnectionCount.has(userIdToCheck) && 
                             userConnectionCount.get(userIdToCheck) > 0;
            socket.emit("user_status", {
                userId: userIdToCheck,
                isOnline: isOnline
            });
        });

        // Group room handlers
        socket.on("join_group", (groupId) => {
            socket.join(`group_${groupId}`);
            console.log(`📥 User ${socket.userId} joined group_${groupId}`);
        });

        socket.on("leave_group", (groupId) => {
            socket.leave(`group_${groupId}`);
            console.log(`📤 User ${socket.userId} left group_${groupId}`);
        });

        socket.on("join_post", (postId) => {
            socket.join(`post_${postId}`);
            console.log(`📥 User ${socket.userId} joined post_${postId}`);
        });

        // Message handlers
        socket.on("send_message", async (data) => {
          socket.on("send_message", async (data) => {
      const { senderId, receiverId, text, image } = data;
    
      if (!senderId || !receiverId || (!text && !image)) {
        return socket.emit("error", { message: "Invalid message data." });
      }
    
      try {
        let imageUrl = null;
    
        if (image && image.base64 && image.name) {
          const buffer = Buffer.from(image.base64, "base64");
          const fileName = `${Date.now()}-${image.name}`;
          imageUrl = await uploadToS3(buffer, fileName, "social-sync-for-final");
        }
    
        const message = await MessageService.createMessage(senderId, receiverId, text, imageUrl);
    
        // ✅ Emit to receiver's room
        io.to(receiverId).emit("receive_message", message);
    
        // ✅ Emit to sender's room
        io.to(senderId).emit("receive_message", message);
    
      } catch (err) {
        console.error("💥 Error sending message:", err);
        socket.emit("error", { message: "Failed to send message." });
      }
    });
        });

        socket.on("edit_message", async ({ messageId, newText }) => {
            if (!messageId || !newText) {
    return socket.emit("error", { message: "Invalid edit request." });
  }

  try {
    const editedMessage = await MessageService.editMessage(messageId, socket.userId, newText);

    const receiverSocketId = users.get(editedMessage.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_edited", editedMessage);
    }

    socket.emit("message_edited", editedMessage);
  } catch (err) {
    console.error("💥 Edit Message Error:", err.message);
    socket.emit("error", { message: "Failed to edit message." });
  }
});

        socket.on("delete_message", async ({ messageId }) => {
            if (!messageId) {
    return socket.emit("error", { message: "Message ID required." });
  }

  try {
    const deletedMessage = await MessageService.deleteMessage(messageId, socket.userId);

    const receiverSocketId = users.get(deletedMessage.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_deleted", { messageId });
    }

    socket.emit("message_deleted", { messageId });
  } catch (err) {
    console.error("💥 Delete Message Error:", err.message);
    socket.emit("error", { message: "Failed to delete message." });
  }
});


        // Disconnection handler
        socket.on("disconnect", () => {
            const count = userConnectionCount.get(socket.userId) || 1;
            if (count <= 1) {
                userConnectionCount.delete(socket.userId);
                socket.broadcast.emit("user_offline", { userId: socket.userId });
            } else {
                userConnectionCount.set(socket.userId, count - 1);
            }
        });
    });
}

function getIO() {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}

module.exports = { initSocket, getIO };