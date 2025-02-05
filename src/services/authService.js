const pool = require('../config/db');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dotenv = require("dotenv");
const emailService = require('./emailService');


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
    
const SECRET_KEY = process.env.JWT_SECRET;
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT * FROM users WHERE email = $1 OR universityid = $1', 
            [identifier]
        );

        if (result.rows.length === 0 || password !== result.rows[0].password) {
            throw new Error('Invalid credentials');
        }

        const user = result.rows[0];
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '90d' }
        );
        

        await client.query(
            `INSERT INTO user_token (user_id, acc_token, expire_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
            [user.id, token]
        );

        return { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, token };
    } finally {
        client.release();
    }
};

exports.logoutUser = async (userId, token) => {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM user_token WHERE user_id = $1 AND acc_token = $2', [userId, token]);
        return { message: 'User logged out successfully' };
    } finally {
        client.release();
    }
};



exports.sendOTP = async (email) => {
    const client = await pool.connect();
    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        console.log("Generated OTP:", otp);

        await client.query(
            `INSERT INTO password_reset_otp (email, otp, expires_at) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (email) 
            DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
            [email, otp, otpExpiry]
        );

        console.log("OTP stored in database:", otp);
        await emailService.sendEmail(email, otp);
        console.log("OTP email sent successfully");

        return { message: "OTP sent to your email" };
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP");
    } finally {
        client.release();
    }
};


exports.verifyOTPAndResetPassword = async (email, otp, newPassword) => {
    const client = await pool.connect();
    try {
        const otpResult = await client.query(
            `SELECT otp, expires_at FROM password_reset_otp WHERE email = $1`,
            [email]
        );

        if (otpResult.rows.length === 0) {
            throw new Error("Invalid or expired OTP");
        }

        const storedOTP = otpResult.rows[0].otp;
        const expiresAt = new Date(otpResult.rows[0].expires_at);
        
        if (storedOTP !== otp) {
            throw new Error("Incorrect OTP");
        }

        if (expiresAt < new Date()) {
            throw new Error("OTP has expired");
        }

        await client.query(
            `UPDATE users SET password = $1 WHERE email = $2`,
            [newPassword, email]
        );

        await client.query(
            `DELETE FROM password_reset_otp WHERE email = $1`,
            [email]
        );

        return { message: "Password has been reset successfully" };
    } catch (error) {
        throw new Error(error.message);
    } finally {
        client.release();
    }
};



exports.getAllUsers = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT id, first_name, last_name, email, role FROM users'
        );
        return result.rows;
    } finally {
        client.release();
    }
};

exports.getUserById = async (userId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        return result.rows[0];
    } finally {
        client.release();
    }
};
