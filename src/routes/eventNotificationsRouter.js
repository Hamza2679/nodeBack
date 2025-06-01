// routes/eventNotificationsRouter.js

const express = require('express');
const router = express.Router();
const { triggerEventNotification } = require('../controllers/eventNotificationsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Only authenticated users (or maybe only admins) can call this:
router.post(
  '/events/:eventId/notify/:rsvpId',
  authenticateToken,
  triggerEventNotification
);

module.exports = router;
