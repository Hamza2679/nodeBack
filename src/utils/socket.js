// const jwt = require("jsonwebtoken");
// let io = null;

// module.exports = {
//     init: (server) => {
//         io = require("socket.io")(server, {
//             cors: {
//                 origin: "*",
//                 methods: ["GET", "POST"],
//                 credentials: true
//             }
//         });

//         // Authentication middleware
//         io.use((socket, next) => {
//             const token = socket.handshake.auth.token;
//             if (!token) return next(new Error("Authentication error"));
            
//             try {
//                 const decoded = jwt.verify(token, process.env.JWT_SECRET);
//                 socket.user = decoded;
//                 next();
//             } catch (err) {
//                 next(new Error("Invalid token"));
//             }
//         });

//         io.on("connection", (socket) => {
//             console.log(`🔌 User ${socket.user?.userId} connected: ${socket.id}`);

//             // Group Room Management
//             socket.on("join_group", (groupId) => {
//                 socket.join(`group_${groupId}`);
//                 console.log(`📥 User joined group_${groupId}`);
//             });

//             socket.on("leave_group", (groupId) => {
//                 socket.leave(`group_${groupId}`);
//                 console.log(`📤 User left group_${groupId}`);
//             });

//             // Post-specific rooms
//             socket.on("join_post", (postId) => {
//                 socket.join(`post_${postId}`);
//                 console.log(`📥 User joined post_${postId}`);
//             });

//             // Remove the group_post_update handler - it's not needed
//             // (We're handling emissions directly in controllers)

//             socket.on("disconnect", () => {
//                 console.log(`❌ User disconnected: ${socket.id}`);
//             });
//         });

//         return io;
//     },
//     getIO: () => {
//         if (!io) throw new Error("Socket.io not initialized!");
//         return io;
//     }
// };