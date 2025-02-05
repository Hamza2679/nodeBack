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


const LikeService = require("../services/likeService");
const CommentService = require("../services/commentService");

exports.likePost = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.body;

        if (!userId || !postId) return res.status(400).json({ error: "User ID and Post ID are required" });

        const like = await LikeService.likePost(userId, postId);
        return res.status(201).json({ message: "Post liked successfully", like });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.unlikePost = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.body;

        if (!userId || !postId) return res.status(400).json({ error: "User ID and Post ID are required" });

        const success = await LikeService.unlikePost(userId, postId);
        if (!success) return res.status(404).json({ error: "Like not found" });

        return res.status(200).json({ message: "Post unliked successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getLikesByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const likes = await LikeService.getLikesByPost(postId);
        return res.status(200).json({ likes });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.addComment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { postId, content } = req.body;

        if (!userId || !postId || !content) return res.status(400).json({ error: "Missing required fields" });

        const comment = await CommentService.addComment(userId, postId, content);
        return res.status(201).json({ message: "Comment added successfully", comment });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await CommentService.getCommentsByPost(postId);
        return res.status(200).json({ comments });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
