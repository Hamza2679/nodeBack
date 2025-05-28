class Event {
  constructor(
    id,
    userId,
    name,
    type,
    datetime,
    description,
    coverPhotoUrl,
    imageUrls,
    isOnline,
    onlineLink,
    onlineLinkVisible,  // ← this slot
    createdAt,
    updatedAt,
        groupId  // Add groupId

  ) {
    this.id                = id;
    this.userId            = userId;
    this.name              = name;
    this.type              = type;
    this.datetime          = datetime;
    this.description       = description;
    this.coverPhotoUrl     = coverPhotoUrl;
    this.imageUrls         = imageUrls;
    this.isOnline          = isOnline;
    this.onlineLink        = onlineLink;
    this.onlineLinkVisible = onlineLinkVisible;
    this.createdAt         = createdAt;
    this.updatedAt         = updatedAt;
        this.groupId = groupId;

  }
}

module.exports = Event;