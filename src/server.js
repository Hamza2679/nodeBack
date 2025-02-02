const express = require("express");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes"); // ✅ Import Admin Routes
const db = require("./config/db");
const swaggerDocs = require("../swagger");

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // ✅ Register Admin Routes

// ✅ Load Swagger Documentation at "/doc"
swaggerDocs(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

//let's try
