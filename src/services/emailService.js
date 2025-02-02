const nodemailer = require('nodemailer');

exports.sendEmail = async (email, otp) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response); // ✅ Debug log
    } catch (error) {
        console.error("Error sending email:", error); // ✅ Debug error log
        throw new Error("Email sending failed");
    }
};
