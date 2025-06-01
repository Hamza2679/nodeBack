// notification.service.js
const { Pool } = require('pg');
const axios = require('axios');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
// OneSignal credentials come from env:
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Helper: insert a new notification record into PostgreSQL
async function createNotificationRecord({
  userId,
  type,       // 'event' or 'system'
  title,
  message,
  data = {},
}) {
  const queryText = `
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [userId, type, title, message, data];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

// Send via OneSignal and also persist to DB
async function sendEventNotification({ event, rsvp }) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    throw new Error('OneSignal credentials not configured');
  }

  // 1) Build the payload for OneSignal
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    filters: [
      { field: 'tag', key: 'user_id', relation: '=', value: rsvp.user_id.toString() }
    ],
    headings: { en: 'Event Reminder' },
    contents: { en: `Your event "${event.name}" starts now! You marked "${rsvp.status}".` },
    data: { eventId: event.id }
  };

  // 2) Fire off to OneSignal
  const oneSignalRes = await axios.post(
    'https://onesignal.com/api/v1/notifications',
    payload,
    {
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log(`🔔 OneSignal sent reminder for RSVP ${rsvp.id}:`, oneSignalRes.data.id);

  // 3) Persist to our notifications table
  const record = await createNotificationRecord({
    userId: rsvp.user_id,
    type: 'event',
    title: 'Event Reminder',
    message: `Your event "${event.name}" starts now! You marked "${rsvp.status}".`,
    data: { eventId: event.id, rsvpId: rsvp.id },
  });

  return { oneSignalId: oneSignalRes.data.id, notificationRecord: record };
}

async function sendSystemNotification({ title, message, userIds = [], segments = [] }) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    throw new Error('OneSignal credentials not configured');
  }

  // 1) Build the OneSignal payload
  const notification = {
    app_id: ONESIGNAL_APP_ID,
    headings: { en: title || 'New Notification' },
    contents: { en: message },
    included_segments: segments.length ? segments : ['Subscribed Users'],
  };

  if (userIds.length) {
    notification.include_external_user_ids = userIds.map((id) => id.toString());
    delete notification.included_segments;
  }

  console.log('Final OneSignal payload:', JSON.stringify(notification, null, 2));

  // 2) Send to OneSignal (using axios directly or oneSignalClient)
  const res = await axios.post(
    'https://onesignal.com/api/v1/notifications',
    notification,
    {
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  console.log(`🔔 OneSignal sent system notification:`, res.data.id);

  // 3) Persist one record per user (if you supplied userIds), 
  //    or if you used segments, you may fetch the segment’s members or skip DB‐insertion for each user.
  //    Here’s a simple approach: if userIds is nonempty, insert one row per user; 
  //    if segments was used, you might skip per-user records or insert a generic “broadcast.”

  let insertedRecords = [];
  if (userIds.length) {
    // Insert one notification row per specified userId
    const insertPromises = userIds.map((uid) =>
      createNotificationRecord({
        userId: uid,
        type: 'system',
        title,
        message,
        data: {}, // add any needed metadata
      })
    );
    insertedRecords = await Promise.all(insertPromises);
  } else {
    // For broadcast: you could either insert a single row with user_id = null,
    // or you could decide to insert a row per user in code after querying everyone.
    // Below is an example of inserting a “broadcast” record (user_id = NULL).
    const { rows } = await pool.query(
      `
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [null, 'system', title, message, {}]
    );
    insertedRecords = rows;
  }

  return { oneSignalId: res.data.id, notifications: insertedRecords };
}

async function createNotificationRecord({ userId, type, title, message, data = {} }) {
  const queryText = `
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [userId, type, title, message, data];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

// Fetch all notifications for a user (with optional filters)
async function getNotificationsForUser(userId, { onlyUnread = false } = {}) {
    
  let queryText = `
    SELECT id, type, title, message, data, is_read, created_at
    FROM notifications
    WHERE user_id = $1
  `;
  const params = [userId];

  if (onlyUnread) {
    queryText += ` AND is_read = FALSE`;
  }
  queryText += ` ORDER BY created_at DESC;`;

  const { rows } = await pool.query(queryText, params);
  return rows;
}

// Mark a notification as read
async function markAsRead(notificationId) {
  const queryText = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(queryText, [notificationId]);
  return rows[0];
}

module.exports = {
  sendEventNotification,
  sendSystemNotification,
  getNotificationsForUser,
    createNotificationRecord,
  markAsRead,
};
