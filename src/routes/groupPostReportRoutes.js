// routes/groupPostReportRoutes.js
const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  reportGroupPost,
  getReportsForGroupPost,
  getAllReportedGroupPosts,
   deleteGroupPostAndReports

} = require('../controllers/groupPostReportController');

const router = express.Router();

// Anyone logged in can report a group post
router.post(
  '/group-posts/report',
  authenticateToken,
  reportGroupPost
);

// View reports for one post (admin or owner of post if you like)
router.get(
  '/group-posts/:postId/reports',
  authenticateToken,
  authorizeRoles(['Admin']),
  getReportsForGroupPost
);

// Admin: list all reported group posts summary
router.get(
  '/admin/group-posts/reported',
  authenticateToken,
  authorizeRoles(['Admin']),
  getAllReportedGroupPosts
);

// Admin: delete a specific report
// Admin: delete a group post and its reports
router.delete(
  '/admin/group-posts/:postId',
  authenticateToken,
  authorizeRoles(['admin']),
  deleteGroupPostAndReports
);


module.exports = router;
