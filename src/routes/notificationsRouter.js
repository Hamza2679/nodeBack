// routes/notificationsRouter.js

const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
} = require('../controllers/notificationsController');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

// GET  /api/notifications
// ────────────────────────
// - User must be logged in (authenticateToken)
// - Optionally, you could add `authorizeRoles(['admin'])` if you wanted only admins
//   to fetch ALL notifications (but typically users fetch only their own, so no role‐check here).
router.get(
  '/',
  authenticateToken,
  getNotifications
);

// PUT  /api/notifications/:id/read
// ───────────────────────────────
// - User must be logged in
// - (Optional) you could check if req.user.id matches the owner of that notification inside the controller
router.put(
  '/:id/read',
  authenticateToken,
  markAsRead
);

module.exports = router;
