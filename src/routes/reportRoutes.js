// routes/reportRoutes.js
const express = require('express');
const { reportUser, getReportsForUser,getAllReportedUsers,resolveReport } = require('../controllers/reportController');
const { authenticateToken,authorizeRoles } = require("../middleware/authMiddleware");
const { deleteUser } = require('../controllers/adminController');

const router = express.Router();

router.post(
  '/reports',
  authenticateToken,         // ensure user is logged in
  reportUser
);

router.get(
  '/reports/user/:userId',
  authenticateToken,         // and optionally admin-only
  getReportsForUser
);

router.get(
  '/admin/reported-users',
  authenticateToken,
  authorizeRoles(['admin']),
  getAllReportedUsers
);



router.delete(
  '/admin/delete-user/:id',
  authenticateToken,
  authorizeRoles(['admin']),
  deleteUser
);
module.exports = router;
