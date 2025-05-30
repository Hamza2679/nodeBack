const GroupPostService = require("../services/groupPostService");
const { getIO } = require("../utils/socket");
const { uploadToS3 } = require("../services/uploadService");
const PostService = require("../services/postService");
const GroupService = require("../services/groupService");


exports.createGroupPost = async (req, res) => {
  try {
    const { group_id, text } = req.body;
    const user_id = req.user.userId;
    
    if (!group_id || !user_id) {
      return res.status(400).json({ error: "Group ID and User ID are required" });
    }
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
    }

    const newPost = await GroupPostService.create(group_id, user_id, text, imageUrl);
    
    // Get io instance from Express app
    const io = req.app.get("io");
    io.to(`group_${group_id}`).emit("new_group_post", {
      ...newPost,
      user: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture
      }
    });
    
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fixed delete handler
exports.deleteGroupPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const deletedPost = await GroupPostService.delete(id, userId);
    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    const io = req.app.get("io");
    io.to(`group_${deletedPost.group_id}`).emit("deleted_group_post", {
      postId: id,
      groupId: deletedPost.group_id,
      deletedBy: {
        id: userId,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
    
    res.status(200).json({ message: "Group post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.createReply = async (req, res) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user.userId;

        // Create reply in database
        const reply = await GroupPostReplyService.create(postId, userId, text);

        // Emit real-time update
        const io = req.app.get("io");
        io.to(`post_${postId}`).emit("new_reply", {
            postId,
            reply: {
                ...reply,
                user: {
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    profilePicture: req.user.profilePicture
                }
            }
        });

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

// exports.deleteGroupPost = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user?.userId; 

//         const result = await GroupPostService.delete(id, userId);
//         if (!result.success) {
//             return res.status(403).json({ error: "Unauthorized or post not found" });
//         }
        
//        const io = req.app.get("io");
//         io.to(`group_${result.group_id}`).emit("deleted_group_post", {
//             postId: id,
//             groupId: result.group_id,
//             deletedBy: {
//                 id: req.user.userId,
//                 firstName: req.user.firstName,
//                 lastName: req.user.lastName
//             }
//         });
        
//         res.status(200).json({ message: "Group post deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

exports.updateGroupPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user.userId; 
        
        if (!text && !req.file) {
            return res.status(400).json({ error: "No content to update" });
        }

        const currentPost = await GroupPostService.getById(postId);
        if (!currentPost || currentPost.user_id !== userId) { // Fix property name
            return res.status(403).json({ error: "Post not found or unauthorized" });
        }

        let imageUrl = currentPost.image_url; 
        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
        }

        const updatedPost = await GroupPostService.update(postId, userId, text, imageUrl);
        
        const io = req.app.get("io");
        io.to(`group_${updatedPost.group_id}`).emit("updated_group_post", {
            ...updatedPost,
            user: {
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                profilePicture: req.user.profilePicture,
                role: req.user.role
            }
        });
        
        res.status(200).json({ message: "Post updated successfully", post: updatedPost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.postToFeed = async (req, res) => {
    try {
        const { postId } = req.params;
        console.log("Post ID:", postId);
        const userId = req.user.userId;
        console.log("User ID:", userId);

        const groupPost = await GroupPostService.getById(postId);
        console.log("Group Post:", groupPost);
        
        const group = await GroupService.getGroupById(groupPost.groupId);
        console.log("Group:", group);
        if (!group || group.created_by !== userId) {
            return res.status(403).json({ error: "Only group owner can post to feed" });
        }

        const feedPost = await PostService.createPost(
            userId,
            groupPost.text,
            groupPost.imageUrl,
            groupPost.id
        );

        res.status(201).json({
            message: "Group post published to feed",
            post: feedPost
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};