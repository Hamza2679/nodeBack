const pool = require("../config/db");
const OneSignal = require("onesignal-node");
// At the top of your adminRoutes.js
const UserService = require('../services/UserService');
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
      const totalUsers = await client.query("SELECT COUNT(*) FROM users");
  
      const activeUsers = await client.query(
        "SELECT COUNT(DISTINCT user_id) FROM user_token"
      );
  
      const newUsers = await client.query(
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
  static async deleteUser(userId) {
    const client = await pool.connect();
    try {
      // Check if user exists
      const userRes = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) throw new Error("User not found");
  
      await client.query('BEGIN');
      
      // Delete all dependent records first
      await client.query('DELETE FROM user_token WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM posts WHERE userid = $1', [userId]);
      await client.query('DELETE FROM comments WHERE userid = $1', [userId]);
      
      // Then delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      await client.query('COMMIT');
      
      return { success: true, message: "User deleted successfully" };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Delete error:', err);
      throw err;
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
    await client.query('BEGIN'); // Start transaction

    // 1. Get the report details first
    const reportResult = await client.query(
      `SELECT * FROM report WHERE id = $1 AND resolved = false FOR UPDATE`,
      [reportId]
    );
    
    if (reportResult.rows.length === 0) {
      throw new Error("Report not found or already resolved");
    }
    
    const report = reportResult.rows[0];

    // 2. Perform actions based on actionTaken
    if (actionTaken.includes("post removed") && report.postid) {
      await client.query(
        `DELETE FROM posts WHERE id = $1`,
        [report.postid]
      );
    }
    
    if (actionTaken.includes("user warned") && report.reporteduserid) {
      // Example: Increment warning count for user
      await client.query(
        `UPDATE users SET warnings = warnings + 1 WHERE id = $1`,
        [report.reporteduserid]
      );
    }

    // 3. Mark report as resolved
    const result = await client.query(
      `UPDATE report 
       SET resolved = true, resolved_by = $1, action_taken = $2, resolved_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [adminId, actionTaken, reportId]
    );

    await client.query('COMMIT'); // Commit transaction
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    throw error;
  } finally { 
    client.release(); 
  }
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
  
// services/adminService.js

static async deleteUser(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Ensure user exists and is active
    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND is_active = TRUE',
      [userId]
    );
    if (userRes.rowCount === 0) {
      throw new Error('User not found or already deactivated');
    }

    // 2) Delete any reports they filed or were the target of
    await client.query(
      `DELETE FROM user_reports
       WHERE reporter_id = $1
          OR reported_id = $1`,
      [userId]
    );

    // 3) Soft‐delete the user
    const result = await client.query(
      `UPDATE users
         SET is_active = FALSE
       WHERE id = $1
       RETURNING id, first_name, last_name, email, role`,
      [userId]
    );

    await client.query('COMMIT');
    return result.rows[0];
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

  // services/adminService.js
static async deactivateUser(userId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE users
         SET is_active = FALSE
       WHERE id = $1
       RETURNING id, first_name, last_name, email, role;`,
      [userId]
    );
    if (result.rowCount === 0) throw new Error('User not found');
    return result.rows[0];
  } finally {
    client.release();
  }
}
static async getDashboardReportData(filters = {}) {
  const client = await pool.connect();
  try {
    // User stats query
    let userQuery = `
      SELECT 
        COUNT(*) AS total_users,
        COUNT(DISTINCT ut.user_id) AS active_users,
        COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS new_users
      FROM users u
      LEFT JOIN user_token ut ON ut.user_id = u.id
      WHERE 1=1
    `;
    const userParams = [];
    let userParamCount = 1;

    // Content stats query
    let contentQuery = `
      SELECT 
        COUNT(p.id) AS total_posts,
        COUNT(g.id) AS total_groups,
        COUNT(e.id) AS total_events,
        COUNT(r.id) FILTER (WHERE r.resolved = false) AS pending_reports
      FROM posts p
      CROSS JOIN groups g
      CROSS JOIN events e
      CROSS JOIN report r
      WHERE 1=1
    `;
    const contentParams = [];
    let contentParamCount = 1;

    // University filter
    if (filters.universityIds) {
      const ids = filters.universityIds.split(',');
      userQuery += ` AND u.universityid = ANY($${userParamCount})`;
      userParams.push(ids);
      userParamCount++;

      contentQuery += ` AND p.university_id = ANY($${contentParamCount})`;
      contentParams.push(ids);
      contentParamCount++;
    }

    // Role filter (only user)
    if (filters.roles) {
      const roles = filters.roles.split(',');
      userQuery += ` AND u.role = ANY($${userParamCount})`;
      userParams.push(roles);
      userParamCount++;
    }

    // User date filters
    if (filters.userStartDate) {
      userQuery += ` AND u.created_at >= $${userParamCount}`;
      userParams.push(filters.userStartDate);
      userParamCount++;
    }
    if (filters.userEndDate) {
      userQuery += ` AND u.created_at <= $${userParamCount}`;
      userParams.push(filters.userEndDate);
      userParamCount++;
    }

    // Content date filters
    if (filters.contentStartDate) {
      contentQuery += ` AND p.created_at >= $${contentParamCount}`;
      contentParams.push(filters.contentStartDate);
      contentParamCount++;
    }
    if (filters.contentEndDate) {
      contentQuery += ` AND p.created_at <= $${contentParamCount}`;
      contentParams.push(filters.contentEndDate);
      contentParamCount++;
    }

    // Execute both queries with their own parameters
    const [userStats, contentStats] = await Promise.all([
      client.query(userQuery, userParams),
      client.query(contentQuery, contentParams),
    ]);

    return {
      userStats: {
        totalUsers: parseInt(userStats.rows[0].total_users, 10),
        activeUsers: parseInt(userStats.rows[0].active_users, 10),
        newUsers: parseInt(userStats.rows[0].new_users, 10)
      },
      contentStats: {
        totalPosts: parseInt(contentStats.rows[0].total_posts, 10),
        totalGroups: parseInt(contentStats.rows[0].total_groups, 10),
        totalEvents: parseInt(contentStats.rows[0].total_events, 10),
        pendingReports: parseInt(contentStats.rows[0].pending_reports, 10)
      }
    };
  } finally {
    client.release();
  }
}

