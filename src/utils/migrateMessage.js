const crypto = require("crypto");
const { Pool } = require("pg");
require("dotenv").config();

// Validate encryption key
const KEY_HEX = process.env.MESSAGE_ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error("Set MESSAGE_ENCRYPTION_KEY as 64-hex chars before running migration");
}
const KEY = Buffer.from(KEY_HEX, "hex");

// Encryption helper
function encryptText(plaintext) {
    console.log(`🔐 Encrypting message: ${plaintext}`) ;
  const iv = crypto.randomBytes(12);
  console.log(`🔐 Generated IV: ${iv.toString('hex')}`);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  console.log(`🔐 Created cipher with key: ${KEY.toString('hex')}`);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return { iv, authTag, ciphertext };
}

async function migrate() {
    console.log("🔄 Starting message migration...");
  const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_s9V7lcznhdkj@ep-old-bread-a59ot1q4-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

  console.log("🔄 Connected to database");
  const client = await pool.connect();
  console.log("🔄 Acquired database client");
  try {
    await client.query("BEGIN");

    // Fetch all plaintext messages
    const selectRes = await client.query(
      `SELECT id, text FROM messages WHERE text IS NOT NULL`
    );

    for (const row of selectRes.rows) {
      const { id, text } = row;
      try {
        const { iv, authTag, ciphertext } = encryptText(text);

        // Update row with encrypted values
        await client.query(
          `
          UPDATE messages
          SET iv = $1,
              auth_tag = $2,
              ciphertext = $3,
              text = NULL
          WHERE id = $4
          `,
          [iv, authTag, ciphertext, id]
        );

        console.log(`🔐 Encrypted message ID: ${id}`);
      } catch (encryptErr) {
        console.error(`❌ Failed to encrypt message ID ${id}:`, encryptErr.message);
        throw encryptErr;
      }
    }

    await client.query("COMMIT");
    console.log(`✅ Successfully migrated ${selectRes.rowCount} messages`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🚨 Migration failed. Rolled back changes.", err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch((err) => {
  console.error("Fatal error during migration:", err);
  process.exit(1);
});
