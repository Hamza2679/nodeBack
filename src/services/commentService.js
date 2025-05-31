// services/commentService.js
const pool = require("../config/db");
const Comment = require("../models/comment");

class CommentService {
  /**
   * Add a comment to either a post or an event.
   * @param {number} userId
   * @param {number|null} postId
   * @param {number|null} eventId
   * @param {string} content
   */
static async addComment(userId, postId = null, eventId = null, content) {
  if (!postId && !eventId) {
    throw new Error("Must provide either postId or eventId");
  }

  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO comments (userid, postid, eventid, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const params = [userId, postId, eventId, content];
    const result = await client.query(query, params);
    const row = result.rows[0];

    return new Comment(
      row.id,
      row.postid,
      row.eventid,
      row.userid,
      row.content,
      row.created_at
    );
  } finally {
    client.release();
  }
}


  /**
   * Fetch comments for a given post
   * @param {number} postId
   */
  static async getCommentsByPost(postId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          c.id,
          c.postid,
          c.eventid,
          c.userid,
          c.content,
          c.created_at,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.profilepicture
        FROM comments c
        JOIN users u ON u.id = c.userid
        WHERE c.postid = $1
        ORDER BY c.created_at DESC
      `;
      const result = await client.query(query, [postId]);
      return result.rows.map(row => ({
        id: row.id,
        postId: row.postid,
        eventId: row.eventid,       // will be null here
        userId: row.userid,
        content: row.content,
        createdAt: row.created_at,
        user: {
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: row.role,
          profileImage: row.profilepicture
        }
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Fetch comments for a given event
   * @param {number} eventId
   */
  static async getCommentsByEvent(eventId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          c.id,
          c.postid,
          c.eventid,
          c.userid,
          c.content,
          c.created_at,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.profilepicture
        FROM comments c
        JOIN users u ON u.id = c.userid
        WHERE c.eventid = $1
        ORDER BY c.created_at DESC
      `;
      const result = await client.query(query, [eventId]);
      return result.rows.map(row => ({
        id: row.id,
        postId: row.postid,         // will be null here
        eventId: row.eventid,
        userId: row.userid,
        content: row.content,
        createdAt: row.created_at,
        user: {
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: row.role,
          profileImage: row.profilepicture
        }
      }));
    } finally {
      client.release();
    }
  }
}

module.exports = CommentService;
