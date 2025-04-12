const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/FollowController");
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/follow', authenticateToken, FollowController.followUser);
router.post('/unfollow', authenticateToken, FollowController.unfollowUser);
router.get('/followers/:userId', FollowController.getFollowers);
router.get('/following/:userId', FollowController.getFollowing);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Follow
 *   description: User follow and unfollow APIs
 */
/**
 * @swagger
 * /api/follow/follow:
 *   post:
 *     summary: Follow a user
 *     description: Allows a user to follow another user.
 *     tags:
 *       - Follow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followerId
 *               - followingId
 *             properties:
 *               followerId:
 *                 type: string
 *                 example: 1
 *               followingId:
 *                 type: string
 *                 example: 2
 *     responses:
 *       201:
 *         description: Successfully followed the user
 *       400:
 *         description: Bad request (missing fields or validation error)
 */