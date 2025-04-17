const MessageService = require("../services/messageService");
const { uploadToS3 } = require("../services/uploadService");

/**
 * Send a message
 */
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, text } = req.body;
        let imageUrl = null;

        // Validate input
        if (!receiverId) {
            return res.status(400).json({ error: "Receiver ID is required" });
        }
        if (!text && !req.file) {
            return res.status(400).json({ error: "Message must contain text or image" });
        }

        // Upload image to S3 if provided
        if (req.file) {
            try {
                imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
            } catch (uploadError) {
                console.error("S3 Upload Error:", uploadError);
                return res.status(500).json({ error: "Failed to upload image" });
            }
        }

        // Create message
        const message = await MessageService.createMessage(senderId, receiverId, text, imageUrl);
        res.status(201).json({ message });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Get conversation between two users
 */
exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const otherUserId = req.params.userId;

        if (!otherUserId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const messages = await MessageService.getConversation(userId, otherUserId);
        res.status(200).json({ messages });
    } catch (error) {
        console.error("Get Conversation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Get recent chats for a user
 */
exports.getRecentChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const messages = await MessageService.getMessagesByUser(userId);
        res.status(200).json({ messages });
    } catch (error) {
        console.error("Get Recent Chats Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getPaginatedMessages = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const receiverId = req.params.receiverId;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const messages = await MessageService.getMessagesBetweenUsersPaginated(senderId, receiverId, limit, offset);

        res.status(200).json({ messages });
    } catch (error) {
        console.error("Get Paginated Messages Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


/**
 * Edit a message
 */
exports.editMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { messageId } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "New message text is required" });
        }

        const message = await MessageService.editMessage(messageId, userId, text);
        res.status(200).json({ message });
    } catch (error) {
        console.error("Edit Message Error:", error);
        res.status(error.message.includes("unauthorized") ? 403 : 404)
           .json({ error: error.message });
    }
};

/**
 * Delete a message
 */
exports.deleteMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { messageId } = req.params;

        const message = await MessageService.deleteMessage(messageId, userId);
        res.status(200).json({ 
            message: "Message deleted successfully",
            deletedMessage: message
        });
    } catch (error) {
        console.error("Delete Message Error:", error);
        res.status(error.message.includes("unauthorized") ? 403 : 404)
           .json({ error: error.message });
    }
};