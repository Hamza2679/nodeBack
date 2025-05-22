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
    updatedAt
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
  }
}

module.exports = Event;