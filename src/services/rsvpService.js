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
    const appId   = process.env.ONESIGNAL_APP_ID;
    const apiKey  = process.env.ONESIGNAL_REST_API_KEY;

    // Format the event time into a UTC ISO string
    const sendAfter = new Date(event.datetime).toISOString();

    const payload = {
      app_id: appId,

      // target only this user’s device(s):
      filters: [
        { field: 'tag', key: 'user_id', relation: '=', value: rsvp.user_id.toString() }
      ],

      headings: { en: 'Reminder: Your event starts now!' },
      contents: { en: `You marked yourself "${rsvp.status}" for "${event.name}".` },
      send_after: sendAfter,               // ⏰ schedule for event time
      data: {
        eventId:    event.id,
        rsvpStatus: rsvp.status,
      }
    };

    try {
      const res = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        payload,
        {
          headers: {
            Authorization: `Basic ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Scheduled OneSignal notification:', res.data.id);
    } catch (err) {
      console.error('OneSignal scheduling error:', err.response?.data || err.message);
    }
  }


   static async getByEvent(eventId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM rsvps WHERE event_id = $1 ORDER BY created_at DESC`,
        [eventId]
      );
      return rows.map(r => new Rsvp(
        r.id, r.event_id, r.user_id, r.status, r.created_at, r.notified_at
      ));
    } finally {
      client.release();
    }
  }

  static async getOne(userId, eventId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      if (!rows.length) return null;
      const r = rows[0];
      return new Rsvp(r.id, r.event_id, r.user_id, r.status, r.created_at, r.notified_at);
    } finally {
      client.release();
    }
  }

  static async update(userId, eventId, status) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `UPDATE rsvps 
         SET status = $1, created_at = NOW()
         WHERE event_id = $2 AND user_id = $3
         RETURNING *`,
        [status, eventId, userId]
      );
      if (!rows.length) throw new Error('RSVP not found');
      const r = rows[0];
      return new Rsvp(r.id, r.event_id, r.user_id, r.status, r.created_at, r.notified_at);
    } finally {
      client.release();
    }
  }

  static async remove(userId, eventId) {
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
    } finally {
      client.release();
    }
  }

}

module.exports = RsvpService;
