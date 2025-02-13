class Event {
  constructor(
    id,
    user_id,
    name,
    type,
    datetime,
    description,
    cover_photo_url,
    image_urls,
    created_at,
    updated_at
  ) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.type = type;
    this.datetime = datetime;
    this.description = description;
    this.cover_photo_url = cover_photo_url;
    this.image_urls = image_urls;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Event;