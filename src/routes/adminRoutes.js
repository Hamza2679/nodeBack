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

router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/reports', AdminController.getReports);
router.post('/reports/:id/resolve', AdminController.resolveReport);
router.get('/users', AdminController.getUsers);
router.put('/users/:id/status', AdminController.updateUserStatus);
router.put('/users/:id/role', AdminController.updateUserRole);
router.put('/users/:id/details', AdminController.updateUserDetails);
router.delete('/users/:id', AdminController.softDeleteUser);


module.exports = router;
