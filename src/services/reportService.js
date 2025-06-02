// services/reportService.js
const pool   = require('../config/db');
const Report = require('../models/report');

class ReportService {
  static async createReport(reporterId, reportedId, reason) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO user_reports
          (reporter_id, reported_id, reason)
        VALUES ($1, $2, $3)
        RETURNING *`;
      const values = [reporterId, reportedId, reason];
      const result = await client.query(query, values);
      const row = result.rows[0];
      return new Report(
        row.id,
        row.reporter_id,
        row.reported_id,
        null,
        row.reason,
        row.created_at
      );
    } finally {
      client.release();
    }
  }

  static async getReportsForUser(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT ur.*, 
               u1.email AS reporter_email,
               u2.email AS reported_email
        FROM user_reports ur
        JOIN users u1 ON u1.id = ur.reporter_id
        JOIN users u2 ON u2.id = ur.reported_id
        WHERE ur.reported_id = $1
        ORDER BY ur.created_at DESC`;
      const result = await client.query(query, [userId]);
      return result.rows.map(row => ({
        id:            row.id,
        reporterId:    row.reporter_id,
        reporterEmail: row.reporter_email,
        reportedId:    row.reported_id,
        reportedEmail: row.reported_email,
        messageId:     row.message_id,
        reason:        row.reason,
        createdAt:     row.created_at
      }));
    } finally {
      client.release();
    }
  }

  // KEEP THIS ONE, REMOVE THE OTHER
  static async getAllReportedUsers() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          u.id           AS user_id,
          u.first_name,
          u.last_name,
          u.email,
          COUNT(ur.id)   AS report_count,
          ARRAY_AGG(ur.reason) AS reasons
        FROM user_reports ur
        JOIN users u ON u.id = ur.reported_id
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY report_count DESC`;
      const result = await client.query(query);
      return result.rows.map(r => ({
        userId:      r.user_id,
        firstName:   r.first_name,
        lastName:    r.last_name,
        email:       r.email,
        reportCount: parseInt(r.report_count, 10),
        reasons:     r.reasons    // <-- this is your array of reasons
      }));
    } finally {
      client.release();
    }
  }
  // Add to ReportService class
static async getReportedUsersForExport(filters = {}) {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.universityid AS university_id,
        COUNT(ur.id) AS report_count,
        ARRAY_AGG(ur.reason) AS reasons,
        MIN(ur.created_at) AS first_reported_at,
        MAX(ur.created_at) AS last_reported_at
      FROM user_reports ur
      JOIN users u ON u.id = ur.reported_id
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

    // Report date range
    if (filters.startDate) {
      query += ` AND ur.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }
    
    if (filters.endDate) {
      query += ` AND ur.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    // Minimum report count
    if (filters.minReports) {
      query += ` AND (SELECT COUNT(*) FROM user_reports WHERE reported_id = u.id) >= $${paramCount}`;
      params.push(parseInt(filters.minReports));
      paramCount++;
    }

    // Reason filter
    if (filters.reason) {
      query += ` AND ur.reason ILIKE $${paramCount}`;
      params.push(`%${filters.reason}%`);
      paramCount++;
    }

    query += `
      GROUP BY u.id
      ORDER BY report_count DESC
    `;

    const result = await client.query(query, params);
    return result.rows.map(r => ({
      userId: r.user_id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      role: r.role,
      universityId: r.university_id,
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

module.exports = ReportService;