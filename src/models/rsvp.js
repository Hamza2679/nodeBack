class Rsvp {
  constructor(id, event_id, user_id, status, notified_at, created_at) {
    this.id = id;
    this.event_id = event_id;
    this.user_id = user_id;
    this.status = status;
    this.notified_at = notified_at;
    this.created_at = created_at;
  }
}

module.exports = Rsvp;
