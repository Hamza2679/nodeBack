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

dotenv.config();
const app = express();

// Define allowed origins
const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:2919"];

// Use CORS with a custom origin callback
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groupPosts", groupPostRoutes);
swaggerDocs(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
