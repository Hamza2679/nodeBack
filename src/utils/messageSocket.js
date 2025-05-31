const { Server } = require("socket.io");
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload");
const { verifyToken } = require("../middleware/authMiddleware.js");
const users = new Map();

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    connectionStateRecovery: true // Add connection recovery
  });

  io.on("connection", async (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    try {
      // Authentication
      const token = socket.handshake.auth.token;
      const userId = await verifyToken(token);
      if (!userId) {
        socket.emit("error", { message: "Invalid token." });
        return socket.disconnect(true);
      }

      // User management
      users.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`); // Create personal room

      console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
      
      // Notify others about new online user
      socket.broadcast.emit("user_online", { userId });

      // Send initial online statuses to new connection
      const onlineUsers = Array.from(users.keys()).map(id => ({ 
        userId: id,
        isOnline: true 
      }));
      socket.emit("initial_status", onlineUsers);

    } catch (err) {
      console.error("Auth error:", err.message);
      socket.emit("error", { message: "Authentication failed." });
      socket.disconnect(true);
    }

    // Unified status check handler
    socket.on("check_status", (targetUserId) => {
      const userIdToCheck = targetUserId?.userId || targetUserId;
      socket.emit("user_status", {
        userId: userIdToCheck,
        isOnline: users.has(userIdToCheck)
      });
    });  
 
  

    // ... rest of your event listeners like send_message, edit_message, etc.
  
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
    

    // ✅ Ping-pong heartbeat
    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on('join', ({ userId }) => {
      if (userId) {
        socket.join(userId);
        console.log(`👥 User ${userId} joined their personal room`);
      }
    });
    

   
    // 🔄 Edit Message
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

// ❌ Delete Message
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
socket.on("disconnect", () => {
      const userId = socket.userId;
      if (userId) {
        users.delete(userId);
        socket.broadcast.emit("user_offline", { userId });
      }
    });
  });
}
module.exports = { initSocket };
