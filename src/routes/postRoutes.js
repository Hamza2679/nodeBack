const express = require("express");
const postController = require("../controllers/postController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/posts/create:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with text or an image.
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content of the post (optional)
 *               imageUrl:
 *                 type: string
 *                 description: The image URL for the post (optional)
 *     responses:
 *       201:
 *         description: Post successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The ID of the post
 *                 userid:
 *                   type: integer
 *                   description: The ID of the user who created the post
 *                 text:
 *                   type: string
 *                   description: The content of the post
 *                 image_url:
 *                   type: string
 *                   description: The image URL for the post
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the post was created
 *       400:
 *         description: Bad Request (invalid data)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       403:
 *         description: Forbidden (invalid token)
 *       500:
 *         description: Internal Server Error
 */

router.post("/create", authenticateToken, postController.createPost); // ✅ Middleware applied

module.exports = router;
