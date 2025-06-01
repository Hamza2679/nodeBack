// services/groupPostReportService.js
const pool               = require('../config/db');
const GroupPostReport    = require('../models/groupPostReport');

class GroupPostReportService {
  static async create(reporterId, postId, reason) {
    const client = await pool.connect();
    try {
      const q = `
        INSERT INTO group_post_reports
          (reporter_id, post_id, reason)
        VALUES ($1, $2, $3)
        RETURNING *`;
      const { rows } = await client.query(q, [reporterId, postId, reason]);
      const r = rows[0];
      return new GroupPostReport(
        r.id, r.reporter_id, r.post_id, r.reason, r.created_at
      );
    } finally {
      client.release();
    }
  }

  static async listForPost(postId) {
    const client = await pool.connect();
    try {
      const q = `
        SELECT gpr.*,
               u.first_name AS reporter_first,
               u.last_name  AS reporter_last,
               u.email      AS reporter_email
        FROM group_post_reports gpr
        JOIN users u ON u.id = gpr.reporter_id
        WHERE gpr.post_id = $1
        ORDER BY gpr.created_at DESC`;
      const { rows } = await client.query(q, [postId]);
      return rows.map(r => ({
        id:       r.id,
        reporter: {
          id:    r.reporter_id,
          name:  `${r.reporter_first} ${r.reporter_last}`,
          email: r.reporter_email
        },
        postId:    r.post_id,
        reason:    r.reason,
        createdAt: r.created_at
      }));
    } finally {
      client.release();
    }
  }

  static async listAll() {
    const client = await pool.connect();
    try {
      const q = `
        SELECT 
          gpr.id,
          gpr.post_id,
          COUNT(*) OVER (PARTITION BY gpr.post_id) AS report_count,
          gp.text AS post_text,
          u.id   AS post_owner_id,
          u.first_name AS post_owner_first,
          u.last_name  AS post_owner_last
        FROM group_post_reports gpr
        JOIN group_posts gp ON gp.id = gpr.post_id
        JOIN users u       ON u.id = gp.user_id
        GROUP  BY gpr.post_id, gpr.id, gp.text, u.id, u.first_name, u.last_name
        ORDER  BY report_count DESC`;
      const { rows } = await client.query(q);
      return rows.map(r => ({
        postId:      r.post_id,
        postText:    r.post_text,
        owner: {
          id:    r.post_owner_id,
          name:  `${r.post_owner_first} ${r.post_owner_last}`
        },
        reportCount: parseInt(r.report_count, 10)
      }));
    } finally {
      client.release();
    }
  }

  static async deleteReport(reportId) {
    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM group_post_reports WHERE id = $1`, [reportId]);
    } finally {
      client.release();
    }
  }
  /**
 * Deletes all reports for a post, then deletes the post itself.
 * Returns true if the post existed & was deleted, false otherwise.
 */
static async deletePostAndReports(postId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) delete reports
    await client.query(
      `DELETE FROM group_post_reports
       WHERE post_id = $1`,
      [postId]
    );

    // 2) delete the post
    const result = await client.query(
      `DELETE FROM group_posts
       WHERE id = $1
       RETURNING *`,
      [postId]
    );

    await client.query('COMMIT');
    // if rowCount is 0, post didn't exist
    return result.rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Add to GroupPostReportService class
static async getReportedPostsForExport(filters = {}) {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        gp.id AS post_id,
        gp.text AS post_text,
        gp.created_at AS post_created_at,
        gp.group_id,
        g.name AS group_name,
        u.id AS author_id,
        u.first_name AS author_first,
        u.last_name AS author_last,
        u.email AS author_email,
        u.universityid AS author_university_id,
        COUNT(gpr.id) AS report_count,
        ARRAY_AGG(gpr.reason) AS reasons,
        MIN(gpr.created_at) AS first_reported_at,
        MAX(gpr.created_at) AS last_reported_at
      FROM group_post_reports gpr
      JOIN group_posts gp ON gp.id = gpr.post_id
      JOIN users u ON u.id = gp.user_id
      JOIN groups g ON g.id = gp.group_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // Group filter
    if (filters.groupIds) {
      const ids = filters.groupIds.split(',');
      query += ` AND gp.group_id = ANY($${paramCount})`;
      params.push(ids);
      paramCount++;
    }

    // Author university filter
    if (filters.universityIds) {
      const ids = filters.universityIds.split(',');
      query += ` AND u.universityid = ANY($${paramCount})`;
      params.push(ids);
      paramCount++;
    }

    // Author role filter
    if (filters.roles) {
      const roles = filters.roles.split(',');
      query += ` AND u.role = ANY($${paramCount})`;
      params.push(roles);
      paramCount++;
    }

    // Post date range
    if (filters.postStartDate) {
      query += ` AND gp.created_at >= $${paramCount}`;
      params.push(filters.postStartDate);
      paramCount++;
    }
    
    if (filters.postEndDate) {
      query += ` AND gp.created_at <= $${paramCount}`;
      params.push(filters.postEndDate);
      paramCount++;
    }

    // Report date range
    if (filters.reportStartDate) {
      query += ` AND gpr.created_at >= $${paramCount}`;
      params.push(filters.reportStartDate);
      paramCount++;
    }
    
    if (filters.reportEndDate) {
      query += ` AND gpr.created_at <= $${paramCount}`;
      params.push(filters.reportEndDate);
      paramCount++;
    }

    // Minimum report count
    if (filters.minReports) {
      query += ` AND (SELECT COUNT(*) FROM group_post_reports WHERE post_id = gp.id) >= $${paramCount}`;
      params.push(parseInt(filters.minReports));
      paramCount++;
    }

    // Reason filter
    if (filters.reason) {
      query += ` AND gpr.reason ILIKE $${paramCount}`;
      params.push(`%${filters.reason}%`);
      paramCount++;
    }

    // Search term in post text
    if (filters.searchTerm) {
      query += ` AND gp.text ILIKE $${paramCount}`;
      params.push(`%${filters.searchTerm}%`);
      paramCount++;
    }

    query += `
      GROUP BY gp.id, g.name, u.id, u.first_name, u.last_name, u.email, u.universityid
      ORDER BY report_count DESC
    `;

    const result = await client.query(query, params);
    return result.rows.map(r => ({
      postId: r.post_id,
      postText: r.post_text,
      postCreatedAt: r.post_created_at,
      groupId: r.group_id,
      groupName: r.group_name,
      author: {
        id: r.author_id,
        firstName: r.author_first,
        lastName: r.author_last,
        email: r.author_email,
        universityId: r.author_university_id
      },
      reportCount: parseInt(r.report_count, 10),
      reasons: r.reasons,
      firstReportedAt: r.first_reported_at,
      lastReportedAt: r.last_reported_at
    }));
  } finally {
    client.release();
  }
}

}


module.exports = GroupPostReportService;
