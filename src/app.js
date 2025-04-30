const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);

app.get("/v", (req, res) => res.send("Welcome to API"));

module.exports = app;