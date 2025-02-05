const PostService = require("../services/postService");
const { uploadToS3 } = require("../services/uploadService");

exports.createPost = async (req, res) => {
    try {
        const userId = req.user?.userId; // Extract user ID from token middleware
        const { text } = req.body;
        let imageUrl = null;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }

        // If an image is uploaded, upload to S3
        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
        }

        // Create post in the database
        const newPost = await PostService.createPost(userId, text, imageUrl);

        return res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        console.error("Post Creation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
