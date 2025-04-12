const followService = require("../services/followService");

exports.followUser = async (req, res) => {
    const followerId = req.user.userId;

    const { followingId } = req.body;

    if (!followingId) {
        return res.status(400).json({ error: "Following ID is required" });
    }

    try {
        const result = await followService.followUser(followerId, followingId);
        res.status(201).json({ message: "Followed successfully", data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.unfollowUser = async (req, res) => {
    const followerId = req.user.id;
    const { followingId } = req.body;

    if (!followingId) {
        return res.status(400).json({ error: "Following ID is required" });
    }

    try {
        const result = await followService.unfollowUser(followerId, followingId);
        res.status(200).json({ message: "Unfollowed successfully", data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getFollowers = async (req, res) => {
    const { userId } = req.params;
    

    try {
        const result = await followService.getFollowers(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getFollowing = async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await followService.getFollowing(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
