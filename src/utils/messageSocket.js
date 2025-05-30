const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../middleware/upload");
const { verifyToken } = require("../middleware/authMiddleware.js");
const User = require("../models/user");

let io = null;
const userConnectionCount = new Map();

// Enhanced logging
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

    // Enhanced authentication middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        logSocketEvent("AUTH_ATTEMPT", { socketId: socket.id, hasToken: !!token });

        if (!token) {
            logSocketEvent("AUTH_FAIL_NO_TOKEN", { socketId: socket.id });
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                logSocketEvent("AUTH_FAIL_USER_NOT_FOUND", { userId: decoded.userId });
                return next(new Error("User not found"));
            }

            socket.user = {
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                role: user.role
            };

            logSocketEvent("AUTH_SUCCESS", { userId: socket.user.id, socketId: socket.id });
            next();
        } catch (err) {
            logSocketEvent("AUTH_FAIL_INVALID_TOKEN", { error: err.message });
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        logSocketEvent("CONNECTION", { 
            socketId: socket.id, 
            userId: socket.user?.id 
        });

        // Join personal room
        if (socket.user?.id) {
            socket.join(socket.user.id);
            logSocketEvent("JOIN_PERSONAL_ROOM", {
                userId: socket.user.id,
                socketId: socket.id
            });
        }
        
        // Online status tracking
        if (socket.user?.id) {
            const prevCount = userConnectionCount.get(socket.user.id) || 0;
            userConnectionCount.set(socket.user.id, prevCount + 1);

            if (prevCount === 0) {
                logSocketEvent("USER_ONLINE", { userId: socket.user.id });
                socket.broadcast.emit("user_online", { userId: socket.user.id });
            }

            const onlineUsers = Array.from(userConnectionCount.keys())
                .filter(id => userConnectionCount.get(id) > 0)
                .map(id => ({ userId: id }));

            socket.emit("initial_status", onlineUsers);
            logSocketEvent("INITIAL_STATUS_SENT", { 
                userId: socket.user.id, 
                onlineUsersCount: onlineUsers.length 
            });
        }

        // Group room handlers
        socket.on("join_group", (groupId) => {
            if (!groupId) {
                logSocketEvent("JOIN_GROUP_INVALID", { 
                    socketId: socket.id, 
                    userId: socket.user?.id,
                    error: "Missing groupId"
                });
                return;
            }

            const roomName = `group_${groupId}`;
            socket.join(roomName);
            
            logSocketEvent("JOIN_GROUP_SUCCESS", {
                userId: socket.user?.id,
                groupId,
                roomName,
                socketId: socket.id
            });
            
            // Acknowledge join
            socket.emit("group_joined", { groupId });
        });

        socket.on("leave_group", (groupId) => {
            if (!groupId) {
                logSocketEvent("LEAVE_GROUP_INVALID", { 
                    socketId: socket.id, 
                    userId: socket.user?.id,
                    error: "Missing groupId"
                });
                return;
            }

            const roomName = `group_${groupId}`;
            socket.leave(roomName);
            
            logSocketEvent("LEAVE_GROUP_SUCCESS", {
                userId: socket.user?.id,
                groupId,
                roomName,
                socketId: socket.id
            });
            
            // Acknowledge leave
            socket.emit("group_left", { groupId });
        });

        // Status check handler
        socket.on("check_status", (targetUserId) => {
            if (!targetUserId) {
                logSocketEvent("CHECK_STATUS_INVALID", {
                    socketId: socket.id,
                    error: "Missing targetUserId"
                });
                return;
            }
            
            const userIdToCheck = targetUserId?.userId || targetUserId;
            const isOnline = userConnectionCount.has(userIdToCheck) && 
                             userConnectionCount.get(userIdToCheck) > 0;
            
            logSocketEvent("USER_STATUS_CHECKED", {
                requestedBy: socket.user?.id,
                targetUserId: userIdToCheck,
                isOnline
            });
            
            socket.emit("user_status", {
                userId: userIdToCheck,
                isOnline: isOnline
            });
        });

        // Message handlers
        socket.on("send_message", async (data) => {
            const { senderId, receiverId, text, image } = data;
            
            logSocketEvent("SEND_MESSAGE_ATTEMPT", {
                senderId,
                receiverId,
                textLength: text?.length || 0,
                hasImage: !!image
            });

            if (!senderId || !receiverId || (!text && !image)) {
                logSocketEvent("SEND_MESSAGE_INVALID", {
                    error: "Invalid message data",
                    data
                });
                return socket.emit("error", { message: "Invalid message data." });
            }

            try {
                let imageUrl = null;

                if (image && image.base64 && image.name) {
                    logSocketEvent("MESSAGE_IMAGE_UPLOAD_START", {
                        fileName: image.name,
                        size: image.base64.length
                    });
                    const buffer = Buffer.from(image.base64, "base64");
                    const fileName = `${Date.now()}-${image.name}`;
                    imageUrl = await uploadToS3(buffer, fileName, "social-sync-for-final");
                    logSocketEvent("MESSAGE_IMAGE_UPLOAD_SUCCESS", { imageUrl });
                }

                const message = await MessageService.createMessage(senderId, receiverId, text, imageUrl);
                logSocketEvent("MESSAGE_CREATED", { messageId: message.id });

                // Emit to receiver's room
                io.to(receiverId).emit("receive_message", message);
                logSocketEvent("MESSAGE_DELIVERED_RECEIVER", { receiverId });

                // Emit to sender's room
                io.to(senderId).emit("receive_message", message);
                logSocketEvent("MESSAGE_DELIVERED_SENDER", { senderId });

            } catch (err) {
                logSocketEvent("SEND_MESSAGE_ERROR", {
                    error: err.message,
                    stack: err.stack
                });
                socket.emit("error", { message: "Failed to send message." });
            }
        });

        socket.on("edit_message", async (data) => {
            const { messageId, newText } = data;
            
            logSocketEvent("EDIT_MESSAGE_ATTEMPT", {
                userId: socket.user?.id,
                messageId,
                newText
            });

            if (!messageId || !newText) {
                logSocketEvent("EDIT_MESSAGE_INVALID", { error: "Invalid edit request" });
                return socket.emit("error", { message: "Invalid edit request." });
            }

            try {
                const editedMessage = await MessageService.editMessage(
                    messageId, 
                    socket.user?.id, // Use authenticated user ID
                    newText
                );
                
                logSocketEvent("MESSAGE_EDITED", {
                    messageId,
                    editorId: socket.user?.id
                });

                // Emit to both sender and receiver
                if (editedMessage) {
                    io.to(editedMessage.senderId).emit("message_edited", editedMessage);
                    io.to(editedMessage.receiverId).emit("message_edited", editedMessage);
                }
                
            } catch (err) {
                logSocketEvent("EDIT_MESSAGE_ERROR", {
                    error: err.message,
                    stack: err.stack
                });
                socket.emit("error", { message: "Failed to edit message." });
            }
        });

        socket.on("delete_message", async (data) => {
            const { messageId } = data;
            
            logSocketEvent("DELETE_MESSAGE_ATTEMPT", {
                userId: socket.user?.id,
                messageId
            });

            if (!messageId) {
                logSocketEvent("DELETE_MESSAGE_INVALID", { error: "Message ID required" });
                return socket.emit("error", { message: "Message ID required." });
            }

            try {
                const deletedMessage = await MessageService.deleteMessage(
                    messageId, 
                    socket.user?.id // Use authenticated user ID
                );
                
                logSocketEvent("MESSAGE_DELETED", {
                    messageId,
                    deleterId: socket.user?.id
                });

                // Emit to both sender and receiver
                if (deletedMessage) {
                    io.to(deletedMessage.senderId).emit("message_deleted", { messageId });
                    io.to(deletedMessage.receiverId).emit("message_deleted", { messageId });
                }
                
            } catch (err) {
                logSocketEvent("DELETE_MESSAGE_ERROR", {
                    error: err.message,
                    stack: err.stack
                });
                socket.emit("error", { message: "Failed to delete message." });
            }
        });

        // Disconnection handler
        socket.on("disconnect", (reason) => {
            logSocketEvent("DISCONNECT_START", { 
                socketId: socket.id, 
                userId: socket.user?.id,
                reason
            });

            if (socket.user?.id) {
                const count = userConnectionCount.get(socket.user.id) || 1;
                if (count <= 1) {
                    userConnectionCount.delete(socket.user.id);
                    logSocketEvent("USER_OFFLINE", { userId: socket.user.id });
                    socket.broadcast.emit("user_offline", { userId: socket.user.id });
                } else {
                    userConnectionCount.set(socket.user.id, count - 1);
                }

                // Leave all group rooms
                const groupRooms = Array.from(socket.rooms).filter(room => 
                    room.startsWith('group_')
                );
                
                groupRooms.forEach(room => {
                    const groupId = room.replace('group_', '');
                    logSocketEvent("AUTO_LEAVE_GROUP", {
                        userId: socket.user.id,
                        groupId,
                        room
                    });
                });
            }
            
            logSocketEvent("DISCONNECT_COMPLETE", { socketId: socket.id });
        });
    });
}

function getIO() {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
}

module.exports = { initSocket, getIO };