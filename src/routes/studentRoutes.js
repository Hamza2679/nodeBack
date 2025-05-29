const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require('../middleware/upload');
const studentController = require("../controllers/studentController");

router.post("/create", authenticateToken, upload.single("image"), studentController.createStudent);
router.get("/:universityId",  studentController.getStudentByUniversityId);


module.exports = router;
