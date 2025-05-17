const GroupPostService = require("../services/groupPostService");
// const { getIo } = require("../utils/socket");
const { uploadToS3 } = require("../services/uploadService");
// Add to top of groupPostController.js
const PostService = require("../services/postService");
exports.createGroupPost = async (req, res) => {
    try {

        const { group_id, text } = req.body;
        const user_id = req.user?.userId; 
        if (!group_id || !user_id) {
            return res.status(400).json({ error: "Group ID and User ID are required" });
        }

        let imageUrl = null;

        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
        }

        const newPost = await GroupPostService.create(group_id, user_id, text, imageUrl);

        


        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        console.error("Create Group Post Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.createReply = async (req, res) => {
    try {
        const { groupPostId, text } = req.body;
        const userId = req.user.userId;
        const imageUrl =await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');

        const reply = await GroupPostReplyService.create(groupPostId, userId, text, imageUrl);
        
    
        
        res.status(201).json(reply);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGroupPosts = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { limit = 100, page = 1 } = req.query;

        if (!groupId) {
            return res.status(400).json({ error: "Group ID is required" });
        }

        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const groupPosts = await GroupPostService.getAllByGroup(groupId, parsedLimit, offset);
        res.status(200).json(groupPosts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getGroupPostById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const groupPost = await GroupPostService.getById(id);
        if (!groupPost) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.status(200).json(groupPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteGroupPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId; 

        if (!id) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const deleted = await GroupPostService.delete(id, userId);
        if (!deleted) {
            return res.status(403).json({ error: "Unauthorized or post not found" });
        }
        
        res.status(200).json({ message: "Group post deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateGroupPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user.userId; 
        if (!text && !req.file) {
            return res.status(400).json({ error: "No content to update" });
        }

        const currentPost = await GroupPostService.getById(postId);
        
        if (!currentPost || currentPost.userId !== userId) {
            return res.status(404).json({ error: "Post not found or unauthorized" });
        }

        let imageUrl = currentPost.image_url; 
        if (req.file) {
            
            imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
        }

        const updatedPost = await GroupPostService.update(postId, userId, text, imageUrl);

        res.status(200).json({ message: "Post updated successfully", post: updatedPost });
    } catch (error) {
        console.error("Error updating group post:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.postToFeed = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.userId;

        // Get the original group post
        const groupPost = await GroupPostService.getById(postId);
        if (!groupPost) {
            return res.status(404).json({ error: "Group post not found" });
        }

        // Verify requester is group owner
        const group = await GroupService.getGroupById(groupPost.group_id);
        if (!group || group.owner_id !== userId) {
            return res.status(403).json({ error: "Only group owner can post to feed" });
        }

        // Create feed post with group context
        const feedPost = await PostService.createPost(
            userId,
            groupPost.text,
            groupPost.image_url,
            groupPost.id // Add group_post_id reference
        );

        res.status(201).json({
            message: "Group post published to feed",
            post: feedPost
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};