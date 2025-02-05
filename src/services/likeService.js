const pool = require("../config/db");
const Like = require("../models/like");

class LikeService {
    static async likePost(userId, postId) {
        const client = await pool.connect();
        try {
            const query = `INSERT INTO likes (userid, postid) VALUES ($1, $2) RETURNING *`;
            const result = await client.query(query, [userId, postId]);
            return new Like(result.rows[0].id, postId, userId, result.rows[0].created_at);
        } finally {
            client.release();
        }
    }

    static async unlikePost(userId, postId) {
        const client = await pool.connect();
        try {
            const query = `DELETE FROM likes WHERE userid = $1 AND postid = $2 RETURNING *`;
            const result = await client.query(query, [userId, postId]);
            return result.rowCount > 0;
        } finally {
            client.release();
        }
    }

    static async getLikesByPost(postId) {
        const client = await pool.connect();
        try {
            const query = `SELECT * FROM likes WHERE postid = $1`;
            const result = await client.query(query, [postId]);
            return result.rows;
        } finally {
            client.release();
        }
    }
}

module.exports = LikeService;
