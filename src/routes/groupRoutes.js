const express = require("express");
const { 
    createGroup, 
    getAllGroups, 
    getGroupById, 
    joinGroup,
    leaveGroup,
    updateGroup ,
    getGroupMembers,
    reportGroup,
    removeMember,
    deleteGroup
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


router.get('/:id/members', authenticateToken, getGroupMembers);
router.delete("/delete/:groupId", authenticateToken, deleteGroup);




/**
 * @swagger
 * /api/groups/{id}/members:
 *   get:
 *     summary: Get members of a group
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
 *         description: List of group members
 *       404:
 *         description: Group not found
 *       401:
 *         description: Unauthorized
 */


// Report a group
/**
 * @swagger
 * /api/groups/{groupId}/report:
 *   post:
 *     summary: Report a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group reported successfully
 *       400:
 *         description: Missing reason or invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/:groupId/report', authenticateToken, reportGroup);

// Remove a member
/**
 * @swagger
 * /api/groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from the group (Owner only)
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Unauthorized action
 *       404:
 *         description: Group or user not found
 */
router.delete('/:groupId/members/:userId', authenticateToken, removeMember);

module.exports = router;
