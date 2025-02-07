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
}

module.exports = GroupService;
