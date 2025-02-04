class Post {
    constructor(id, userId, text, imageUrl, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.text = text;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = Post;
