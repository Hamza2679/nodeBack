const express = require('express');
const multer = require('multer');
const { uploadToS3 } = require('../services/uploadService'); // Correct import path

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store in memory before uploading

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');

    res.status(200).json({ message: 'File uploaded successfully', url: result });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
