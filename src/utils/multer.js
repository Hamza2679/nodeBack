const multer = require('multer');

// Multer storage configuration
const storage = multer.memoryStorage(); // Store files in memory temporarily

// Filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Allow image files
    } else {
        cb(new Error('Invalid file type'), false); // Reject non-image files
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

module.exports = upload;
