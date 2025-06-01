const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupPostRoutes = require("./routes/groupPostRoutes");
const eventRoutes = require("./routes/eventRoutes");
const messageRoutes = require("./routes/messageRoutes");
const followRoutes = require("./routes/followRoutes");
const studentRoutes = require("./routes/studentRoutes"); 
const reportRoutes = require("./routes/reportRoutes");
const groupPostReportRoutes = require('./routes/groupPostReportRoutes');
const notificationsRouter = require('./routes/notificationsRouter');
const eventNotificationsRouter = require('./routes/eventNotificationsRouter');



const db = require("./config/db");
const swaggerDocs = require("../swagger");

dotenv.config();
const app = express();
const server = http.createServer(app);

const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:2919"];
app.use(cors({
  origin: true,
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use('/api', reportRoutes);
app.use('/api', groupPostReportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groupPosts", groupPostRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/followRo", followRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api', eventNotificationsRouter);



swaggerDocs(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
