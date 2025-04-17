const express = require("express");
const multer = require("multer");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { likePost, unlikePost, getLikesByPost, addComment, getCommentsByPost, createPost, getPosts, getPostsByUserId, reportContent, editPost,  deletePost } = require("../controllers/postController");

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
 *       500:
 *         description: Server error
 */
router.get("/",authenticateToken, getPosts);

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
router.get("/:id", getPostsByUserId);

/**
 * @swagger
 * /api/posts/like:
 *   post:
 *     summary: Like a post
 *     description: Allows an authenticated user to like a post.
 *     tags:
 *       - Posts
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/like", authenticateToken, likePost);

/**
 * @swagger
 * /api/posts/unlike:
 *   post:
 *     summary: Unlike a post
 *     description: Allows an authenticated user to unlike a post.
 *     tags:
 *       - Posts
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/unlike", authenticateToken, unlikePost);

/**
 * @swagger
 * /api/posts/{postId}/likes:
 *   get:
 *     summary: Get likes for a post
 *     description: Retrieves all likes for a given post.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved likes
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get("/:postId/likes", getLikesByPost);

/**
 * @swagger
 * /api/posts/comment:
 *   post:
 *     summary: Add a comment to a post
 *     description: Allows an authenticated user to comment on a post.
 *     tags:
 *       - Posts
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/comment", authenticateToken, addComment);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     description: Retrieves all comments for a given post.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved comments
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get("/:postId/comments", getCommentsByPost);

/**
 * @swagger
 * /api/posts/report:
 *   post:
 *     summary: Report a post or comment
 *     description: Allows users to report inappropriate content.
 *     tags:
 *       - Posts
 *     responses:
 *       200:
 *         description: Report submitted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/report", authenticateToken, reportContent);
/**
 * @swagger
 * /api/posts/edit/{postId}:
 *   put:
 *     summary: Edit a post
 *     description: Allows users to edit their posts, including updating text or image.
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Updated post content"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */

router.put("/edit/:postId", authenticateToken, upload.single("image"), editPost);


/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management APIs
 */

/**
 * @swagger
 * /api/posts/delete/{postId}:
 *   delete:
 *     summary: Delete a post
 *     description: Allows a user to delete their post. Also removes associated reports, likes, and comments.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The unique ID of the post to delete
 *         schema:
 *           type: integer
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized request
 *       404:
 *         description: Post not found or unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:postId", authenticateToken, deletePost);




module.exports = router;
