
const pool = require('../config/db'); 

// authService.js
exports.getFilteredUsers = async (filters = {}) => {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        id, 
        first_name AS "firstName", 
        last_name AS "lastName", 
        email, 
        role, 
        universityid AS "universityId",
        profilepicture AS "profilePicture",
        created_at AS "createdAt"
      FROM users 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // University ID filter
    if (filters.universityIds) {
      const ids = filters.universityIds.split(',');
      query += ` AND universityid = ANY($${paramCount})`;
      params.push(ids);
      paramCount++;
    }

    // Signup date range
    if (filters.startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }
    
    if (filters.endDate) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    // Role filter
    if (filters.roles) {
      const roles = filters.roles.split(',');
      query += ` AND role = ANY($${paramCount})`;
      params.push(roles);
      paramCount++;
    }

    // Email search
    if (filters.email) {
      query += ` AND email ILIKE $${paramCount}`;
      params.push(`%${filters.email}%`);
      paramCount++;
    }

    // Name search
    if (filters.name) {
      query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${filters.name}%`);
      paramCount++;
    }

    // Add sorting
    query += ` ORDER BY created_at DESC`;

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};


