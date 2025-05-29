const nodemailer = require('nodemailer');

exports.sendSignupOTP = async (email, otp, firstName, lastName) => {
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
        subject: "🌟 Welcome to ASTU Social Synch - Verify Your Account",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1e3a8a; color: white; padding: 20px; text-align: center;">
                <h2>🚀 ASTU Social Synch</h2>
                <p>Your platform for campus connections</p>
            </div>
            <div style="padding: 20px;">
                <h3>Hello ${firstName} ${lastName},</h3>
                <p>Welcome to ASTU Social Synch! To complete your registration, please use the OTP below to verify your account. This OTP is valid for <strong>10 minutes</strong>.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; background: #f0f5ff; padding: 10px; border-radius: 5px;">${otp}</p>
                </div>
                <p>If you didn't request this, please contact our support team immediately.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://astusociall.netlify.app" style="background-color: #1e3a8a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Visit Our Platform</a>
                </div>
            </div>
            <div style="background-color: #f3f4f6; color: #6b7280; padding: 15px; text-align: center; font-size: 12px;">
                <p>© ${new Date().getFullYear()} ASTU Social Synch. Adama Science and Technology University</p>
            </div>
        </div>`,
    };

    try {
        console.log("Attempting to send OTP email to:", email, "with OTP:", otp);

let info = await transporter.sendMail(mailOptions);
console.log("Email sent successfully:", info.response);

        console.log("Signup OTP Email sent:", info.response);
        return true;
    } catch (error) {
    console.error("Error sending signup OTP email:", error);

        throw new Error("Failed to send signup OTP email");
    }
};