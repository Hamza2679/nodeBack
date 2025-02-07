const express = require("express");
const { createGroup } = require("../controllers/groupController");
const { authenticateToken } = require("../middleware/authMiddleware"); // ✅ Import the correct function


const router = express.Router();


router.post("/create", authenticateToken, createGroup);


module.exports = router;
