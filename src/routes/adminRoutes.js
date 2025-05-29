const express = require("express");
const adminAuthController = require("../controllers/adminauthController");
const AdminController = require('../controllers/adminController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin authentication and management APIs
 */

/**
 * @swagger
 * /api/admin/signup:
 *   post:
 *     summary: Register an admin
 *     description: Allows an admin to sign up with required details.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - universityId
 *               - role
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
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securepassword
 *               universityId:
 *                 type: string
 *                 example: UNI12345
 *               role:
 *                 type: string
 *                 example: teacher
 *     responses:
 *       201:
 *         description: Admin successfully registered
 *       400:
 *         description: Bad request (missing fields or validation error)
 *       500:
 *         description: Server error
 */
router.post("/signup", adminAuthController.signup);

/**
 * @swagger
 * /api/admin/signin:
 *   post:
 *     summary: Authenticate an admin
 *     description: Logs in an admin and returns admin details.
 *     tags:
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - universityId
 *               - email
 *               - password
 *             properties:
 *               universityId:
 *                 type: string
 *                 example: UNI12345
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Admin login successful
 *       400:
 *         description: Email and password required
 *       401:
 *         description: Invalid credentials
 */
router.post("/signin", adminAuthController.signin);

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Retrieve statistics for the admin dashboard.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/stats', AdminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get all user reports
 *     description: Retrieve all user reports for review.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/reports', AdminController.getReports);

/**
 * @swagger
 * /api/admin/reports/{id}/resolve:
 *   post:
 *     summary: Resolve a user report
 *     description: Mark a specific user report as resolved.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report resolved successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
router.post('/reports/:id/resolve', AdminController.resolveReport);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/users', AdminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update user status
 *     description: Update the status of a user (e.g., active, suspended).
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.put('/users/:id/status', AdminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     description: Update the role of a user.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: student
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.put('/users/:id/role', AdminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/details:
 *   put:
 *     summary: Update user details
 *     description: Update details of a user.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.put('/users/:id/details', AdminController.updateUserDetails);

// router.delete('/users/:id', AdminController.softDeleteUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Permanently delete a user by ID.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/users/:id', AdminController.deleteUser);

/**
 * @swagger
 * /api/admin/posts/{id}:
 *   delete:
 *     summary: Delete a post as admin
 *     description: Delete a post by ID as an admin.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/posts/:id', AdminController.deletePostAsAdmin);

/**
 * @swagger
 * /api/admin/send-notification:
 *   post:
 *     summary: Send push notification
 *     description: Send a push notification to users.
 *     tags:
 *       - Admin
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
 *                 example: The system will be down for maintenance tonight.
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/send-notification', AdminController.sendPushNotification);

/**
 * @swagger
 * /api/admin/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Reset the password for a user by ID.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: newsecurepassword
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.post('/users/:id/reset-password', AdminController.resetUserPassword);


module.exports = router;
