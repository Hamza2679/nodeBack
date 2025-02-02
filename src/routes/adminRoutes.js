const express = require("express");
const adminAuthController = require("../controllers/adminauthController");

const router = express.Router();

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
 * /api/auth/signin:
 *   post:
 *     summary: Authenticate user
 *     description: Logs in an existing user and returns user details.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *                -universityId
 *               - email
 *               - password
 *             properties:
 *              universityId:
 *                type: string
 *               example: UNI12345
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password required
 *       401:
 *         description: Invalid credentials
 */
router.post("/signin", authController.signin);

module.exports = router;
