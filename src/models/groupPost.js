class GroupPost {
    constructor(id, groupId, userId, text, imageUrl, createdAt) {
        this.id = id;
        this.groupId = groupId;
        this.userId = userId;
        this.text = text;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
    }
}

module.exports = GroupPost;
