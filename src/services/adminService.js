const pool = require("../config/db");
const OneSignal = require("onesignal-node");
// At the top of your adminRoutes.js
const UserService = require('./userService');
const https = require('https');

// Add this before creating your OneSignal client
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // ⚠️ Disables SSL verification


const oneSignalClient = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID,
  process.env.ONESIGNAL_REST_API_KEY
);

class AdminService {
  static async getUserStatistics() {
    const client = await pool.connect();
    try {
      const totalUsers  = await client.query("SELECT COUNT(*) FROM users");
      const activeUsers = await client.query(
        "SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '30 days'"
      );
      const newUsers    = await client.query(
        "SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"
      );

      return {
        totalUsers:  parseInt(totalUsers.rows[0].count, 10),
        activeUsers: parseInt(activeUsers.rows[0].count, 10),
        newUsers:    parseInt(newUsers.rows[0].count, 10)
      };
    } finally {
      client.release();
    }
  }

  static async getContentStatistics() {
    const client = await pool.connect();
    try {
      const [posts, groups, events, reports] = await Promise.all([
        client.query("SELECT COUNT(*) FROM posts"),
        client.query("SELECT COUNT(*) FROM groups"),
        client.query("SELECT COUNT(*) FROM events"),
        client.query("SELECT COUNT(*) FROM report WHERE resolved = false")
      ]);

      return {
        totalPosts:     parseInt(posts.rows[0].count, 10),
        totalGroups:    parseInt(groups.rows[0].count, 10),
        totalEvents:    parseInt(events.rows[0].count, 10),
        pendingReports: parseInt(reports.rows[0].count, 10)
      };
    } finally {
      client.release();
    }
  }

  static async getReports(page = 1, limit = 10) {
    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;
      const reportsQuery = `
SELECT r.*, u1.first_name AS reporter_name, u2.first_name AS reported_name,
       p.text AS post_text, c.content AS comment_text
        FROM report r
        LEFT JOIN users u1 ON r.reporterid = u1.id
        LEFT JOIN users u2 ON r.reporteduserid = u2.id
        LEFT JOIN posts p ON r.postid = p.id
        LEFT JOIN comments c ON r.commentid = c.id
        ORDER BY r.created_at DESC
        LIMIT $1 OFFSET $2`;
      const countQuery   = "SELECT COUNT(*) FROM report";
      const [rRes, cRes] = await Promise.all([
        client.query(reportsQuery, [limit, offset]),
        client.query(countQuery)
      ]);
      const total = parseInt(cRes.rows[0].count, 10);
      return { reports: rRes.rows, total, page, pages: Math.ceil(total / limit) };
    } finally { client.release(); }
  }

  static async resolveReport(reportId, adminId, actionTaken) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE report SET resolved = true, resolved_by = $1, action_taken = $2, resolved_at = NOW() WHERE id = $3 RETURNING *`,
        [adminId, actionTaken, reportId]
      );
      if (result.rows.length === 0) throw new Error("Report not found");
      return result.rows[0];
    } finally { client.release(); }
  }

  static async getUsers(page = 1, limit = 10, search = "") {
    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;
      let baseQuery = `SELECT id, first_name, last_name, email, role, universityid, profilepicture, last_login, is_active FROM users`;
      let countQuery = `SELECT COUNT(*) FROM users`;
      const params = [];
      if (search) {
        params.push(`%${search}%`);
        baseQuery += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1`;
        countQuery += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1`;
      }
      const paramOffset = params.length;
      baseQuery += ` ORDER BY id DESC LIMIT $${paramOffset+1} OFFSET $${paramOffset+2}`;
      const [uRes, cRes] = await Promise.all([
        client.query(baseQuery, [...params, limit, offset]),
        client.query(countQuery, params)
      ]);
      const total = parseInt(cRes.rows[0].count, 10);
      return { users: uRes.rows, total, page, pages: Math.ceil(total/limit) };
    } finally { client.release(); }
  }

  static async updateUserStatus(userId, isActive) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, first_name, last_name, is_active`,
        [isActive, userId]
      );
      if (result.rows.length === 0) throw new Error("User not found");
      return result.rows[0];
    } finally { client.release(); }
  }

