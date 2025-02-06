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

// Edit a Post
exports.editPost = async (req, res) => {
    try {
        const userId = req.user?.userId; 
        const { postId } = req.params;
        const { text } = req.body;
        const imageUrl = req.file ? req.file.buffer.toString("base64") : null; // Example handling image

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized: No user ID provided" });
        }
        if (!postId) {
            return res.status(400).json({ error: "Post ID is required" });
        }
        if (!text && !imageUrl) {
            return res.status(400).json({ error: "At least one field (text or image) is required for update" });
        }

        const client = await pool.connect();
        try {
            // Check if the post belongs to the user
            const checkQuery = "SELECT userid FROM posts WHERE id = $1";
            const checkResult = await client.query(checkQuery, [postId]);

            if (checkResult.rows.length === 0 || checkResult.rows[0].userid !== userId) {
                return res.status(403).json({ error: "You can only edit your own posts" });
            }

            // Update the post
            const updateQuery = `
                UPDATE posts 
                SET text = COALESCE($1, text), image_url = COALESCE($2, image_url), updated_at = NOW() 
                WHERE id = $3 RETURNING *`;
            const values = [text || null, imageUrl || null, postId];

            const updatedPost = await client.query(updateQuery, values);
            res.status(200).json({ message: "Post updated successfully", post: updatedPost.rows[0] });
        } finally {
            client.release();
        }
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
