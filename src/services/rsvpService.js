const pool = require('../config/db');
const Rsvp = require('../models/rsvp');
const fetch = require('node-fetch');

class RsvpService {
  static async rsvpToEvent(userId, eventId, status) {
    const client = await pool.connect();
    try {
      const upsertQuery = `
        INSERT INTO rsvps (event_id, user_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET status = EXCLUDED.status, created_at = NOW()
        RETURNING *`;
      const res = await client.query(upsertQuery, [eventId, userId, status]);
      return new Rsvp(
        res.rows[0].id, eventId, userId,
        res.rows[0].status, res.rows[0].notified_at, res.rows[0].created_at
      );
    } finally {
      client.release();
    }
  }

  // Send push notification via OneSignal
  static async sendNotification(event, rsvp) {
    const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY } = process.env;

    const body = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: "New RSVP" },
      contents: { en: `${rsvp.user_id} is ${rsvp.status} for ${event.name}` },
      // you can target by tags or segments; here we notify everyone subscribed to this event
      filters: [
        { field: "tag", key: "event_id", relation: "=", value: `${event.id}` }
      ]
    };

    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
}

module.exports = RsvpService;
