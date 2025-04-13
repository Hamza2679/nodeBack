const express = require("express");
const { 
    createGroup, 
    getAllGroups, 
    getGroupById, 
    joinGroup,
    leaveGroup,
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
 * /api/groups/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:  # Use multipart/form-data for file uploads
 *           schema:
 *             type: object
 *             required:
 *               - name  # 'name' is required, while 'description' and 'image' are optional
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tech Enthusiasts"
 *                 description: "The name of the group (required)"
 *               description:
 *                 type: string
 *                 example: "A group for tech lovers"
 *                 description: "A brief description of the group (optional)"
 *               image:
 *                 type: string
 *                 format: binary  # This ensures the file is treated as binary data
 *                 description: "Group profile image (optional, must be uploaded as a file)"
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 */


router.post("/create", authenticateToken, upload.single("image"), createGroup);

/**
 * @swagger
 * /api/groups/all:
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
 * /api/groups/{id}:
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
 * /api/groups/{id}:
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
 *         description: "The unique ID of the group to be updated"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:  # Use multipart/form-data to support file uploads
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Group Name"
 *                 description: "The new name of the group (optional)"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *                 description: "A brief description of the group (optional)"
 *               image:
 *                 type: string
 *                 format: binary  # Ensures the image is treated as a file upload
 *                 description: "New group profile image (optional, must be uploaded as a file)"
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

router.post('/:groupId/join', authenticateToken, joinGroup);
router.delete('/:groupId/leave', authenticateToken, leaveGroup);

module.exports = router;
