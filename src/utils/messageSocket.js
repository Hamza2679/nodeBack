const { Server } = require("socket.io");
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload"); // optional
const users = new Map();

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("register", (userId) => {
      users.set(userId, socket.id);
      console.log(`✅ Registered user ${userId} with socket ${socket.id}`);
    });

    socket.on("send_message", async (data) => {
      const { senderId, receiverId, text, image } = data;

      try {
        let imageUrl = null;

        // Optional S3 image upload logic
        if (image && image.base64 && image.name) {
          const buffer = Buffer.from(image.base64, "base64");
          const fileName = `${Date.now()}-${image.name}`;
          imageUrl = await uploadToS3(buffer, fileName, "social-sync-for-final");
        }

        // Save to DB
        const message = await MessageService.createMessage(senderId, receiverId, text, imageUrl);

        // Emit to receiver if online
        const receiverSocketId = users.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }

        // Acknowledge to sender
        socket.emit("message_sent", message);
      } catch (err) {
        console.error("💥 Error sending message:", err);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          break;
        }
      }
    });
  });
}

module.exports = { initSocket };
