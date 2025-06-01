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
    const iv = crypto.randomBytes(12); // 12 bytes for AES-256-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return { iv, authTag, ciphertext };
  }

  static _decryptCipher(iv, authTag, ciphertext) {
    if (!iv || iv.length !== 12) {
      throw new Error(
        `Invalid IV length: expected 12 bytes, got ${iv ? iv.length : 0}`
      );
    }
    if (!authTag || authTag.length !== 16) {
      throw new Error(
        `Invalid AuthTag length: expected 16 bytes, got ${authTag ? authTag.length : 0}`
      );
    }
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }

  static async createMessage(senderId, receiverId, text, imageUrl) {
    console.log(
      `Creating message from ${senderId} to ${receiverId}: "${text}" with image URL: ${imageUrl}` );
    const client = await pool.connect();
    
    try {
      const { iv, authTag, ciphertext } = MessageService._encryptPlaintext(text);
      console.log(`🔐 Encrypted message with IV: ${iv.toString('hex')}, AuthTag: ${authTag.toString('hex')}`);

      const query = `
        INSERT INTO messages 
          (sender_id, receiver_id, iv, auth_tag, ciphertext, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [
        senderId,
        receiverId,
        iv,
        authTag,
        ciphertext,
        imageUrl || null,
      ];
      const result = await client.query(query, values);
      const row = result.rows[0];

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

      const convoId = makeConversationId(senderId, receiverId);
      console.log(`🔄 Updating Firebase Realtime Database for conversation ID: ${convoId}`);
      const firebaseData = {
        id: row.id.toString(),
        senderId: row.sender_id.toString(),
        receiverId: row.receiver_id.toString(),
        text: text,
        imageUrl: row.image_url || null,
        createdAt: row.created_at.toISOString(),
        editedAt: row.edited_at ? row.edited_at.toISOString() : null,
        isDeleted: row.is_deleted || false,
      };
      console.log(`📥 Sending message to Firebase:`, firebaseData);
      await realtimeDb
        .ref(`conversations/${convoId}/messages/${row.id}`)
        .set(firebaseData);

      return messageObj;
    } finally {
      client.release();
    }
  }

  static async editMessage(messageId, userId, newText) {
    const client = await pool.connect();
    try {
      const { iv, authTag, ciphertext } = MessageService._encryptPlaintext(
        newText
      );

      const query = `
        UPDATE messages
        SET 
          iv = $1,
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

  static async deleteMessage(messageId, userId) {
    const client = await pool.connect();
    try {
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
        null,
        null,
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

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
      const messages = messagesResult.rows.map((row) => {
        let plaintext = null;
        if (
          !row.is_deleted &&
          row.iv &&
          row.iv.length === 12 &&
          row.auth_tag &&
          row.auth_tag.length === 16
        ) {
          try {
            plaintext = MessageService._decryptCipher(
              row.iv,
              row.auth_tag,
              row.ciphertext
            );
          } catch (err) {
            console.error(`Decryption failed for message ID ${row.id}:`, err);
            plaintext = "[Unable to decrypt]";
          }
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

      return { messages };
    } finally {
      client.release();
    }
  }

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
        if (
          !row.is_deleted &&
          row.iv &&
          row.iv.length === 12 &&
          row.auth_tag &&
          row.auth_tag.length === 16
        ) {
          try {
            plaintext = MessageService._decryptCipher(
              row.iv,
              row.auth_tag,
              row.ciphertext
            );
          } catch (err) {
            console.error(`Decryption failed for message ID ${row.id}:`, err);
            plaintext = "[Unable to decrypt]";
          }
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
        if (
          !row.is_deleted &&
          row.iv &&
          row.iv.length === 12 &&
          row.auth_tag &&
          row.auth_tag.length === 16
        ) {
          try {
            plaintext = MessageService._decryptCipher(
              row.iv,
              row.auth_tag,
              row.ciphertext
            );
          } catch (err) {
            console.error(`Decryption failed for message ID ${row.id}:`, err);
            plaintext = "[Unable to decrypt]";
          }
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
