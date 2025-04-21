const { Server } = require("socket.io");
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload");
const { verifyToken } = require("../middleware/authMiddleware.js");
const users = new Map();

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    console.log("🔌 Socket connected:", socket.id);
  
    const token = socket.handshake.auth.token;
  
    try {
      const userId = await verifyToken(token);
      if (!userId) {
        socket.emit("error", { message: "Invalid token." });
        return socket.disconnect(true);
      }
  
      users.set(userId, socket.id);
      socket.userId = userId;
  
      console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
      socket.broadcast.emit("user_online", userId);
    } catch (err) {
      console.error("Auth error:", err.message);
      socket.emit("error", { message: "Authentication failed." });
      socket.disconnect(true);
    }
  
    // ... rest of your event listeners like send_message, edit_message, etc.
  
  

    socket.on("send_message", async (data) => {
      const { senderId, receiverId, text, image } = data;

      // ✅ Basic validation
      if (!senderId || !receiverId || (!text && !image)) {
        return socket.emit("error", { message: "Invalid message data." });
      }

      try {
        let imageUrl = null;

        if (image && image.base64 && image.name) {
          const buffer = Buffer.from(image.base64, "base64");
          const fileName = `${Date.now()}-${image.name}`;
          try {
            imageUrl = await uploadToS3(buffer, fileName, "social-sync-for-final");
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            return socket.emit("error", { message: "Image upload failed." });
          }
        }

        const message = await MessageService.createMessage(senderId, receiverId, text, imageUrl);

        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message.toJson);
        }
        
        // 🔁 Emit to sender as well
        io.to(socket.id).emit("receive_message", message);
        

        socket.emit('send_message', message.toJson()); // ✅ sends a proper map

      } catch (err) {
        console.error("💥 Error sending message:", err);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    // ✅ Ping-pong heartbeat
    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);

      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          socket.broadcast.emit("user_offline", userId); // Notify others
          break;
        }
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

  });

}

module.exports = { initSocket };