static async getDetailedUserReport(filters = {}) {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.universityid,
        u.created_at,
        u.last_login,
        u.is_active,
        COUNT(DISTINCT p.id) AS post_count,
        COUNT(DISTINCT g.id) AS group_count,
        COUNT(DISTINCT e.id) AS event_count
      FROM users u
      LEFT JOIN posts p ON p.userid = u.id
      LEFT JOIN group_members gm ON gm.user_id = u.id
      LEFT JOIN groups g ON g.id = gm.group_id
      LEFT JOIN events e ON e.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // University filter
    if (filters.universityIds) {
      const ids = filters.universityIds.split(',');
      query += ` AND u.universityid = ANY($${paramCount})`;
      params.push(ids);
      paramCount++;
    }

    // Role filter
    if (filters.roles) {
      const roles = filters.roles.split(',');
      query += ` AND u.role = ANY($${paramCount})`;
      params.push(roles);
      paramCount++;
    }

    // Status filter
    if (filters.isActive !== undefined) {
      query += ` AND u.is_active = $${paramCount}`;
      params.push(filters.isActive === 'true');
      paramCount++;
    }

    // Date range
    if (filters.startDate) {
      query += ` AND u.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }
    
    if (filters.endDate) {
      query += ` AND u.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    // Search term
    if (filters.searchTerm) {
      query += ` AND (
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount}
      )`;
      params.push(`%${filters.searchTerm}%`);
      paramCount++;
    }

    query += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

}


module.exports = AdminService;
