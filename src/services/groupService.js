const pool = require("../config/db");
const Group = require("../models/group");

class GroupService {
    static async create(name, description, imageUrl, createdBy) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `INSERT INTO groups (name, description, image_url, created_by, created_at)
                 VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
                [name, description, imageUrl, createdBy]
            );
            const row = result.rows[0];
            return new Group(row.id, row.name, row.description, row.image_url, row.created_by, row.created_at);
        } catch (error) {
            throw new Error("Error creating group: " + error.message);
        } finally {
            client.release();
        }
    }
    static async delete(groupId, userId) {
        const client = await pool.connect();
        try {
            // First check if the group exists and belongs to the user
            const groupResult = await client.query(
                `SELECT * FROM groups WHERE id = $1`,
                [groupId]
            );
    
            if (groupResult.rowCount === 0) {
                return false; // Group not found
            }
    
            const group = groupResult.rows[0];
            if (group.created_by !== userId) {
                return false; // User is not the creator
            }
    
            // Now delete the group
            await client.query(
                `DELETE FROM groups WHERE id = $1`,
                [groupId]
            );
    
            return true;
        } catch (error) {
            throw new Error("Error deleting group: " + error.message);
        } finally {
            client.release();
        }
    }
    

    static async getAll(userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    g.*, 
                    EXISTS (
                        SELECT 1 FROM group_members gm 
                        WHERE gm.group_id = g.id AND gm.user_id = $1
                    ) AS is_joined
                FROM groups g
                ORDER BY g.created_at DESC
            `, [userId]);
    
            return result.rows;
        } catch (error) {
            throw new Error("Error fetching groups: " + error.message);
        } finally {
            client.release();
        }
    }
    


    static async getById(groupId, userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT
                    g.id,
                    g.name,
                    g.description,
                    g.image_url,
                    g.created_by,
                    g.created_at,
                    (
                        SELECT COUNT(*) FROM group_members gm
                        WHERE gm.group_id = g.id
                    )::int AS member_count,
                    EXISTS (
                        SELECT 1 FROM group_members gm
                        WHERE gm.group_id = g.id AND gm.user_id = $2
                    ) AS is_joined
                FROM groups g
                WHERE g.id = $1
            `, [groupId, userId]);
    
            if (result.rows.length === 0) {
                throw new Error("Group not found");
            }
    
            return result.rows[0];
        } catch (error) {
            throw new Error("Error fetching group: " + error.message);
        } finally {
            client.release();
        }
    }

    
    
    
    static async getGroupMembers(groupId) {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.profilepicture,
                    u.role
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                WHERE gm.group_id = $1
            `, [groupId]);
    
            return result.rows;
        } catch (error) {
            throw new Error("Error fetching group members: " + error.message);
        } finally {
            client.release();
        }
    }
    
    
    static async update(groupId, name, description, imageUrl, userId) {
        const client = await pool.connect();
        try {
            const checkQuery = "SELECT * FROM groups WHERE id = $1";
const checkResult = await client.query(checkQuery, [groupId]);

if (checkResult.rows.length === 0) {
    throw new Error("Group not found");
}

if (checkResult.rows[0].created_by !== userId) {
    throw new Error("Unauthorized: You can only update your own group");
}
            const result = await client.query(
                `UPDATE groups 
                 SET name = $1, description = $2, image_url = $3 
                 WHERE id = $4 RETURNING *`,
                [name, description, imageUrl || null, groupId]
            );

            return result.rows[0];
        } catch (error) {
            throw new Error("Error updating group: " + error.message);
        } finally {
            client.release();
        }
    }

    static async joinGroup(groupId, userId) {
        const client = await pool.connect();
        try {
            const check = await client.query(
                `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
                [groupId, userId]
            );
            if (check.rows.length > 0) {
                throw new Error("User already a member of this group");
            }
    
            const result = await client.query(
                `INSERT INTO group_members (group_id, user_id, role, joined_at)
                 VALUES ($1, $2, 'member', NOW()) RETURNING *`,
                [groupId, userId]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error("Error joining group: " + error.message);
        } finally {
            client.release();
        }
    }
    
    static async leaveGroup(groupId, userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *`,
                [groupId, userId]
            );
            if (!result.rows.length) {
                throw new Error("User is not a member of this group");
            }
            return result.rows[0];
        } catch (error) {
            throw new Error("Error leaving group: " + error.message);
        } finally {
            client.release();
        }
    }
    

    static async isUserMember(groupId, userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
                [groupId, userId]
            );
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }
    

}

module.exports = GroupService;










