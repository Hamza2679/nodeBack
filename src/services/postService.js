const pool = require('../config/db');
const Post = require('../models/post');

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
        } finally {
            client.release();
        }
    }
   
    static async deletePost(userId, postId) {
        const client = await pool.connect();
        try {
            console.log(`Checking if post ${postId} belongs to user ${userId}`);

            // Check if the post exists and belongs to the user
            const checkQuery = `SELECT * FROM posts WHERE id = $1 AND userid = $2`;
            const checkResult = await client.query(checkQuery, [postId, userId]);

            if (checkResult.rowCount === 0) {
                console.log("Post not found or unauthorized");
                return false;
            }

            console.log(`Deleting associated reports for post ${postId}`);

            // First, delete reports associated with the post and its comments
            await client.query(`DELETE FROM report WHERE postid = $1 OR commentid IN (SELECT id FROM comments WHERE postid = $1)`, [postId]);

            console.log(`Deleting associated likes and comments for post ${postId}`);

            // Delete all likes associated with the post
            await client.query(`DELETE FROM likes WHERE postid = $1`, [postId]);

            // Delete all comments associated with the post
            await client.query(`DELETE FROM comments WHERE postid = $1`, [postId]);

            console.log(`Deleting post ${postId}`);

            // Now delete the post
            await client.query(`DELETE FROM posts WHERE id = $1 AND userid = $2`, [postId, userId]);

            return true;
        } catch (error) {
            console.error("Database Error in deletePost:", error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    
   
    static async getAllPosts() {
        const client = await pool.connect();
        try {
            const query = `SELECT * FROM posts ORDER BY created_at DESC`;
            const result = await client.query(query);

            return result.rows.map(row => new Post(row.id, row.userid, row.text, row.image_url, row.created_at, row.updated_at));
        } finally {
            client.release();
        }
    }

    static async getPostById(postId) {
        if (!postId) throw new Error("Post ID is required");

        const client = await pool.connect();
        try {
            const query = `SELECT * FROM posts WHERE id = $1`;
            const result = await client.query(query, [postId]);

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return new Post(row.id, row.userid, row.text, row.image_url, row.created_at, row.updated_at);
        } finally {
            client.release();
        }
    }
    static async editPost(userId, postId, text, imageUrl) {
    
        const client = await pool.connect();
        try {
            // Check if the post belongs to the user
            const checkQuery = "SELECT userid FROM posts WHERE id = $1";
            const checkResult = await client.query(checkQuery, [postId]);
    
            if (checkResult.rows.length === 0 || checkResult.rows[0].userid !== userId) {
                throw new Error("You can only edit your own posts");
            }
    
            // Update the post in the database
            const updateQuery = `
                UPDATE posts 
                SET text = COALESCE($1, text), 
                    image_url = COALESCE($2, image_url), 
                    updated_at = NOW() 
                WHERE id = $3 
                RETURNING *`;
            
            const values = [text || null, imageUrl || null, postId];
            const result = await client.query(updateQuery, values);
    
            if (result.rows.length === 0) {
                throw new Error("Post not found");
            }
    
            return result.rows[0];  // Return the updated post
        } finally {
            client.release();
        }
    };

}

module.exports = PostService;



