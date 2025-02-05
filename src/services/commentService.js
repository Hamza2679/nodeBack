const pool = require("../config/db");
const Comment = require("../models/comment");

class CommentService {
    static async addComment(userId, postId, content) {
        const client = await pool.connect();
        try {
            const query = `INSERT INTO comments (userid, postid, content) VALUES ($1, $2, $3) RETURNING *`;
            const result = await client.query(query, [userId, postId, content]);
            return new Comment(result.rows[0].id, postId, userId, content, result.rows[0].created_at);
        } finally {
            client.release();
        }
    }

    static async getCommentsByPost(postId) {
        const client = await pool.connect();
        try {
            const query = `SELECT * FROM comments WHERE postid = $1`;
            const result = await client.query(query, [postId]);
            return result.rows;
        } finally {
            client.release();
        }
    }
}

module.exports = CommentService;
