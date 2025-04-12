const pool = require('../config/db');

exports.followUser = async (followerId, followingId) => {
    if (followerId === followingId) {
        throw new Error("You cannot follow yourself.");
    }

    const result = await pool.query(
        `INSERT INTO follows (follower_id, following_id)
         VALUES ($1, $2)
         RETURNING *`,
        [followerId, followingId]
    );

    return result.rows[0];
};

exports.unfollowUser = async (followerId, followingId) => {
    const result = await pool.query(
        `DELETE FROM follows
         WHERE follower_id = $1 AND following_id = $2
         RETURNING *`,
        [followerId, followingId]
    );

    return result.rows[0];
};

exports.getFollowers = async (userId) => {
    const result = await pool.query(
        `SELECT users.*
         FROM follows
         JOIN users ON follows.follower_id = users.id
         WHERE follows.following_id = $1`,
        [userId]
    );

    return result.rows;
};

exports.getFollowing = async (userId) => {
    const result = await pool.query(
        `SELECT users.*
         FROM follows
         JOIN users ON follows.following_id = users.id
         WHERE follows.follower_id = $1`,
        [userId]
    );

    return result.rows;
};
