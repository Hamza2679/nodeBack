const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/FollowController");
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followingId
 *             properties:
 *               followingId:
 *                 type: string
 *                 description: The ID of the user to follow
 *     responses:
 *       201:
 *         description: Followed successfully
 *       400:
 *         description: Bad request
 */
router.post('/follow', authenticateToken, FollowController.followUser);

/**
 * @swagger
 * /unfollow:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followingId
 *             properties:
 *               followingId:
 *                 type: string
 *                 description: The ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Unfollowed successfully
 *       400:
 *         description: Bad request
 */
router.post('/unfollow', authenticateToken, FollowController.unfollowUser);

/**
 * @swagger
 * /followers/{userId}:
 *   get:
 *     summary: Get followers of a user
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of followers
 *       404:
 *         description: User not found
 */
router.get('/followers/:userId', FollowController.getFollowers);

/**
 * @swagger
 * /following/{userId}:
 *   get:
 *     summary: Get users followed by a user
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of following users
 *       404:
 *         description: User not found
 */
router.get('/following/:userId', FollowController.getFollowing);

/**
 * @swagger
 * /count/followers/{userId}:
 *   get:
 *     summary: Get count of followers
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Follower count
 */
router.get('/count/followers/:userId', FollowController.countFollowers);

/**
 * @swagger
 * /count/following/{userId}:
 *   get:
 *     summary: Get count of users followed
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Following count
 */
router.get('/count/following/:userId', FollowController.countFollowing);

/**
 * @swagger
 * /follow/check/{followingId}:
 *   get:
 *     summary: Check if a user is followed
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: followingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to check
 *     responses:
 *       200:
 *         description: Follow status
 */

router.get('/follow/check/:followingId', authenticateToken, FollowController.checkFollow);

module.exports = router;
