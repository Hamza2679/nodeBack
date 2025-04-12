class Follow {
    constructor(id, followerId, followingId, createdAt) {
        this.id = id;
        this.followerId = followerId;
        this.followingId = followingId;
        this.createdAt = createdAt;
    }
}

module.exports = Follow;
