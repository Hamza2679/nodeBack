const nodemailer = require('nodemailer');

exports.sendEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"ASTU Social Synch" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔒 Password Reset OTP - ASTU Social Synch",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center;">
                <h2>🔐 ASTU Social Synch</h2>
                <p>Your trusted platform for social connection</p>
            </div>
            <div style="padding: 20px;">
                <h3>Hello,</h3>
                <p>You requested to reset your password. Use the OTP below to complete the process. This OTP is valid for <strong>10 minutes</strong>.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://astusociall.netlify.app" style="background-color: #1e3a8a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                </div>
            </div>
            <div style="background-color: #f3f4f6; color: #6b7280; padding: 15px; text-align: center;">
                <p>&copy; ${new Date().getFullYear()} ASTU Social Synch. All rights reserved.</p>
            </div>
        </div>`,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Email sending failed");
    }
};
