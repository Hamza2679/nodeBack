const express = require("express");
const { 
    createGroup, 
    getAllGroups, 
    getGroupById, 
    updateGroup 
} = require("../controllers/groupController");
const { authenticateToken } = require("../middleware/authMiddleware");

const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: API endpoints for managing groups
 */

/**
 * @swagger
 * /groups/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tech Enthusiasts"
 *               description:
 *                 type: string
 *                 example: "A group for tech lovers"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/group.jpg"
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Group name is required
 *       401:
 *         description: Unauthorized
 */
router.post("/create", authenticateToken, upload.single("image"), createGroup);

/**
 * @swagger
 * /groups/all:
 *   get:
 *     summary: Get all groups
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *       401:
 *         description: Unauthorized
 */
router.get("/all", authenticateToken, getAllGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get a group by ID
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Group details
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", authenticateToken, getGroupById);

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update a group by ID
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *                 example: "Updated Group Name"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               imageUrl:
 *                 type: file
 *                 example: " "
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.put("/edit/:GroupId", authenticateToken, upload.single("image"), updateGroup);

module.exports = router;
