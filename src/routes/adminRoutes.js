const express = require("express");
const adminAuthController = require("../controllers/adminauthController");
const AdminController = require('../controllers/adminController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Authentication
 *     description: Admin registration and authentication
 *   - name: User Management
 *     description: Admin operations for managing users
 *   - name: Statistics
 *     description: Platform statistics
 *   - name: Report Management
 *     description: Handling user reports
 *   - name: Notifications
 *     description: Push notification management
 *   - name: Moderation
 *     description: Content moderation operations
 */

/**
 * @swagger
 * /api/admin/auth/signup:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Register a new admin account
 *     description: Creates a new admin user with elevated privileges
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, universityId, role]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@university.edu
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *               universityId:
 *                 type: string
 *                 example: UNIV-001
 *               role:
 *                 type: string
 *                 enum: [Admin, Teacher, Student]
 *                 example: Admin
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 universityId:
 *                   type: string
 *                 role:
 *                   type: string
 *       400:
 *         description: All fields are required
 *       500:
 *         description: Internal server error
 */
router.post('/auth/signup', adminAuthController.signup);

/**
 * @swagger
 * /api/admin/auth/signin:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Authenticate admin
 *     description: Returns JWT token for authenticated admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@university.edu
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 universityId:
 *                   type: string
 *                 role:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/signin', adminAuthController.signin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [User Management]
 *     summary: Get paginated list of users
 *     description: Retrieve users with pagination and search capabilities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - name: search
 *         in: query
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
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.get('/users', authMiddleware, adminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [User Management]
 *     summary: Update user activation status
 *     description: Enable or disable a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/status', authMiddleware, adminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [User Management]
 *     summary: Update user role
 *     description: Change a user's role (Admin, Teacher, Student)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Admin, Teacher, Student]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role specified
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 */
router.patch('/users/:id/role', authMiddleware, adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     tags: [User Management]
 *     summary: Update user details
 *     description: Modify user information (name, email, university ID)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               universityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [User Management]
 *     summary: Delete a user
 *     description: Permanently remove a user and all associated content
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/users/:id', authMiddleware, adminController.updateUserDetails);
router.delete('/users/:id', authMiddleware, adminController.deleteUser);

/**
 * @swagger
 * /api/admin/statistics/users:
 *   get:
 *     tags: [Statistics]
 *     summary: Get user statistics
 *     description: Retrieve platform user metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 *                 newUsers:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/statistics/users', authMiddleware, adminController.getUserStatistics);

/**
 * @swagger
 * /api/admin/statistics/content:
 *   get:
 *     tags: [Statistics]
 *     summary: Get content statistics
 *     description: Retrieve platform content metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPosts:
 *                   type: integer
 *                 totalGroups:
 *                   type: integer
 *                 totalEvents:
 *                   type: integer
 *                 pendingReports:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/statistics/content', authMiddleware, adminController.getContentStatistics);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     tags: [Report Management]
 *     summary: Get paginated reports
 *     description: Retrieve unresolved reports with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/reports', authMiddleware, adminController.getReports);

/**
 * @swagger
 * /api/admin/reports/{id}/resolve:
 *   post:
 *     tags: [Report Management]
 *     summary: Resolve a report
 *     description: Mark a report as resolved with action taken
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actionTaken:
 *                 type: string
 *                 description: Action taken to resolve the report
 *               adminId:
 *                 type: integer
 *                 description: ID of the admin resolving the report
 *     responses:
 *       200:
 *         description: Report resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Report not found
 */
router.post('/reports/:id/resolve', authMiddleware, adminController.resolveReport);

/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Send push notification
 *     description: Send notification to users via OneSignal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Important Update
 *               message:
 *                 type: string
 *                 example: New features available in the app
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific user IDs to target
 *                 example: ["user123", "user456"]
 *               segments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User segments to target
 *                 example: ["Active Users"]
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: OneSignal credentials not configured
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Notification failed
 */
router.post('/notifications', authMiddleware, adminController.sendPushNotification);

/**
 * @swagger
 * /api/admin/posts/{id}:
 *   delete:
 *     tags: [Moderation]
 *     summary: Delete post as admin
 *     description: Remove a post and all associated content (comments, reports)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: integer
 *                 description: ID of the admin performing the action
 *               reason:
 *                 type: string
 *                 description: Reason for deletion
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                   description: ID of the user who owned the post
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Post not found
 */
router.delete('/posts/:id', authMiddleware, adminController.deletePostAsAdmin);

/**
 * @swagger
 * /api/admin/moderation-logs:
 *   get:
 *     tags: [Moderation]
 *     summary: Get moderation logs
 *     description: Retrieve admin moderation actions with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: List of moderation logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModerationLog'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *       401:
 *         description: Unauthorized access
 */
router.get('/moderation-logs', authMiddleware, adminController.getModerationLogs);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         universityId:
 *           type: string
 *         profilePicture:
 *           type: string
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 * 
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         reporterId:
 *           type: integer
 *         reportedUserId:
 *           type: integer
 *         postId:
 *           type: integer
 *         commentId:
 *           type: integer
 *         reason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         resolved:
 *           type: boolean
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *         resolvedBy:
 *           type: integer
 *         actionTaken:
 *           type: string
 *         reporterName:
 *           type: string
 *         reportedName:
 *           type: string
 *         postText:
 *           type: string
 *         commentText:
 *           type: string
 * 
 *     ModerationLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         adminId:
 *           type: integer
 *         userId:
 *           type: integer
 *         actionType:
 *           type: string
 *           enum: [post_deletion, account_suspension, role_change]
 *         targetId:
 *           type: integer
 *         reason:
 *           type: string
 *         actionDate:
 *           type: string
 *           format: date-time
 *         adminFirstName:
 *           type: string
 *         adminLastName:
 *           type: string
 *         userFirstName:
 *           type: string
 *         userLastName:
 *           type: string
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
