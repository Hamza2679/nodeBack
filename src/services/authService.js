const pool = require('../config/db');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const SECRET_KEY = "your_secret_key";

exports.createUser = async (firstName, lastName, email, password) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [firstName, lastName, email, password, 'student']
        );
        return new User(result.rows[0].id, firstName, lastName, email);
    } finally {
        client.release();
    }
};

exports.loginUser = async (identifier, password) => {
    const client = await pool.connect();
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR universityid = $1', 
            [identifier]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid credentials');
        }

        const user = result.rows[0];

        if (password !== user.password) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        
        // Store token in user_token table
        await client.query(
            `INSERT INTO user_token (user_id, acc_token, expire_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
            [user.id, token]
        );

        return { 
            id: user.id, 
            firstName: user.first_name, 
            lastName: user.last_name, 
            email: user.email,
            universityId: user.universityid,
            profilePicture: user.profilepicture,
            role: user.role,
            token
        };
    } catch (error) {
        throw new Error(error.message);
    } finally {
        client.release();
    }
};

exports.logoutUser = async (userId, token) => {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM user_token WHERE user_id = $1 AND acc_token = $2', [userId, token]);
        return { message: 'User logged out successfully' };
    } catch (error) {
        throw new Error('Logout failed');
    } finally {
        client.release();
    }
};
