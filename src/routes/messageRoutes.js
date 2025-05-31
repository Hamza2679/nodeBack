const express = require("express");
const multer = require("multer");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const {
    sendMessage,
    getConversation,
    getRecentChats,
    editMessage,
    deleteMessage,
} = require("../controllers/messageController");

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management APIs
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a text or image message to another user.
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: ID of the recipient
 *                 example: 123
 *               text:
 *                 type: string
 *                 description: Text content of the message
 *                 example: "Hello, how are you?"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", authenticateToken, upload.single("image"), sendMessage);

/**
 * @swagger
 * /api/messages/conversation/{userId}:
 *   get:
 *     summary: Get conversation with a user
 *     description: Retrieve the conversation between the authenticated user and another user.
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *     responses:
 *       200:
 *         description: Successfully retrieved conversation
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/conversation/:userId", authenticateToken, getConversation);

/**
 * @swagger
 * /api/messages/recent:
 *   get:
 *     summary: Get recent chats
 *     description: Retrieve the most recent chats for the authenticated user.
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved recent chats
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/recent", authenticateToken, getRecentChats);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   patch:
 *     summary: Edit a message
 *     description: Edit a message (only the sender can edit their own message).
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: New text for the message
 *                 example: "Updated message text"
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (e.g., user is not the sender)
 *       500:
 *         description: Server error
 */
router.patch("/:messageId", authenticateToken, editMessage);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     description: Delete a message (both sender and receiver can delete).
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.delete("/:messageId", authenticateToken, deleteMessage);

/**
 * @swagger
 * /api/messages/conversation/{receiverId}/paginated:
 *   get:
 *     summary: Get paginated messages between users
 *     description: Retrieve a paginated list of messages between the authenticated user and another user.
 *     tags:
 *       - Messages
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the other user in the conversation
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of messages to fetch (default 20)
 *         example: 20
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of messages to skip (default 0)
 *         example: 0
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated messages
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
    "/conversation/:receiverId/paginated",
    authenticateToken,
    require("../controllers/messageController").getPaginatedMessages
  );
  

module.exports = router;