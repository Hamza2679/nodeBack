// services/rsvpService.js

const axios       = require('axios');
const schedule    = require('node-schedule');
const pool        = require('../config/db');
const Rsvp        = require('../models/rsvp');
const EventService = require('./eventService');

class RsvpService {
  /** Upsert RSVP and schedule a reminder */
  static async rsvpToEvent(userId, eventId, status) {
    const client = await pool.connect();
    let rsvp;
    try {
      const upsertQuery = `
        INSERT INTO rsvps (event_id, user_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET status = EXCLUDED.status, created_at = NOW()
        RETURNING *`;
      const res = await client.query(upsertQuery, [eventId, userId, status]);
      const row = res.rows[0];
      rsvp = new Rsvp(
        row.id,
        row.event_id,
        row.user_id,
        row.status,
        row.created_at,
        row.notified_at
      );
    } finally {
      client.release();
    }

    // Fetch event details to get datetime & name
    const event = await EventService.getEventById(eventId);
    // Schedule the reminder
    RsvpService.scheduleReminder(event, rsvp);

    return rsvp;
  }

  /** Schedule a node‑schedule job at the event time */
  static scheduleReminder(event, rsvp) {
    const runAt = new Date(event.datetime);
    const now   = new Date();

    // If it's in the past or within 1 minute, bump it 1 minute ahead
    if (runAt <= now || runAt - now < 60_000) {
      runAt.setTime(now.getTime() + 60_000);
    }

    schedule.scheduleJob(runAt, async () => {
      console.log(`⏰ Running reminder for RSVP ${rsvp.id} at ${new Date().toISOString()}`);
      try {
        await RsvpService.sendImmediateNotification(event, rsvp);
        // Mark notified_at so you don't re-notify if you want to track it
        await pool.query(
          `UPDATE rsvps SET notified_at = NOW() WHERE id = $1`,
          [rsvp.id]
        );
      } catch (err) {
        console.error('Error sending reminder notification:', err);
      }
    });

    console.log(`✅ Scheduled reminder for RSVP ${rsvp.id} at ${runAt.toISOString()}`);
  }

  /** Send a OneSignal push immediately to this user */
  static async sendImmediateNotification(event, rsvp) {
    const appId  = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    const payload = {
      app_id: appId,
      filters: [
        { field: 'tag', key: 'user_id', relation: '=', value: rsvp.user_id.toString() }
      ],
      headings: { en: 'Event Reminder' },
      contents: { en: `Your event "${event.name}" starts now! You marked "${rsvp.status}".` },
      data: { eventId: event.id }
    };

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

    console.log(`🔔 Sent reminder notification for RSVP ${rsvp.id}:`, res.data.id);
  }

  /** List all RSVPs for an event */
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

  /** Get one user’s RSVP for an event */
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

  /** Update an existing RSVP */
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

  /** Remove (cancel) an RSVP */
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
