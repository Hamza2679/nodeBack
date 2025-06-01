// generateKey.js
const crypto = require("crypto");

// Generate 32 random bytes:
const key = crypto.randomBytes(32);

// Print as hex (64 hex chars):
console.log(key.toString("hex"));
