class Message {
    constructor(id, senderId, receiverId, text, imageUrl, createdAt, editedAt, isDeleted) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.text = text;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
        this.editedAt = editedAt;
        this.isDeleted = isDeleted;
    }
}

module.exports = Message;