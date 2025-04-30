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
            const query = `
                SELECT 
                    c.id,
                    c.postid,
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
