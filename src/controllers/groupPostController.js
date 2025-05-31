const GroupPostService = require("../services/groupPostService");
const { uploadToS3 } = require("../services/uploadService");
const PostService = require("../services/postService");
const GroupService = require("../services/groupService");
const User = require("../models/User"); // Make sure to import your User model
const getById =require("../services/UserService");
// Add this at the top of your controller
// const { getIO } = require('../utils/socket'); // Adjust path to your socket file

// Enhanced logging helper
function logEvent(event, data) {
  console.log(`[${new Date().toISOString()}] [EVENT] ${event}`, JSON.stringify(data, null, 2));
}

exports.createGroupPost = async (req, res) => {
  try {
    const { group_id, text } = req.body;
    const user_id = req.user.userId;
    
    logEvent("CREATE_GROUP_POST_START", {
      group_id,
      user_id,
      text,
      hasImage: !!req.file
    });

    if (!group_id || !user_id) {
      logEvent("CREATE_GROUP_POST_VALIDATION_FAIL", { error: "Group ID and User ID are required" });
      return res.status(400).json({ error: "Group ID and User ID are required" });
    }
    
    let imageUrl = null;
    if (req.file) {
      logEvent("UPLOAD_IMAGE_START", { originalname: req.file.originalname });
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
      logEvent("UPLOAD_IMAGE_SUCCESS", { imageUrl });
    }

    logEvent("CREATE_POST_DB_START", { group_id, user_id });
    const newPost = await GroupPostService.create(group_id, user_id, text, imageUrl);
    logEvent("CREATE_POST_DB_SUCCESS", { postId: newPost.id });

    // Get user details for socket emission
    const user = await getById.getUserById(user_id);
    if (!user) {
      logEvent("USER_NOT_FOUND", { user_id });
      return res.status(404).json({ error: "User not found" });
    }

    const postWithUser = {
      ...newPost,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        role: user.role
      }
    };

    // const io = getIO();
    const roomName = `group_${group_id}`;
    
    logEvent("EMIT_NEW_GROUP_POST", {
      room: roomName,
      postId: newPost.id,
      groupId: group_id,
      userId: user_id
    });
    
    // io.to(roomName).emit("new_group_post", {
    //   post: postWithUser,
    //   groupId: group_id
    // });
    
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    logEvent("CREATE_GROUP_POST_ERROR", { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
};

exports.deleteGroupPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    logEvent("DELETE_GROUP_POST_START", { postId: id, userId });

    const deletedPost = await GroupPostService.delete(id, userId);
    if (!deletedPost) {
      logEvent("DELETE_GROUP_POST_NOT_FOUND", { postId: id });
      return res.status(404).json({ error: "Post not found" });
    }
    
    // const io = getIO();
    // const roomName = `group_${deletedPost.group_id}`;
    
    logEvent("EMIT_DELETED_GROUP_POST", {
      room: roomName,
      postId: id,
      groupId: deletedPost.group_id
    });
    
    // io.to(roomName).emit("deleted_group_post", {
    //   postId: id,
    //   groupId: deletedPost.group_id
    // });
    
    logEvent("DELETE_GROUP_POST_SUCCESS", { postId: id });
    res.status(200).json({ message: "Group post deleted successfully" });
  } catch (error) {
    logEvent("DELETE_GROUP_POST_ERROR", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.updateGroupPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user.userId;
    
    logEvent("UPDATE_GROUP_POST_START", {
      postId,
      userId,
      textLength: text?.length || 0,
      hasImage: !!req.file
    });

    if (!text && !req.file) {
      logEvent("UPDATE_GROUP_POST_NO_CONTENT", { postId });
      return res.status(400).json({ error: "No content to update" });
    }

    const currentPost = await GroupPostService.getById(postId);
    if (!currentPost) {
      logEvent("UPDATE_GROUP_POST_NOT_FOUND", { postId });
      return res.status(404).json({ error: "Post not found" });
    }
    
    if (currentPost.user_id !== userId) {
      logEvent("UPDATE_GROUP_POST_UNAUTHORIZED", { postId, userId });
      return res.status(403).json({ error: "Unauthorized to update this post" });
    }

    let imageUrl = currentPost.image_url;
    if (req.file) {
      logEvent("UPDATE_IMAGE_START", { originalname: req.file.originalname });
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
      logEvent("UPDATE_IMAGE_SUCCESS", { imageUrl });
    }

    const updatedPost = await GroupPostService.update(postId, userId, text, imageUrl);
    
    // Get user details for socket emission
    const user = await getById.getUserById(userId);
    if (!user) {
      logEvent("USER_NOT_FOUND_UPDATE", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    const postWithUser = {
      ...updatedPost,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        role: user.role
      }
    };

    // const io = getIO();
    const roomName = `group_${updatedPost.group_id}`;
    
    logEvent("EMIT_UPDATED_GROUP_POST", {
      room: roomName,
      postId,
      groupId: updatedPost.group_id
    });
    
    io.to(roomName).emit("updated_group_post", {
      post: postWithUser,
      groupId: updatedPost.group_id
    });
    
    logEvent("UPDATE_GROUP_POST_SUCCESS", { postId });
    res.status(200).json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    logEvent("UPDATE_GROUP_POST_ERROR", { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// ... other controller functions ...

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