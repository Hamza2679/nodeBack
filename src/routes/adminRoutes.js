// routes/adminRoutes.js
const express = require("express");
const adminAuthController = require("../controllers/adminauthController");
const AdminService = require('../services/adminService');
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();
const { pool } = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Admin Authentication
 *     description: Admin registration and authentication
 *   - name: Dashboard
 *     description: Admin dashboard statistics
 *   - name: Reports
 *     description: Report management
 *   - name: User Management
 *     description: User management operations
 *   - name: Notifications
 *     description: Push notification management
 *   - name: Content Moderation
 *     description: Content moderation operations
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         isActive:
 *           type: boolean
 *         role:
 *           type: string
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         reporterId:
 *           type: string
 *         contentId:
 *           type: string
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *     Notification:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         userIds:
 *           type: array
 *           items:
 *             type: string
 *         segments:
 *           type: array
 *           items:
 *             type: string
 */

// Public endpoints
/**
 * @swagger
 * /admin/signup:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Register a new admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/signup", adminAuthController.signup);

/**
 * @swagger
 * /admin/signin:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Authenticate admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/signin", adminAuthController.signin);

// Protect below endpoints
router.use(authenticateToken, authorizeRoles(["admin"]));

// Dashboard Statistics
/**
 * @swagger
 * /admin/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userStats:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         activeUsers:
 *                           type: number
 *                     contentStats:
 *                       type: object
 *                       properties:
 *                         totalPosts:
 *                           type: number
 *                         reportedPosts:
 *                           type: number
 *       500:
 *         description: Server error
 */
router.get("/dashboard/stats", async (req, res) => {
  try {
    const [userStats, contentStats] = await Promise.all([
      AdminService.getUserStatistics(),
      AdminService.getContentStatistics()
    ]);
    res.json({ success: true, data: { userStats, contentStats } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report Management
/**
 * @swagger
 * /admin/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Get paginated reports
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *       500:
 *         description: Server error
 */
router.get("/reports", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reports = await AdminService.getReports(parseInt(page, 10), parseInt(limit, 10));
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /admin/reports/{id}/resolve:
 *   post:
 *     tags: [Reports]
 *     summary: Resolve a report
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionTaken
 *             properties:
 *               actionTaken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Missing actionTaken
 *       500:
 *         description: Server error
 */
router.post("/reports/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken } = req.body;
    if (!actionTaken) return res.status(400).json({ success: false, message: "actionTaken is required" });

    const report = await AdminService.resolveReport(id, req.user.id, actionTaken);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// User Management
/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [User Management]
 *     summary: Get paginated users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const users = await AdminService.getUsers(parseInt(page, 10), parseInt(limit, 10), search);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     tags: [User Management]
 *     summary: Update user status
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid isActive value
 *       500:
 *         description: Server error
 */
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }
    const user = await AdminService.updateUserStatus(id, isActive);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     tags: [User Management]
 *     summary: Update user role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Role is required
 *       500:
 *         description: Server error
 */
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        error: "Role is required" 
      });
    }

    const updatedUser = await AdminService.updateUserRole(id, role);
    
    res.json({ 
      success: true,
      data: updatedUser 
    });
    
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}/details:
 *   put:
 *     tags: [User Management]
 *     summary: Update user details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: User details updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: No updates provided
 *       500:
 *         description: Server error
 */
router.put("/users/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }
    const user = await AdminService.updateUserDetails(id, updates);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     tags: [User Management]
 *     summary: Soft delete a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User soft deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/users/:id', async (req, res) => {
  try {
    console.log('Attempting soft delete for user:', req.params.id);
    
    const result = await pool.query(
      `UPDATE users 
       SET is_deleted = true, 
           deleted_at = NOW() 
       WHERE id = $1 
       RETURNING id, email, deleted_at`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Soft delete error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}/reset-password:
 *   post:
 *     tags: [User Management]
 *     summary: Initiate password reset for user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    // Implement your password reset logic here
    // This might generate a reset token and send an email
    res.json({ success: true, message: "Password reset initiated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Push Notifications
/**
 * @swagger
 * /admin/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Send push notification
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               segments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Title and message are required
 *       500:
 *         description: Server error
 */
router.post("/notifications", async (req, res) => {
  try {
    const { title, message, userIds, segments } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "title and message are required" });
    }
    const response = await AdminService.sendPushNotification({ title, message, userIds, segments: segments || ["All"] });
    res.json({ success: true, data: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /admin/send-notification:
 *   post:
 *     tags: [Notifications]
 *     summary: Send push notification (alternative endpoint)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               segments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/send-notification', async (req, res) => {
  const { title, message, userIds, segments } = req.body;
  try {
    const response = await AdminService.sendPushNotification({
      title,
      message,
      userIds:  userIds  || [],
      segments: segments || []
    });

    res
      .status(response.statusCode)
      .json({
        success: true,
        data: response.body
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: err.message
      });
  }
});

// Content Moderation
/**
 * @swagger
 * /admin/posts/{id}:
 *   delete:
 *     tags: [Content Moderation]
 *     summary: Delete a post as admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       200:
 *         description: Post deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Reason is required
 *       500:
 *         description: Server error
 */
router.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "reason is required" });

    const result = await AdminService.deletePostAsAdmin(id, req.user.id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /admin/moderation-logs:
 *   get:
 *     tags: [Content Moderation]
 *     summary: Get moderation logs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Moderation logs retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get("/moderation-logs", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const logs = await AdminService.getModerationLogs(parseInt(page, 10), parseInt(limit, 10));
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;