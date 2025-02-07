const multer = require("multer");

// Configure storage
const storage = multer.memoryStorage(); // Store file in memory (useful for S3 uploads)

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit: 5MB
});

module.exports = upload;
