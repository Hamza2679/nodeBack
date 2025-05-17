const express = require("express");
const { 
    createGroupPost, 
    getGroupPosts, 
    updateGroupPost,
    getGroupPostById, 
    createReply,
    postToFeed,
    deleteGroupPost 
} = require("../controllers/groupPostController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require('../middleware/upload');

const router = express.Router();
/**
 * @swagger
 * /api/groupPosts/create:
 *   post:
 *     summary: "Create a new group post"
 *     description: "Creates a new post in a group with optional image content."
 *     operationId: "createGroupPost"
 *     tags: [Group Posts]
 *     requestBody:
 *       description: "The content (text and image) for creating the new group post."
 *       content:
 *         multipart/form-data:
 *           required: true
 *           schema:
 *             type: "object"
 *             properties:
 *               group_id:
 *                 type: "integer"
 *                 description: "The ID of the group where the post is being created."
 *                 example: 1
 *               text:
 *                 type: "string"
 *                 description: "The text content of the post."
 *                 example: "This is a new group post."
 *               image:
 *                 type: "string"
 *                 format: "binary"
 *                 description: "An image to attach to the post. Optional."
 *     responses:
 *       '201':
 *         description: "Post created successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   type: "string"
 *                   example: "Group post created successfully."
 *                 post:
 *                   type: "object"
 *                   properties:
 *                     id:
 *                       type: "integer"
 *                       example: 1
 *                     group_id:
 *                       type: "integer"
 *                       example: 1
 *                     user_id:
 *                       type: "integer"
 *                       example: 26
 *                     text:
 *                       type: "string"
 *                       example: "This is a new group post."
 *                     image_url:
 *                       type: "string"
 *                       example: "https://your-bucket-name.s3.amazonaws.com/new-post-image.jpg"
 *                     created_at:
 *                       type: "string"
 *                       format: "date-time"
 *                       example: "2025-02-08T12:00:00Z"
 *       '400':
 *         description: "Bad Request. Missing required data."
 *       '401':
 *         description: "Unauthorized. The request requires authentication."
 *       '500':
 *         description: "Internal server error."
 *     security:
 *       - BearerAuth: []
 */
router.post("/create", authenticateToken, upload.single("image"), createGroupPost);


/**
 * @swagger
 * /api/group-posts/{groupId}:
 *   get:
 *     summary: Get all posts for a group
 *     tags: [Group Posts]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of group posts
 */
router.get("/:groupId", authenticateToken, getGroupPosts);

/**
 * @swagger
 * /api/group-posts/post/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Group Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Group post details
 */
router.get("/post/:id", authenticateToken, getGroupPostById);

/**
 * @swagger
 * /api/group-posts/{id}:
 *   delete:
 *     summary: Delete a group post
 *     tags: [Group Posts]
 */
router.delete("/:id", authenticateToken, deleteGroupPost);

/**
 * @swagger
 * /api/groupPosts/{id}:
 *   put:
 *     summary: "Update a group post"
 *     description: "Updates the content (text and image) of a specific group post by its ID."
 *     operationId: "updateGroupPost"
 *     tags: [Group Posts]
 *     parameters:
 *       - in: "path"
 *         name: "id"
 *         required: true
 *         description: "The ID of the group post to update."
 *         schema:
 *           type: "integer"
 *           example: 1
 *     requestBody:
 *       description: "The post content and optionally a new image to update the post."
 *       content:
 *         multipart/form-data:
 *           required: true
 *           schema:
 *             type: "object"
 *             properties:
 *               text:
 *                 type: "string"
 *                 description: "The text content of the post. If empty, it won't be updated."
 *                 example: "Updated text content"
 *               image:
 *                 type: "string"
 *                 format: "binary"
 *                 description: "A new image for the post. If no image is provided, the existing one remains unchanged."
 *     responses:
 *       '200':
 *         description: "Post updated successfully."
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 message:
 *                   type: "string"
 *                   example: "Post updated successfully"
 *                 post:
 *                   type: "object"
 *                   properties:
 *                     id:
 *                       type: "integer"
 *                       example: 1
 *                     group_id:
 *                       type: "integer"
 *                       example: 2
 *                     user_id:
 *                       type: "integer"
 *                       example: 26
 *                     text:
 *                       type: "string"
 *                       example: "Updated text content"
 *                     image_url:
 *                       type: "string"
 *                       example: "https://your-bucket-name.s3.amazonaws.com/new-image.jpg"
 *                     created_at:
 *                       type: "string"
 *                       format: "date-time"
 *                       example: "2025-02-08T12:00:00Z"
 *       '400':
 *         description: "Bad Request. Missing required data."
 *       '401':
 *         description: "Unauthorized. The request requires authentication."
 *       '403':
 *         description: "Forbidden. You are not allowed to update this post."
 *       '404':
 *         description: "Post not found or unauthorized. No post with the specified ID exists or the user is not the owner."
 *       '500':
 *         description: "Internal server error."
 *     security:
 *       - BearerAuth: []
 */
router.put("/:id", authenticateToken, upload.single("image"), updateGroupPost);

// In groupPostRoutes.js
router.post("/:postId/reply", authenticateToken, upload.single("image"), createReply);
/**
 * @swagger
 * /api/groupPosts/{postId}/post-to-feed:
 *   post:
 *     summary: Post a group message to main feed
 *     description: Group owner can promote a group post to the main feed
 *     tags: [Group Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Group post published to feed
 *       403:
 *         description: Not group owner
 *       404:
 *         description: Group post not found
 */
router.post(
    "/:postId/post-to-feed",
    authenticateToken,
    postToFeed
);
module.exports = router;
