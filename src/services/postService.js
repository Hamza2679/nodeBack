const pool = require("../config/db");
const Post = require("../models/post");

class PostService {
    static async createPost(userId, text, imageUrl) {
        if (!userId) throw new Error("User ID is required");
        if (!text && !imageUrl) throw new Error("Post must contain either text or an image");

        const client = await pool.connect();
        try {
            const query = `INSERT INTO posts (userid, text, image_url) VALUES ($1, $2, $3) RETURNING *`;
            const values = [userId, text || null, imageUrl || null];

            const result = await client.query(query, values);
            const row = result.rows[0];

            return new Post(row.id, row.userid, row.text, row.image_url, row.created_at, row.updated_at);
        } catch (error) {
            console.error("Database Error:", error);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = PostService;
