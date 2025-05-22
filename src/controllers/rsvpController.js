const RsvpService = require('../services/rsvpService');
const EventService = require('../services/eventService');

exports.rsvp = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { eventId } = req.params;
    const { status }  = req.body;

    // Upsert + schedule the reminder
    const rsvp = await RsvpService.rsvpToEvent(userId, eventId, status);
    res.status(200).json({ message: 'RSVP recorded', rsvp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.listForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const list = await RsvpService.getByEvent(eventId);
    res.json({ rsvps: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /:eventId/attendees
 * Returns the number of people marked as 'going'
 */
/**
 * GET /:eventId/attendees
 * Returns count of 'going' RSVPs plus an array of those users
 */
exports.listAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const raw = await RsvpService.getAttendees(eventId);

    // map to merge first/last into name
    const attendees = raw.map(u => ({
      userId: u.userId,
      name: `${u.firstName} ${u.lastName}`,
      profilePicture: u.profilePicture
    }));

    res.json({
      eventId,
      going: attendees.length,
      attendees
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



exports.getMyRsvp = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { eventId } = req.params;
    const rsvp = await RsvpService.getOne(userId, eventId);
    if (!rsvp) return res.status(404).json({ error: 'No RSVP found' });
    res.json({ rsvp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { eventId } = req.params;
    const { status } = req.body;
    const updated = await RsvpService.update(userId, eventId, status);
    res.json({ message: 'RSVP updated', rsvp: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId  = req.user.userId;
    const { eventId } = req.params;
    await RsvpService.remove(userId, eventId);
    res.json({ message: 'RSVP cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
