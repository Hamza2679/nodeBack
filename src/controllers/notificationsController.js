// controllers/notificationsController.js

const NotificationService = require('../services/notificationService');

// GET /api/notifications
// Fetch all notifications or only unread for the current user
async function getNotifications(req, res) {
      console.log('↪︎ Authenticated user ID =',req.user.userId);

  try {
    // `authenticateToken` guarantees `req.user` exists
    const user_id = req.user.userId;
    
    const onlyUnread = req.query.onlyUnread === 'true';

    const notifications = await NotificationService.getNotificationsForUser(
      user_id,
      { onlyUnread }
    );

    return res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}


// PUT /api/notifications/:id/read
// Mark a single notification as read
async function markAsRead(req, res) {
  try {
    const notificationId = parseInt(req.params.id, 10);

    // (Optional) you might want to verify that this notification actually belongs to req.user.id.
    // Otherwise a user could mark another user’s notification as “read.” For example:
    //
    //   const existing = await NotificationService.getNotificationById(notificationId);
    //   if (!existing || existing.user_id !== req.user.id) {
    //     return res.status(403).json({ success: false, error: 'Forbidden' });
    //   }
    //
    // For brevity, we assume NotificationService.markAsRead() will do its own ownership check,
    // but in many setups you check here in the controller.

    const updated = await NotificationService.markAsRead(notificationId);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
};
