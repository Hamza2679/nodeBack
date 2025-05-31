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
    joinGroupUsAdmin,
    removeMember,
    deleteGroup,
    isAdmin,
    deleteGroupAndReports,
    getReportedGroups
} = require("../controllers/groupController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

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

/**
 * @swagger
 * /api/groups/{groupId}/join:
 *   post:
 *     summary: Join a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joined group successfully
 *       400:
 *         description: Already a member
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.post('/:groupId/join', authenticateToken, joinGroup);

/**
 * @swagger
 * /api/groups/{groupId}/joinUsAdmin:
 *   post:
 *     summary: Join a group as admin
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Joined group as admin successfully
 *       400:
 *         description: Already a member
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.post('/:groupId/joinUsAdmin', authenticateToken, joinGroupUsAdmin);

/**
 * @swagger
 * /api/groups/{groupId}/leave:
 *   delete:
 *     summary: Leave a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Left group successfully
 *       400:
 *         description: Not a member
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.delete('/:groupId/leave', authenticateToken, leaveGroup);

/**
 * @swagger
 * /api/groups/{id}/admin:
 *   get:
 *     summary: Check if current user is admin of the group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
router.get('/:id/admin', authenticateToken, isAdmin);

/**
 * @swagger
 * /api/groups/delete/{groupId}:
 *   delete:
 *     summary: Delete a group (owner only)
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this group
 *       404:
 *         description: Group not found
 */
router.delete("/delete/:groupId", authenticateToken, deleteGroup);

/**
 * @swagger
 * /api/groups/admin/groups/reported:
 *   get:
 *     summary: Get all reported groups (admin only)
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of reported groups
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get(
  '/admin/groups/reported',
  authenticateToken,
  authorizeRoles(['admin']),
  getReportedGroups
);

/**
 * @swagger
 * /api/groups/admin/groups/{groupId}:
 *   delete:
 *     summary: Delete a group and its reports (admin only)
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Group and its reports deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Group not found
 */
router.delete(
  '/admin/groups/:groupId',
  authenticateToken,
  authorizeRoles(['admin']),
  deleteGroupAndReports
);

module.exports = router;
