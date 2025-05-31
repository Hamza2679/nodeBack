
function makeConversationId(userId1, userId2) {
  const a = userId1.toString();
  const b = userId2.toString();
  const [first, second] = [a, b].sort();
  return `${first}_${second}`;
}

module.exports = { makeConversationId };
