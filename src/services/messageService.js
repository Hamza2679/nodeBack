// services/messageService.js

const crypto = require("crypto");
const pool = require("../config/db");
const Message = require("../models/message");
require("dotenv").config();
const { realtimeDb } = require("./firebaseService");
const { makeConversationId } = require("../utils/conversationIdUtil");

const KEY_HEX = process.env.MESSAGE_ENCRYPTION_KEY;
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error(
    "MESSAGE_ENCRYPTION_KEY must be set in env as a 64-character hex string (32 bytes)."
  );
}
const KEY = Buffer.from(KEY_HEX, "hex");

class MessageService {
  static _encryptPlaintext(plaintext) {
    // 1) generate a 12-byte random IV
    const iv = crypto.randomBytes(12);
    // 2) create AES-256-GCM cipher
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    // 3) encrypt
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    // 4) get authentication tag (16 bytes)
    const authTag = cipher.getAuthTag();
    return { iv, authTag, ciphertext };
  }

  // ── Helper: decrypt given Buffers iv/authTag/ciphertext => UTF-8 string
  static _decryptCipher(iv, authTag, ciphertext) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }

  static async createMessage(senderId, receiverId, text, imageUrl) {
    const client = await pool.connect();
    try {
      // 1) Encrypt the plaintext 'text'
      const { iv, authTag, ciphertext } = MessageService._encryptPlaintext(text);

      // 2) Insert into PostgreSQL (iv/authTag/ciphertext as BYTEA)
      const query = `
        INSERT INTO messages 
          (sender_id, receiver_id, iv, auth_tag, ciphertext, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        senderId,
        receiverId,
        iv, // BYTEA
        authTag, // BYTEA
        ciphertext, // BYTEA
        imageUrl || null,
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];

      // 3) Decrypt right away so that we return a Message model containing plaintext
      const decryptedText = MessageService._decryptCipher(
        row.iv,
        row.auth_tag,
        row.ciphertext
      );
      const messageObj = new Message(
        row.id,
        row.sender_id,
        row.receiver_id,
        decryptedText,
        row.image_url,
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

      // 4) Push the encrypted data to Firebase (so Firebase only stores ciphertext)
      const convoId = makeConversationId(senderId, receiverId);
      const firebaseData = {
        id: row.id.toString(),
        senderId: row.sender_id.toString(),
        receiverId: row.receiver_id.toString(),
        // Store Base64-encoded blobs so clients can’t directly read them
        ciphertext: row.ciphertext.toString("base64"),
        iv: row.iv.toString("base64"),
        authTag: row.auth_tag.toString("base64"),
        imageUrl: row.image_url || null,
        createdAt: row.created_at.toISOString(),
        editedAt: row.edited_at ? row.edited_at.toISOString() : null,
        isDeleted: row.is_deleted || false,
      };
      await realtimeDb
        .ref(`conversations/${convoId}/messages/${row.id}`)
        .set(firebaseData);

      return messageObj;
    } finally {
      client.release();
    }
  }

  // ── Edit an existing message (must re-encrypt newText)
  static async editMessage(messageId, userId, newText) {
    const client = await pool.connect();
    try {
      // 1) Encrypt the new plaintext
      const { iv, authTag, ciphertext } = MessageService._encryptPlaintext(
        newText
      );

      // 2) Update row: replace iv/authTag/ciphertext, set edited_at = NOW()
      const query = `
        UPDATE messages
        SET 
          iv       = $1,
          auth_tag = $2,
          ciphertext = $3,
          edited_at = NOW()
        WHERE id = $4 AND sender_id = $5
        RETURNING *;
      `;
      const values = [iv, authTag, ciphertext, messageId, userId];
      const result = await client.query(query, values);
      if (result.rowCount === 0)
        throw new Error("Message not found or unauthorized");
      const row = result.rows[0];

      // 3) Decrypt so we can return plaintext
      const decryptedText = MessageService._decryptCipher(
        row.iv,
        row.auth_tag,
        row.ciphertext
      );
      const updatedMessage = new Message(
        row.id,
        row.sender_id,
        row.receiver_id,
        decryptedText,
        row.image_url,
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

      // 4) Sync the new encrypted blobs to Firebase
      const convoId = makeConversationId(row.sender_id, row.receiver_id);
      await realtimeDb
        .ref(`conversations/${convoId}/messages/${row.id}`)
        .update({
          ciphertext: row.ciphertext.toString("base64"),
          iv: row.iv.toString("base64"),
          authTag: row.auth_tag.toString("base64"),
          editedAt: row.edited_at.toISOString(),
        });

      return updatedMessage;
    } finally {
      client.release();
    }
  }

  // ── Delete a message: we null out iv/authTag/ciphertext (so text is unrecoverable),
  //    null image_url, and set is_deleted = TRUE. Firebase removes the node.
  static async deleteMessage(messageId, userId) {
    const client = await pool.connect();
    try {
      // 1) Null‐out the encrypted blobs & image_url, set is_deleted
      const query = `
        UPDATE messages
        SET 
          iv = '\\x'::bytea,
          auth_tag = '\\x'::bytea,
          ciphertext = '\\x'::bytea,
          image_url = NULL,
          is_deleted = TRUE
        WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
        RETURNING *;
      `;
      const result = await client.query(query, [messageId, userId]);
      if (result.rowCount === 0)
        throw new Error("Message not found or unauthorized");
      const row = result.rows[0];

      const deletedMessage = new Message(
        row.id,
        row.sender_id,
        row.receiver_id,
        null, // no plaintext
        null, // no image URL
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

      // 2) Remove from Firebase entirely
      const convoId = makeConversationId(row.sender_id, row.receiver_id);
      await realtimeDb
        .ref(`conversations/${convoId}/messages/${row.id}`)
        .remove();

      return deletedMessage;
    } finally {
      client.release();
    }
  }

  static async getConversation(user1Id, user2Id) {
    console.log(
      `Fetching conversation between users ${user1Id} and ${user2Id}`);
    const client = await pool.connect();
    
    try {
      const messagesQuery = `
        SELECT 
          id, sender_id, receiver_id, iv, auth_tag, ciphertext, image_url, created_at, edited_at, is_deleted
        FROM messages
        WHERE 
          (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC;
      `;
      const messagesResult = await client.query(messagesQuery, [
        user1Id,
        user2Id,
      ]);
      console.log(
        `Fetched ${messagesResult.rowCount} messages between users ${user1Id} and ${user2Id}`
      );
      const messages = messagesResult.rows.map((row) => {
        let plaintext = null;
        if (!row.is_deleted) {
          plaintext = MessageService._decryptCipher(
            row.iv,
            row.auth_tag,
            row.ciphertext
          );
        }
        console.log(
          `Decrypted message ID ${row.id} for users ${user1Id} and ${user2Id}`
        );
        return new Message(
          row.id,
          row.sender_id,
          row.receiver_id,
          plaintext,
          row.image_url,
          row.created_at,
          row.edited_at,
          row.is_deleted
        );
      });

      return { messages };
    } finally {
      client.release();
    }
  }

  // ── Paginated fetch (newest first). Decrypt each text before returning.
  static async getMessagesBetweenUsersPaginated(
    userId1,
    userId2,
    limit = 10,
    offset = 0
  ) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id, sender_id, receiver_id, iv, auth_tag, ciphertext, image_url, created_at, edited_at, is_deleted
        FROM messages
        WHERE 
          (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4;
      `;
      const result = await client.query(query, [
        userId1,
        userId2,
        limit,
        offset,
      ]);

      return result.rows.map((row) => {
        let plaintext = null;
        if (!row.is_deleted) {
          plaintext = MessageService._decryptCipher(
            row.iv,
            row.auth_tag,
            row.ciphertext
          );
        }
        return new Message(
          row.id,
          row.sender_id,
          row.receiver_id,
          plaintext,
          row.image_url,
          row.created_at,
          row.edited_at,
          row.is_deleted
        );
      });
    } finally {
      client.release();
    }
  }

  // ── Fetch latest message per “conversation” for a given user
  //     Join with the other user's profile. Decrypt each text.
  static async getMessagesByUser(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT DISTINCT ON (
            LEAST(m.sender_id, m.receiver_id), 
            GREATEST(m.sender_id, m.receiver_id)
          )
          m.id,
          m.sender_id,
          m.receiver_id,
          m.iv,
          m.auth_tag,
          m.ciphertext,
          m.image_url,
          m.created_at,
          m.edited_at,
          m.is_deleted,
          u.id AS other_user_id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.profilepicture
        FROM messages m
        JOIN users u ON u.id = CASE 
            WHEN m.sender_id = $1 THEN m.receiver_id 
            ELSE m.sender_id 
        END
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY 
          LEAST(m.sender_id, m.receiver_id), 
          GREATEST(m.sender_id, m.receiver_id), 
          m.created_at DESC;
      `;
      const result = await client.query(query, [userId]);

      return result.rows.map((row) => {
        let plaintext = null;
        if (!row.is_deleted) {
          plaintext = MessageService._decryptCipher(
            row.iv,
            row.auth_tag,
            row.ciphertext
          );
        }
        return {
          id: row.id,
          senderId: row.sender_id,
          receiverId: row.receiver_id,
          text: plaintext,
          imageUrl: row.image_url,
          createdAt: row.created_at,
          editedAt: row.edited_at,
          isDeleted: row.is_deleted,
          otherUser: {
            id: row.other_user_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            role: row.role,
            profileImage: row.profilepicture,
          },
        };
      });
    } finally {
      client.release();
    }
  }
}

module.exports = MessageService;
