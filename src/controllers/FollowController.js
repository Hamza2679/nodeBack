const followService = require("../services/followService");

// POST /follow/:followingId
exports.followUser = async (req, res) => {
    const followerId = req.user.userId;
    const { followingId } = req.params;

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

// DELETE /unfollow/:followingId
exports.unfollowUser = async (req, res) => {
    const followerId = req.user.userId; // Ensure consistency with token property
    const { followingId } = req.params;

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



exports.countFollowers = async (req, res) => {
    const { userId } = req.params;

    try {
        const count = await followService.countFollowers(userId);
        res.status(200).json({ followers: count });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.countFollowing = async (req, res) => {
    const { userId } = req.params;

    try {
        const count = await followService.countFollowing(userId);
        res.status(200).json({ following: count });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.checkFollow = async (req, res) => {
    const followerId = req.user.userId;
    const { followingId } = req.params;

    if (!followingId) {
        return res.status(400).json({ error: "Following ID is required" });
    }

    try {
        const isFollowing = await followService.checkFollow(followerId, followingId);
        res.status(200).json({ isFollowing });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
