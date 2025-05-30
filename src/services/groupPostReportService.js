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

}


module.exports = GroupPostReportService;
