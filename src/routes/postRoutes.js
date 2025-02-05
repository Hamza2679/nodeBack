const express = require("express");
const multer = require("multer");
const { createPost } = require("../controllers/postController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store in memory

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post creation and management APIs
 */

/**
 * @swagger
 * /api/posts/create:
 *   post:
 *     summary: Create a new post
 *     description: Allows users to create a post with text and/or an image.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text content for the post.
 *                 example: "This is my first post!"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the post.
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post created successfully"
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 123
 *                     text:
 *                       type: string
 *                       example: "This is my first post!"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://social-sync-for-final.s3.eu-north-1.amazonaws.com/my-image.jpg"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-02-05T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-02-05T12:00:00.000Z"
 *       400:
 *         description: Missing fields or invalid data
 *       401:
 *         description: Unauthorized - No valid token
 *       500:
 *         description: Server error
 */

router.post("/create", authenticateToken, upload.single("image"), createPost);

module.exports = router;
