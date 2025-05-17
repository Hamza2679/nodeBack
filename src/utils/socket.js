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

        io.on("connection", (socket) => {
            console.log("🔌 Client connected:", socket.id);

            socket.on("join_group", (groupId) => {
                socket.join(`group_${groupId}`);
                console.log(`📥 User joined group room: group_${groupId}`);
            });

            socket.on("leave_group", (groupId) => {
                socket.leave(`group_${groupId}`);
                console.log(`📤 User left group room: group_${groupId}`);
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
