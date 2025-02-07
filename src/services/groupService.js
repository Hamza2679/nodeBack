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
    static async getAll() {
        const client = await pool.connect();
        try {
            const result = await client.query(`SELECT * FROM groups ORDER BY created_at DESC`);
            return result.rows; // Return all groups
        } catch (error) {
            throw new Error("Error fetching groups: " + error.message);
        } finally {
            client.release();
        }
    }
    static async getById(groupId) {
        const client = await pool.connect();
        try {
            const result = await client.query(`SELECT * FROM groups WHERE id = $1`, [groupId]);
            if (result.rows.length === 0) {
                throw new Error("Group not found");
            }
            return result.rows[0]; // Return the group
        } catch (error) {
            throw new Error("Error fetching group: " + error.message);
        } finally {
            client.release();
        }
    }
}

module.exports = GroupService;
