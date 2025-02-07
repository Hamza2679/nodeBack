const GroupService = require("../services/groupService");

exports.createGroup = async (req, res) => {
    try {
        console.log("Authenticated User:", req.user); // Debugging line
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
