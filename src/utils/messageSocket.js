const { Server } = require("socket.io");
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload");
// Assuming you have a method to get user by ID

let io = null;
const userConnectionCount = new Map();

function logSocketEvent(event, data) {
  console.log(`[${new Date().toISOString()}] [SOCKET] ${event}`, JSON.stringify(data, null, 2));
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  io.on("connection", (socket) => {
    logSocketEvent("CONNECTION", { socketId: socket.id });

    // Join personal room (client must send userId manually)
    socket.on("register_user", (userId) => {
      if (userId) {
        socket.join(userId);
        socket.data.userId = userId;

        const prevCount = userConnectionCount.get(userId) || 0;
        userConnectionCount.set(userId, prevCount + 1);

        if (prevCount === 0) {
          socket.broadcast.emit("user_online", { userId });
        }

        const onlineUsers = Array.from(userConnectionCount.keys())
          .filter(id => userConnectionCount.get(id) > 0)
          .map(id => ({ userId: id }));

        socket.emit("initial_status", onlineUsers);
        logSocketEvent("REGISTER_USER", { userId, socketId: socket.id });
      }
    });

    socket.on("join_group", (groupId) => {
      if (groupId) {
        const roomName = `group_${groupId}`;
        socket.join(roomName);
        socket.emit("group_joined", { groupId });
      }
    });

    socket.on("leave_group", (groupId) => {
      if (groupId) {
        const roomName = `group_${groupId}`;
        socket.leave(roomName);
        socket.emit("group_left", { groupId });
      }
    });

    socket.on("check_status", (targetUserId) => {
      const isOnline = userConnectionCount.has(targetUserId) && 
                       userConnectionCount.get(targetUserId) > 0;
      socket.emit("user_status", { userId: targetUserId, isOnline });
    });

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
        io.to(receiverId).emit("receive_message", message);
        io.to(senderId).emit("receive_message", message);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    socket.on("edit_message", async (data) => {
      const { messageId, newText, userId } = data;

      if (!messageId || !newText || !userId) {
        return socket.emit("error", { message: "Invalid edit request." });
      }

      try {
        const editedMessage = await MessageService.editMessage(messageId, userId, newText);
        if (editedMessage) {
          io.to(editedMessage.senderId).emit("message_edited", editedMessage);
          io.to(editedMessage.receiverId).emit("message_edited", editedMessage);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to edit message." });
      }
    });

    socket.on("delete_message", async (data) => {
      const { messageId, userId } = data;

      if (!messageId || !userId) {
        return socket.emit("error", { message: "Message ID and user ID required." });
      }

      try {
        const deletedMessage = await MessageService.deleteMessage(messageId, userId);
        if (deletedMessage) {
          io.to(deletedMessage.senderId).emit("message_deleted", { messageId });
          io.to(deletedMessage.receiverId).emit("message_deleted", { messageId });
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to delete message." });
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId) {
        const count = userConnectionCount.get(userId) || 1;
        if (count <= 1) {
          userConnectionCount.delete(userId);
          socket.broadcast.emit("user_offline", { userId });
        } else {
          userConnectionCount.set(userId, count - 1);
        }
      }
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };
