// services/uploadService.js
require("dotenv").config();                  // ensure this is first
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const region     = process.env.AWS_REGION;       
const bucketName = process.env.AWS_BUCKET_NAME;  

if (!region || !bucketName) {
  console.error("⚠️  Missing AWS_REGION or AWS_BUCKET_NAME in .env");
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file buffer to your S3 bucket and returns its public URL.
 */
async function uploadToS3(fileBuffer, originalFileName) {
  // derive file extension & unique key
  const ext = mime.extension(mime.lookup(originalFileName) || "application/octet-stream");
  const key = `${Date.now()}-${Math.random().toString(36).substr(2)}.${ext}`;

  const params = {
    Bucket:      bucketName,
    Key:         key,
    Body:        fileBuffer,
    ContentType: mime.lookup(originalFileName) || "application/octet-stream",
    ACL:         "public-read",
  };

  try {
    await s3.send(new PutObjectCommand(params));

    // regional URL
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("S3 Upload Error:", {
      name:      error.name,
      code:      error.$metadata?.httpStatusCode || error.Code,
      message:   error.message,
      requestId: error.$metadata?.requestId,
      region,
      bucket:    bucketName,
    });
    throw new Error(`S3 upload failed: ${error.name} – ${error.message}`);
  }
}

module.exports = { uploadToS3 };
