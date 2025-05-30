// models/report.js
class Report {
  constructor(id, reporterId, reportedId, messageId, reason, createdAt) {
    this.id = id;
    this.reporterId = reporterId;
    this.reportedId = reportedId;
    this.messageId = messageId;
    this.reason = reason;
    this.createdAt = createdAt;
  }
}

module.exports = Report;
