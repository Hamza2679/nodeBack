const express = require("express");
const { createGroup , getAllGroups, getGroupById} = require("../controllers/groupController");
const { authenticateToken } = require("../middleware/authMiddleware"); // ✅ Import the correct function


const router = express.Router();


router.post("/create", authenticateToken, createGroup);
router.get("/all", authenticateToken, getAllGroups);
router.get("/:id", authenticateToken, getGroupById);



module.exports = router;
