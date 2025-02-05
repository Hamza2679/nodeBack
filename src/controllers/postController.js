const PostService = require("../services/postService");


exports.createPost = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { text } = req.body;
        const imageUrl = req.file ? await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final') : null;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }

        const newPost = await PostService.createPost(userId, text, imageUrl);
        return res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getPosts = async (req, res) => {
    try {
        const posts = await PostService.getAllPosts();
        return res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await PostService.getPostById(id);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json({ post });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
