// controllers/eventNotificationsController.js

const NotificationService = require('../services/notificationService');
// Replace these with however you fetch events and RSVPs:
// const { Event } = require('../models/Event');     // your ORM/model for events
// const { Rsvp }  = require('../models/Rsvp');      // your ORM/model for RSVPs

/**
 * POST /api/events/:eventId/notify/:rsvpId
 * Triggers sendEventNotification for a given event and RSVP.
 */
async function triggerEventNotification(req, res) {
  try {
    // 1) Extract IDs from params:
    const eventId = parseInt(req.params.eventId, 10);
    const rsvpId  = parseInt(req.params.rsvpId, 10);

    if (!eventId || !rsvpId) {
      return res.status(400).json({ success: false, error: 'Invalid eventId or rsvpId' });
    }

    // 2) Load the event from the DB:
    const event = await Event.findOne({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // 3) Load the RSVP from the DB (ensuring it belongs to that event):
    const rsvp = await Rsvp.findOne({
      where: {
        id: rsvpId,
        event_id: eventId
      }
    });
    if (!rsvp) {
      return res.status(404).json({ success: false, error: 'RSVP not found for this event' });
    }

    // 4) Call your notification service:
    const result = await NotificationService.sendEventNotification({ event, rsvp });

    // 5) Return the OneSignal ID and the DB record:
    return res.json({
      success: true,
      data: {
        oneSignalId: result.oneSignalId,
        notificationRecord: result.notificationRecord
      }
    });
  } catch (err) {
    console.error('Error in triggerEventNotification:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

module.exports = {
  triggerEventNotification,
};
