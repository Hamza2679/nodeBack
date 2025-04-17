const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); 
const path = require("path");
const http = require("http"); // Add this
const { Server } = require("socket.io"); // Add this

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupPostRoutes = require("./routes/groupPostRoutes");
const eventRoutes = require("./routes/eventRoutes");
const messageRoutes = require('./routes/messageRoutes');
const followRoutes = require('./routes/followRoutes');

const db = require("./config/db");
const swaggerDocs = require("../swagger");

dotenv.config();
const app = express();
const server = http.createServer(app); // 👈 Wrap Express with HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // You can customize this as needed
    methods: ["GET", "POST"]
  }
});

// 🧠 Socket.IO Logic
const users = new Map();

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("register", (userId) => {
    users.set(userId, socket.id);
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, receiverId, text, image } = data;

    // Save message in DB via your service (you can import and use it here)
    // const message = await MessageService.createMessage(senderId, receiverId, text, image);

    const message = {
      id: Date.now(),
      senderId,
      receiverId,
      text,
      image,
      createdAt: new Date()
    };

    const receiverSocketId = users.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", message);
    }

    // Optionally confirm to sender
    socket.emit("message_sent", message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    for (const [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        break;
      }
    }
  });
});

// 🎯 CORS
const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:2919"];
app.use(cors({
  origin: true,
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

// 📦 Middlewares & Routes
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groupPosts", groupPostRoutes);
app.use("/api/events", eventRoutes);
app.use('/api/followRo', followRoutes);
app.use('/api/messages', messageRoutes);

swaggerDocs(app);

// 🚀 Launch server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
