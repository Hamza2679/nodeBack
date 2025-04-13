class GroupMember {
    constructor(id, groupId, userId, role, joinedAt) {
        this.id = id;
        this.groupId = groupId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt;
    }
}

module.exports = GroupMember;
