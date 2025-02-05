const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
  region: "eu-north-1", // Set your correct region here
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


// Function to upload file to S3
const uploadToS3 = async (fileBuffer, fileName, bucketName) => {
  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
   // ACL: 'public-read',
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};

// Export the function
module.exports = { uploadToS3 };
