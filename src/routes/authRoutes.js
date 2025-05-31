const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication APIs
 *   - name: Users
 *     description: User management APIs
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user (Legacy)
 *     description: Creates a new user in the database (without university verification)
 *     tags: [Authentication]
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
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/signup", authController.signup);

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Authenticate user
 *     description: Logs in an existing user and returns user details
 *     tags: [Authentication]
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
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securepassword
 *     responses:
 *       200:
 *         description: Login successful
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
 *                 role:
 *                   type: string
 *                 universityId:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Email and password required
 *       401:
 *         description: Invalid credentials
 */
router.post("/signin", authController.signin);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out a user by deleting their access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 12345
 *               token:
 *                 type: string
 *                 example: "your_jwt_token_here"
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Missing userId or token
 *       500:
 *         description: Internal server error
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       500:
 *         description: Internal server error
 */
router.post("/send-otp", authController.sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newsecurepassword
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Email and new password required
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users
 *     description: Fetches a list of all registered users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal Server Error
 */
router.get("/users", authController.getAllUsers);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Fetches a single user by their unique ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/users/:id", authController.getUserById);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Deletes a user from the system by their unique ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the user to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/users/:id", authController.deleteUser);

/**
 * @swagger
 * /api/auth/signup/initiate:
 *   post:
 *     summary: Initiate university-verified signup
 *     description: Starts the signup process by verifying university ID and sending OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - universityId
 *             properties:
 *               universityId:
 *                 type: string
 *                 example: "U12345678"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *       400:
 *         description: Invalid university ID or user already registered
 *       500:
 *         description: Internal server error
 */
router.post("/signup/initiate", authController.initiateSignup);

/**
 * @swagger
 * /api/auth/signup/verify-otp:
 *   post:
 *     summary: Verify OTP for university signup
 *     description: Verifies the OTP sent to student's university email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - universityId
 *               - otp
 *             properties:
 *               universityId:
 *                 type: string
 *                 example: "U12345678"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 email:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
 */
router.post("/signup/verify-otp", authController.verifySignupOTP);

/**
 * @swagger
 * /api/auth/signup/complete:
 *   post:
 *     summary: Complete university-verified signup
 *     description: Creates a new user after university verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - universityId
 *               - password
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               universityId:
 *                 type: string
 *                 example: "U12345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securepassword"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@university.edu"
 *     responses:
 *       200:
 *         description: User created successfully
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
 *                 role:
 *                   type: string
 *                 universityId:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid input or error in user creation
 *       500:
 *         description: Internal server error
 */
router.post("/signup/complete", authController.completeSignup);

/**
 * @swagger
 * /api/auth/edit-profile:
 *   put:
 *     summary: Edit user profile
 *     description: Update user information including profile picture
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *                 description: Updated first name
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *                 description: Updated last name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: Updated email address
 *               universityId:
 *                 type: string
 *                 example: "U12345678"
 *                 description: Updated university ID
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: New profile picture (JPEG/PNG)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request (invalid input data)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/edit-profile', authenticateToken, upload.single('profilePicture'), authController.editProfile);

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
 *           description: Unique identifier for the user
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [Admin, Teacher, Student]
 *           description: User's role in the system
 *         universityId:
 *           type: string
 *           description: University-assigned ID
 *         profilePicture:
 *           type: string
 *           description: URL to user's profile picture
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         isActive:
 *           type: boolean
 *           description: Account activation status
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Add this to authRoutes.js after other routes
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Allows authenticated users to change their password after verifying current password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newsecurepassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect or new password is invalid
 *       401:
 *         description: Unauthorized (invalid/missing token)
 *       500:
 *         description: Internal server error
 */
router.post("/change-password", authenticateToken, authController.changePassword);