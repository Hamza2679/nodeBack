const pool = require('../config/db');
const Event = require('../models/event');

class EventService {
    static async createEvent(
        userId, 
        name, 
        type, 
        datetime, 
        description, 
        coverPhotoUrl, 
        imageUrls,
        isOnline = false,
        onlineLink = null,
        onlineLinkVisible = false
    ) {
        if (!userId) throw new Error("User ID is required");
        if (!name || !type || !datetime || !description) {
            throw new Error("All required fields must be provided");
        }
        if (isOnline && !onlineLink) {
            throw new Error("Online link is required for online events");
        }

        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO events 
                (user_id, name, type, datetime, description, cover_photo_url, image_urls, is_online, online_link, online_link_visible)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`;
            const values = [
                userId,
                name,
                type,
                datetime,
                description,
                coverPhotoUrl,
                imageUrls,
                isOnline,
                onlineLink,
                onlineLinkVisible
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
                row.is_online,
                row.online_link,
                row.online_link_visible,
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
                row.is_online,
                row.online_link,
                row.online_link_visible,
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
                row.is_online,
                row.online_link,
                row.online_link_visible,
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
                row.is_online,
                row.online_link,
                row.online_link_visible,
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
                row.is_online,
                row.online_link,
                row.online_link_visible,
                row.created_at,
                row.updated_at
            );
        } finally {
            client.release();
        }
    }

    static async isUserAttending(userId, eventId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 1 FROM rsvps 
                WHERE user_id = $1 AND event_id = $2 AND status = 'going'
                LIMIT 1`;
            const result = await client.query(query, [userId, eventId]);
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }
}

module.exports = EventService;