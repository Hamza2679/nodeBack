const pool = require("../config/db");
const GroupPost = require("../models/groupPost");

class GroupPostService {
    static async create(group_id, user_id, text, image_url) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO group_posts (group_id, user_id, text, image_url, created_at)
                 VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
                [group_id, user_id, text, image_url]
            );
    
            return result.rows[0];
        } catch (error) {
            throw new Error("Error creating post: " + error.message);
        } finally {
            client.release();
        }
    }
    

    static async getAllByGroup(groupId, limit = 10, offset = 0) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT 
                    gp.id,
                    gp.group_id,
                    gp.user_id,
                    gp.text,
                    gp.image_url,
                    gp.created_at,
                    u.first_name,
                    u.profilepicture,
                    u.role
                FROM group_posts gp
                JOIN users u ON gp.user_id = u.id
                WHERE gp.group_id = $1
                ORDER BY gp.created_at DESC
                LIMIT $2 OFFSET $3`,
                [groupId, limit, offset]
            );
    
            return result.rows.map(row => ({
                id: row.id,
                groupId: row.group_id,
                userId: row.user_id,
                text: row.text,
                imageUrl: row.image_url,
                createdAt: row.created_at,
                user: {
                    firstName: row.first_name,
                    profilePicture: row.profilepicture,
                    role: row.role
                }
            }));
        } catch (error) {
            throw new Error("Error retrieving group posts: " + error.message);
        } finally {
            client.release();
        }
    }
    
    

    static async getById(id) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM group_posts WHERE id = $1`,
                [id]
            );
            if (result.rows.length === 0) return null;
            const row = result.rows[0];
            return new GroupPost(row.id, row.group_id, row.user_id, row.text, row.image_url, row.created_at);
        } catch (error) {
            throw new Error("Error retrieving group post: " + error.message);
        } finally {
            client.release();
        }
    }

    static async delete(id, userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM group_posts WHERE id = $1 AND user_id = $2 RETURNING *`,
                [id, userId]
            );
            return result.rowCount > 0;
        } catch (error) {
            throw new Error("Error deleting group post: " + error.message);
        } finally {
            client.release();
        }
    }

    static async update(postId, userId, newText, imageUrl) {
        const client = await pool.connect();
        try {
            const postCheck = await client.query(
                `SELECT * FROM group_posts WHERE id = $1 AND user_id = $2`,
                [postId, userId]
            );
    
            if (postCheck.rows.length === 0) {
                throw new Error("Post not found or unauthorized");
            }
    
            // Update directly without trying to upload again
            const result = await client.query(
                `UPDATE group_posts 
                 SET text = $1, image_url = $2 
                 WHERE id = $3 RETURNING *`,
                [newText || postCheck.rows[0].text, imageUrl, postId]
            );
    
            return result.rows[0];
        } catch (error) {
            throw new Error("Error updating post: " + error.message);
        } finally {
            client.release();
        }
    }
    





    static async isUserGroupMember(groupId, userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
                [groupId, userId]
            );
            return result.rows.length > 0;
        } catch (error) {
            throw new Error("Error checking group membership: " + error.message);
        } finally {
            client.release();
        }
    }
    



}

module.exports = GroupPostService;
