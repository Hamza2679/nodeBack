const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types"); // Import for dynamic MIME type detection
require("dotenv").config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file to an S3 bucket.
 * @param {Buffer} fileBuffer - The file buffer.
 * @param {string} originalFileName - The original file name.
 * @param {string} bucketName - The S3 bucket name.
 * @returns {Promise<string>} - The S3 file URL.
 */
const uploadToS3 = async (fileBuffer, originalFileName, bucketName) => {
    try {
        // Generate a unique file name
        const fileExtension = mime.extension(mime.lookup(originalFileName) || "image/jpeg");
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const uploadParams = {
            Bucket: bucketName,
            Key: uniqueFileName,
            Body: fileBuffer,
            ContentType: mime.lookup(originalFileName) || "image/jpeg",
            ACL: "public-read", // Ensure the file is publicly accessible
        };

        await s3.send(new PutObjectCommand(uploadParams));

        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
    } catch (error) {
        console.error("S3 Upload Error:", error.message);
        throw new Error("Failed to upload image to S3");
    }
};

module.exports = { uploadToS3 };
