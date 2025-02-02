const pool = require('../config/db');
const emailService = require('./emailService');

exports.generateAndSendOTP = async (email) => {
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
    } finally {
        client.release();
    }
};
