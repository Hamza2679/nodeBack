const pool = require('../config/db');
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const SECRET_KEY = "your_secret_key";

exports.createAdmin = async (firstName, lastName, email, password, universityId, role) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO users (first_name, last_name, email, password, universityid, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [firstName, lastName, email, password, universityId, role]
        );
        return new Admin(result.rows[0].id, firstName, lastName, email, password, universityId, role);
    } finally {
        client.release();
    }
};
exports.loginAdmin = async (identifier, password) => {
    const client = await pool.connect();
    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE email = $1 OR university_id = $1`, 
            [identifier]
        );

        if (result.rows.length === 0) {
            throw new Error("Invalid credentials");
        }

        const admin = result.rows[0];

        if (password !== admin.password) {
            throw new Error("Invalid credentials");
        }

        const token = jwt.sign(
            { adminId: admin.id, email: admin.email, role: admin.role },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        await client.query(
            `INSERT INTO user_token (user_id, acc_token, expire_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
            [admin.id, token]
        );

        return {
            id: admin.id,
            firstName: admin.first_name,
            lastName: admin.last_name,
            email: admin.email,
            universityId: admin.university_id,
            role: admin.role,
            token,
        };
    } finally {
        client.release();
    }
};