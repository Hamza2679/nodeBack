const PostService = require("../services/postService");
const { uploadToS3 } = require("../services/uploadService"); // Adjust the path as needed


exports.createPost = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }

        const { text } = req.body;
        let imageUrl = null;

        // Handle Image Upload Separately
        if (req.file) {
            try {
                imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
            } catch (uploadError) {
                console.error("S3 Upload Error:", uploadError);
                return res.status(500).json({ error: "Failed to upload image" });
            }
        }

        // Validate post content
        if (!text && !imageUrl) {
            return res.status(400).json({ error: "Post must contain either text or an image" });
        }

        // Create Post
        const newPost = await PostService.createPost(userId, text, imageUrl);
        return res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        console.error("Create Post Error:", error);
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

exports.getPostsByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const posts = await PostService.getPostsByUserId(id); // plural

        if (posts.length === 0) {
            return res.status(404).json({ error: "No posts found for this user" });
        }

        return res.status(200).json({ posts });
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


const pool = require("../config/db");

// Report a Post or Comment
exports.reportContent = async (req, res) => {
    try {
        const userId = req.user?.userId; 
        const { postId, commentId, reason } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }
        if (!reason) {
            return res.status(400).json({ error: "Reason for reporting is required" });
        }
        if (!postId && !commentId) {
            return res.status(400).json({ error: "Either postId or commentId is required" });
        }

        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO report (userid, postid, commentid, reason) 
                VALUES ($1, $2, $3, $4) RETURNING *`;
            const values = [userId, postId || null, commentId || null, reason];

            await client.query(query, values);
            res.status(201).json({ message: "Report submitted successfully" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



exports.editPost = async (req, res) => {
    try {
        const userId = req.user?.userId;  // Get user ID from the authentication token
        const { postId } = req.params;  // Get post ID from the request parameters
        const { text } = req.body;  // Get the text from the request body
        let imageUrl = null;  // Initialize the image URL

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }
        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        // If there's an image, upload it to S3
        if (req.file) {
            try {
                imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
            } catch (uploadError) {
                console.error("S3 Upload Error:", uploadError);
                return res.status(500).json({ error: "Failed to upload image to S3" });
            }
        }

        // Validate the input data
        if (!text && !imageUrl) {
            return res.status(400).json({ error: "At least one field (text or image) is required for update" });
        }

        // Call the PostService to update the post
        const updatedPost = await PostService.editPost(userId, postId, text, imageUrl);

        res.status(200).json({ message: "Post updated successfully", post: updatedPost });
    } catch (error) {
        console.error("Edit Post Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.deletePost = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const postId = req.params.postId;

        console.log("User ID:", userId);
        console.log("Post ID:", postId);

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }

        const result = await PostService.deletePost(userId, postId);

        if (!result) {
            return res.status(404).json({ error: "Post not found or unauthorized" });
        }

        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Delete Post Error:", error.stack); // Print full error details
        res.status(500).json({ error: error.message });
    }
};
