const pool = require('../config/db');

exports.getFilteredEvents = async (filters = {}) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        e.id,
        e.name,
        e.type,
        e.datetime,
        e.description,
        e.cover_photo_url AS "coverPhotoUrl",
        e.image_urls AS "imageUrls",
        e.is_online AS "isOnline",
        e.online_link AS "onlineLink",
        e.online_link_visible AS "onlineLinkVisible",
        e.created_at AS "createdAt",
        e.updated_at AS "updatedAt",
        e.group_id AS "groupId",
        u.id AS "organizerId",
        u.first_name AS "organizerFirstName",
        u.last_name AS "organizerLastName",
        u.email AS "organizerEmail",
        u.universityid AS "organizerUniversityId"
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // University ID filter (organizer's university)
    if (filters.universityIds) {
      const ids = filters.universityIds.split(',');
      query += ` AND u.universityid = ANY($${paramCount})`;
      params.push(ids);
      paramCount++;
    }

    // Event type filter
    if (filters.eventTypes) {
      const types = filters.eventTypes.split(',');
      query += ` AND e.type = ANY($${paramCount})`;
      params.push(types);
      paramCount++;
    }

    // Date range
    if (filters.startDate) {
      query += ` AND e.datetime >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }
    
    if (filters.endDate) {
      query += ` AND e.datetime <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    // Online filter
    if (filters.isOnline !== undefined) {
      query += ` AND e.is_online = $${paramCount}`;
      params.push(filters.isOnline === 'true');
      paramCount++;
    }

    // Group filter
    if (filters.groupId) {
      query += ` AND e.group_id = $${paramCount}`;
      params.push(filters.groupId);
      paramCount++;
    }

    // Search term
    if (filters.searchTerm) {
      query += ` AND (
        e.name ILIKE $${paramCount} OR 
        e.description ILIKE $${paramCount}
      )`;
      params.push(`%${filters.searchTerm}%`);
      paramCount++;
    }

    // Add sorting
    query += ` ORDER BY e.datetime DESC`;

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};