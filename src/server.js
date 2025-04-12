const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); 
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");
const groupPostRoutes = require("./routes/groupPostRoutes");
const db = require("./config/db");
const swaggerDocs = require("../swagger");
const eventRoutes = require("./routes/eventRoutes");
const path = require("path");
const messageRoutes = require('./routes/messageRoutes'); // Import message routes
const followRoutes = require('./routes/followRoutes');


dotenv.config();
const app = express();

// Define allowed origins
const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:2919"];

app.use(cors({
    origin: true, // Reflects the request origin, effectively allowing all origins
    methods: "GET,POST,PUT,DELETE",
    credentials: true
  }));
  

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