// In your AdminService class (services/AdminService.js)
static async updateUserRole(userId, newRole) {
  const client = await pool.connect();
  try {
    // Validate role
    const validRoles = ['Admin', 'Teacher', 'Student'];

    const roleNormalized = newRole.charAt(0).toUpperCase() + newRole.slice(1).toLowerCase();    
    if (!validRoles.includes(roleNormalized)) {
      throw new Error('Invalid role specified');
    }
    
    const result = await client.query(
      `UPDATE users SET role = $1 WHERE id = $2 
       RETURNING id, first_name, last_name, email, role, is_active`,
      [roleNormalized, userId]
    );
    
    if (result.rows.length === 0) throw new Error("User not found");
    return result.rows[0];
  } finally {
    client.release();
  }
}
  
  static async updateUserDetails(userId, updates) {
    const client = await pool.connect();
    try {
      // Filter allowed fields to update
      const allowedFields = ['first_name', 'last_name', 'email', 'universityid'];
      const validUpdates = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key.toLowerCase())) {
          validUpdates[key] = value;
        }
      }
  
      if (Object.keys(validUpdates).length === 0) {
        throw new Error("No valid fields to update");
      }
  
      const setClause = Object.keys(validUpdates)
        .map((key, i) => `${key} = $${i + 1}`)
        .join(', ');
  
      const values = Object.values(validUpdates);
      values.push(userId);
  
      const query = `
        UPDATE users 
        SET ${setClause} 
        WHERE id = $${values.length}
        RETURNING id, first_name, last_name, email, role, universityid, is_active
      `;
  
      const result = await client.query(query, values);
      if (result.rows.length === 0) throw new Error("User not found");
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  static async deleteUser(userId) {
    const client = await pool.connect();
    try {
      // First check if user exists
      const userRes = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) throw new Error("User not found");
  
      // In a real app, you might want to soft delete or handle dependencies
      await client.query('BEGIN');
      
      // Example: Delete user's posts, comments, etc. first
      // This is just a basic example - adjust based on your schema
      await client.query('DELETE FROM posts WHERE userid = $1', [userId]);
      await client.query('DELETE FROM comments WHERE userid = $1', [userId]);
      
      // Then delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async sendPushNotification({ title, message, userIds = [], segments = [] }) {
    try {
      if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
        throw new Error('OneSignal credentials not configured');
      }
  
      const notification = {
        app_id: process.env.ONESIGNAL_APP_ID,
        headings: { en: title || 'New Notification' },
        contents: { en: message },
        // ← fallback to the proper segment name:
        included_segments: segments.length ? segments : ['Subscribed Users']
      };
  
      if (userIds.length) {
        notification.include_external_user_ids = userIds;
        delete notification.included_segments;
      }
  
      console.log('Final notification payload:', JSON.stringify(notification, null, 2));
  
      const response = await oneSignalClient.createNotification(notification, {
        headers: { Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}` }
      });
  
      return response;
    } catch (err) {
      console.error('OneSignal Error:', err);
      throw new Error(`Notification failed: ${err.message}`);
    }
  }
  
  static async deletePostAsAdmin(postId, adminId, reason) {
    const client = await pool.connect();
    try {
      // fetch post owner
      const postRes = await client.query("SELECT userid FROM posts WHERE id = $1", [postId]);
      if (!postRes.rows.length) throw new Error("Post not found");
      const postUserId = postRes.rows[0].userid;

      await client.query("BEGIN");
      await client.query("DELETE FROM report WHERE postid = $1", [postId]);
      await client.query("DELETE FROM likes WHERE postid = $1", [postId]);
      await client.query(
        "DELETE FROM report WHERE commentid IN (SELECT id FROM comments WHERE postid = $1)", [postId]
      );
      await client.query("DELETE FROM comments WHERE postid = $1", [postId]);
      await client.query("DELETE FROM posts WHERE id = $1", [postId]);
      await client.query(
        "INSERT INTO moderation_log (admin_id, user_id, action_type, target_id, reason) VALUES ($1,$2,$3,$4,$5)",
        [adminId, postUserId, 'post_deletion', postId, reason]
      );
      await client.query("COMMIT");
      return { userId: postUserId };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  static async getModerationLogs(page = 1, limit = 10) {
    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;
      const logsQuery = `
        SELECT ml.*, a.first_name AS admin_first_name, a.last_name AS admin_last_name,
               u.first_name AS user_first_name, u.last_name AS user_last_name
        FROM moderation_log ml
        LEFT JOIN users a ON ml.admin_id = a.id
        LEFT JOIN users u ON ml.user_id = u.id
        ORDER BY ml.action_date DESC LIMIT $1 OFFSET $2`;
      const [lRes, cRes] = await Promise.all([
        client.query(logsQuery, [limit, offset]),
        client.query("SELECT COUNT(*) FROM moderation_log")
      ]);
      const total = parseInt(cRes.rows[0].count, 10);
      return { logs: lRes.rows, total, page, pages: Math.ceil(total/limit) };
    } finally { client.release(); }
  }
}

module.exports = AdminService;
