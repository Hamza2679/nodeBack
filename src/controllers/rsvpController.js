const RsvpService = require('../services/rsvpService');
const EventService = require('../services/eventService');

exports.rsvp = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId } = req.params;
    const { status } = req.body;  // e.g. 'going', 'interested', 'not_going'

    // 1. Upsert RSVP record
    const rsvp = await RsvpService.rsvpToEvent(userId, eventId, status);

    // 2. Fetch event to get its name, etc.
    const event = await EventService.getEventById(eventId);

    // 3. Trigger OneSignal notification
    await RsvpService.sendNotification(event, rsvp);

    res.status(200).json({ message: 'RSVP recorded', rsvp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
