const pool = require('../config/db');
const Event = require('../models/event');

class EventService {
  static async createEvent(userId, name, type, datetime, description, coverPhotoUrl, imageUrls) {
    if (!userId) throw new Error("User ID is required");
    if (!name || !type || !datetime || !description) {
      throw new Error("All required fields must be provided");
    }
  
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO events 
        (user_id, name, type, datetime, description, cover_photo_url, image_urls)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`;
      const values = [
        userId,
        name,
        type,
        datetime,
        description,
        coverPhotoUrl,
        imageUrls,
      ];
  
      const result = await client.query(query, values);
      const row = result.rows[0];
  
      return new Event(
        row.id,
        row.user_id,
        row.name,
        row.type,
        row.datetime,
        row.description,
        row.cover_photo_url,
        row.image_urls,
        row.created_at,
        row.updated_at
      );
    } finally {
      client.release();
    }
  }

    static async getAllEvents() {
        const client = await pool.connect();
        try {
            const query = `SELECT * FROM events ORDER BY datetime DESC`;
            const result = await client.query(query);

            return result.rows.map(row => new Event(
                row.id,
                row.user_id,
                row.name,
                row.type,
                row.datetime,
                row.description,
                row.cover_photo_url,
                row.image_urls,
                row.created_at,
                row.updated_at
            ));
        } finally {
            client.release();
        }
    }

    static async getEventById(eventId) {
        if (!eventId) throw new Error("Event ID is required");

        const client = await pool.connect();
        try {
            const query = `SELECT * FROM events WHERE id = $1`;
            const result = await client.query(query, [eventId]);

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return new Event(
                row.id,
                row.user_id,
                row.name,
                row.type,
                row.datetime,
                row.description,
                row.cover_photo_url,
                row.image_urls,
                row.created_at,
                row.updated_at
            );
        } finally {
            client.release();
        }
    }
    static async getEventsByType(eventType) {
      const client = await pool.connect();
      try {
        const query = `SELECT * FROM events WHERE type = $1 ORDER BY datetime DESC`;
        const result = await client.query(query, [eventType]);
        
        return result.rows.map(row => new Event(
          row.id,
          row.user_id,
          row.name,
          row.type,
          row.datetime,
          row.description,
          row.cover_photo_url,
          row.image_urls,
          row.created_at,
          row.updated_at
        ));
      } finally {
        client.release();
      }
    }

    static async deleteEvent(userId, eventId) {
        const client = await pool.connect();
        try {
            // Verify event ownership
            const checkQuery = `SELECT user_id FROM events WHERE id = $1`;
            const checkResult = await client.query(checkQuery, [eventId]);

            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                return false;
            }

            await client.query(`DELETE FROM events WHERE id = $1`, [eventId]);
            return true;
        } finally {
            client.release();
        }
    }

    static async updateEvent(userId, eventId, updates) {
        const client = await pool.connect();
        try {
            // Verify event ownership
            const checkQuery = `SELECT user_id FROM events WHERE id = $1`;
            const checkResult = await client.query(checkQuery, [eventId]);

            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                throw new Error("Unauthorized to update this event");
            }

            const fields = [];
            const values = [eventId];
            let paramCount = 2;

            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }

            const query = `
                UPDATE events 
                SET ${fields.join(', ')}, updated_at = NOW()
                WHERE id = $1
                RETURNING *`;

            const result = await client.query(query, values);
            return new Event(
                result.rows[0].id,
                result.rows[0].user_id,
                result.rows[0].name,
                result.rows[0].type,
                result.rows[0].datetime,
                result.rows[0].description,
                result.rows[0].cover_photo_url,
                result.rows[0].image_urls,
                result.rows[0].created_at,
                result.rows[0].updated_at
            );
        } finally {
            client.release();
        }
    }
}

module.exports = EventService;