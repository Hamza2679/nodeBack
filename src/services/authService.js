    const pool = require('../config/db');
    const User = require('../models/User');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const dotenv = require("dotenv");
    const emailService = require('./emailService');
    const { v4: uuidv4 } = require('uuid');
    const { uploadToS3 } = require('../services/uploadService'); // Import S3 upload function



    exports.uploadProfilePicture = async (file) => {
        return await uploadToS3(file.buffer, file.originalname, process.env.AWS_BUCKET_NAME);
    };

    // Update User Data (without password update)
    exports.updateUser = async (userId, userData) => {
        const client = await pool.connect();
        try {
            const { firstName, lastName, email, universityId, profilePicture } = userData;

            

    const result = await client.query(
        `UPDATE users 
        SET first_name = COALESCE($1, first_name), 
            last_name = COALESCE($2, last_name), 
            email = COALESCE($3, email), 
            universityid = COALESCE($4, universityid),  
            profilepicture = COALESCE($5, profilepicture)
        WHERE id = $6 
        RETURNING *`,
        [firstName, lastName, email, universityId, profilePicture, userId]
    );


            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            return new User(
                result.rows[0].id,
                result.rows[0].first_name,
                result.rows[0].last_name,
                result.rows[0].email,
                null, // Excluding password
                result.rows[0].universityid,
                result.rows[0].profilepicture
            );
        } finally {
            client.release();
        }
    };



    exports.createUser = async (firstName, lastName, email, password) => {
        const client = await pool.connect();
        try {
            // Generate salt and hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const result = await client.query(
                'INSERT INTO users (first_name, last_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [firstName, lastName, email, hashedPassword, 'student']
            );
            return new User(result.rows[0].id, firstName, lastName, email);
        } finally {
            client.release();
        }
    };


    exports.deleteUser = async (id) => {
        const client = await pool.connect();
        try {
            // Check if the user exists
            const userCheck = await client.query('SELECT * FROM users WHERE id = $1', [id]);
            if (userCheck.rows.length === 0) {
                throw new Error("User not found");
            }

            // Delete user's active tokens
            await client.query('DELETE FROM user_token WHERE user_id = $1', [id]);

            // Delete the user
            await client.query('DELETE FROM users WHERE id = $1', [id]);

            return { message: "User deleted successfully" };
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

            if (result.rows.length === 0) {
                throw new Error('Invalid credentials');
            }

            const user = result.rows[0];
            // Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role, universityId: user.universityid, profilePicture: user.profilepicture },
                SECRET_KEY,
                { expiresIn: '90d' }
            );

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
                role: user.role,
                universityId: user.universityid, 
                profilePicture: user.profilepicture, 
                token 
            };
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


            await client.query(
                `INSERT INTO password_reset_otp (email, otp, expires_at) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (email) 
                DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
                [email, otp, otpExpiry]
            );

            await emailService.sendEmail(email, otp);

            return { message: "OTP sent to your email" };
        } catch (error) {
            console.error("Error sending OTP:", error);
            throw new Error("Failed to send OTP");
        } finally {
            client.release();
        }
    };


    exports.verifyOTP = async (email, otp) => {
    const client = await pool.connect();
    try {
        const otpResult = await client.query(
        `SELECT otp, expires_at FROM password_reset_otp WHERE email = $1`,
        [email]
        );

        if (otpResult.rows.length === 0) throw new Error("Invalid or expired OTP");
        const storedOTP = otpResult.rows[0].otp;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // still UTC


        if (storedOTP !== otp) throw new Error("Incorrect OTP");
        if (new Date(expiresAt) < new Date()) {
            throw new Error("OTP has expired");
        }
        

        return { message: "OTP verified successfully" };
    } finally {
        client.release();
    }
    };

    exports.resetPassword = async (email, newPassword) => {
        const client = await pool.connect();
        try {
            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await client.query(
                `UPDATE users SET password = $1 WHERE email = $2`,
                [hashedPassword, email]
            );
            await client.query(
                `DELETE FROM password_reset_otp WHERE email = $1`,
                [email]
            );
            return { message: "Password reset successfully" };
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
                `SELECT 
                    id, 
                    first_name, 
                    last_name, 
                    email, 
                    password, 
                    universityid, 
                    profilepicture, 
                    role 
                FROM users 
                WHERE id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            const row = result.rows[0];

            return {
                id: row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email,
                password: row.password,
                universityId: row.universityid,
                profilePicture: row.profilepicture,
                role: row.role
            };
        } finally {
            client.release();
        }
    };
