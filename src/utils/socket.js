// socket.js
let io = null;

module.exports = {
    init: (server) => {
        io = require("socket.io")(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
// Modify the existing socket.io initialization to handle group post events
io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Group Room Management
    socket.on("join_group", (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`📥 User joined group room: group_${groupId}`);
    });

    socket.on("leave_group", (groupId) => {
        socket.leave(`group_${groupId}`);
        console.log(`📤 User left group room: group_${groupId}`);
    });
 socket.on("join_post", (postId) => {
        socket.join(`post_${postId}`);
        console.log(`📥 User joined post room: post_${postId}`);
    });

    socket.on("leave_post", (postId) => {
        socket.leave(`post_${postId}`);
        console.log(`📤 User left post room: post_${postId}`);
    });

    // Add group post event listeners
    socket.on("group_post_action", (data) => {
        console.log(`Received group post action: ${data.action}`);
        // Handle any client-initiated post actions if needed
    });

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
    });
});

        return io;
    },

    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
