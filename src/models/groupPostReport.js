// models/groupPostReport.js
class GroupPostReport {
  constructor(id, reporterId, postId, reason, createdAt) {
    this.id          = id;
    this.reporterId  = reporterId;
    this.postId      = postId;
    this.reason      = reason;
    this.createdAt   = createdAt;
  }
}

module.exports = GroupPostReport;
