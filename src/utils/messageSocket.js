// messageSocket.js
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload");

// Track user connections: userId -> Set of socket IDs
const userConnections = new Map();

function handleMessageSocket(io, socket) {
    const userId = socket.user?.id;
    if (!userId) {
        console.error("No user ID found for message socket. Disconnecting...");
        return socket.disconnect();
    }

    console.log(`💬 Message Socket connected: ${socket.id}, User ID: ${userId}`);

    // Add socket to user's connection set
    if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
        // Notify others only for first connection
        socket.broadcast.emit("user_online", { userId });
    }
    userConnections.get(userId).add(socket.id);

    // Send initial online status to new connection
    const onlineUsers = Array.from(userConnections.keys()).map(id => ({ userId: id }));
    socket.emit("initial_status", onlineUsers);

    // Join user's personal room
    socket.join(userId);
    console.log(`👥 User ${userId} joined their message room`);

    // Event Handlers
    socket.on("check_status", (target) => {
        const targetId = target?.userId || target;
        socket.emit("user_status", {
            userId: targetId,
            isOnline: userConnections.has(targetId)
        });
    });

    socket.on("send_message", async (data) => {
        const { receiverId, text, image, tempId } = data;
        
        if (!receiverId || (!text && !image)) {
            return socket.emit("message_error", {
                message: "Invalid message data",
                tempId
            });
        }

        try {
            let imageUrl = null;
            if (image?.base64 && image.name) {
                const buffer = Buffer.from(image.base64, "base64");
                imageUrl = await uploadToS3(
                    buffer, 
                    `${Date.now()}-${image.name}`,
                    "social-sync-for-final"
                );
            }

            const message = await MessageService.createMessage(
                userId, 
                receiverId, 
                text, 
                imageUrl
            );

            // Deliver to receiver's room
            io.to(receiverId).emit("receive_message", message);
            
            // Confirm delivery to sender
            socket.emit("message_delivered", {
                ...message,
                tempId  // Echo back for client-side tracking
            });

        } catch (err) {
            console.error("💥 Message send error:", err);
            socket.emit("message_error", {
                message: "Failed to send message",
                tempId
            });
        }
    });

    socket.on("edit_message", async ({ messageId, newText, tempId }) => {
        if (!messageId || !newText) {
            return socket.emit("message_error", {
                message: "Invalid edit request",
                tempId
            });
        }

        try {
            const editedMessage = await MessageService.editMessage(
                messageId, 
                userId, 
                newText
            );

            // Notify both parties
            io.to(editedMessage.senderId).emit("message_edited", editedMessage);
            io.to(editedMessage.receiverId).emit("message_edited", editedMessage);

        } catch (err) {
            console.error("💥 Message edit error:", err);
            socket.emit("message_error", {
                message: "Failed to edit message",
                tempId
            });
        }
    });

    socket.on("delete_message", async ({ messageId, tempId }) => {
        if (!messageId) {
            return socket.emit("message_error", {
                message: "Message ID required",
                tempId
            });
        }

        try {
            const deleted = await MessageService.deleteMessage(messageId, userId);
            
            // Notify both parties
            io.to(deleted.senderId).emit("message_deleted", { 
                messageId,
                tempId
            });
            io.to(deleted.receiverId).emit("message_deleted", { 
                messageId,
                tempId
            });

        } catch (err) {
            console.error("💥 Message delete error:", err);
            socket.emit("message_error", {
                message: "Failed to delete message",
                tempId
            });
        }
    });

    socket.on("disconnect", () => {
        if (userId && userConnections.has(userId)) {
            const sockets = userConnections.get(userId);
            sockets.delete(socket.id);
            
            if (sockets.size === 0) {
                userConnections.delete(userId);
                socket.broadcast.emit("user_offline", { userId });
            }
        }
        console.log(`💬 Message socket disconnected: ${socket.id}`);
    });
}

module.exports = handleMessageSocket;