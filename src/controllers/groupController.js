const GroupService = require("../services/groupService");

const { uploadToS3 } = require('../services/uploadService'); 

exports.createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        const createdBy = req.user?.userId;


        if (!createdBy) {
            return res.status(401).json({ error: "Unauthorized: Missing User Info" });
        }

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }
        let imageUrl = null;
        if (req.file) {
            try {
                imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
            } catch (uploadError) {
                return res.status(500).json({ error: "Failed to upload image to S3" });
            }
        }

        const group = await GroupService.create(name, description, imageUrl, createdBy);
        res.status(201).json({ message: "Group created successfully", group });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getAllGroups = async (req, res) => {
    try {
        const groups = await GroupService.getAll();
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getGroupById = async (req, res) => {
    try {
        const { id } = req.params; // Get ID from request params
        const group = await GroupService.getById(id);
        res.status(200).json(group);
    } catch (error) {
        res.status(404).json({ error: error.message }); // Send 404 if not found
    }
};


exports.updateGroup = async (req, res) => {
    try {
        const { GroupId } = req.params;
        const { name, description } = req.body;
        const userId = req.user.userId;
        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        let imageUrl = null;
        if (req.file) {
            try {
                imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, 'social-sync-for-final');
            } catch (uploadError) {
                return res.status(500).json({ error: "Failed to upload image to S3" });
            }
        }

        const updatedGroup = await GroupService.update( GroupId, name, description, imageUrl, userId);
        
        res.status(200).json({ message: "Group updated successfully", group: updatedGroup });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
