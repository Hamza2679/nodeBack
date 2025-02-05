const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadToS3 = async (fileBuffer, fileName, bucketName) => {
    const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: "image/jpeg", // Adjust based on file type
    };

    try {
        await s3.send(new PutObjectCommand(uploadParams));
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw error;
    }
};

module.exports = { uploadToS3 };
