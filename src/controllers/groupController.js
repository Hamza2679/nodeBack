const GroupService = require("../services/groupService");

exports.createGroup = async (req, res) => {
    try {
        const { name, description, imageUrl } = req.body;
        const createdBy = req.user?.userId;


        if (!createdBy) {
            return res.status(401).json({ error: "Unauthorized: Missing User Info" });
        }

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
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
