
const Post = require("../models/post");
const PostService = require("../services/postService");

exports.createPost = async (req, res) => {
    try {
        

        const userId = req.user?.userId; // Extract userId from middleware
        const { text, imageUrl } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }

        // Call PostService instead of Post directly
        const newPost = await PostService.createPost(userId, text, imageUrl);

        return res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
