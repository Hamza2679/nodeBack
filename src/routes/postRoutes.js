const express = require("express");
const multer = require("multer");
const { createPost, getPosts, getPostById } = require("../controllers/postController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post creation and retrieval APIs
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
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/create", authenticateToken, upload.single("image"), createPost);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieves all posts from the database.
 *     tags:
 *       - Posts
 *     responses:
 *       200:
 *         description: Successfully retrieved posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 123
 *                       text:
 *                         type: string
 *                         example: "Hello World!"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://social-sync-for-final.s3.eu-north-1.amazonaws.com/my-image.jpg"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get("/", getPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     description: Retrieves a single post by its unique ID.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the post
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved the post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getPostById);

module.exports = router;
