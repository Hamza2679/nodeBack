// services/messageService.js
const pool = require("../config/db");
const Message = require("../models/message");
const { realtimeDb } = require("./firebaseService");
const { makeConversationId } = require("../utils/conversationIdUtil");

class MessageService {
  static async createMessage(senderId, receiverId, text, imageUrl) {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO messages (sender_id, receiver_id, text, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
      const values = [senderId, receiverId, text, imageUrl || null];

      const result = await client.query(query, values);
      const row = result.rows[0];

      const messageObj = new Message(
        row.id,
        row.sender_id,
        row.receiver_id,
        row.text,
        row.image_url,
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

const convoId = makeConversationId(senderId, receiverId);
const firebaseData = {
  id: row.id.toString(), 
  senderId: row.sender_id.toString(),
  receiverId: row.receiver_id.toString(),
  text: row.text || null, 
  imageUrl: row.image_url || null,
  createdAt: row.created_at.toISOString(),
  editedAt: row.edited_at ? row.edited_at.toISOString() : null,
  isDeleted: row.is_deleted || false
};
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
      const query = `
        UPDATE messages
        SET text = $1, edited_at = NOW()
        WHERE id = $2 AND sender_id = $3
        RETURNING *`;
      const result = await client.query(query, [newText, messageId, userId]);
      if (result.rowCount === 0) throw new Error("Message not found or unauthorized");
      const row = result.rows[0];

      const updatedMessage = new Message(
        row.id,
        row.sender_id,
        row.receiver_id,
        row.text,
        row.image_url,
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

      // Sync edit in Firebase
      const convoId = makeConversationId(row.sender_id, row.receiver_id);
      await realtimeDb
        .ref(`conversations/${convoId}/messages/${row.id}`)
        .update({
          text: row.text,
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
          text = NULL,
          image_url = NULL,
          is_deleted = TRUE
        WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
        RETURNING *`;
      const result = await client.query(query, [messageId, userId]);
      if (result.rowCount === 0) throw new Error("Message not found or unauthorized");
      const row = result.rows[0];

      const deletedMessage = new Message(
        row.id,
        row.sender_id,
        row.receiver_id,
        row.text,
        row.image_url,
        row.created_at,
        row.edited_at,
        row.is_deleted
      );

      // Remove or flag in Firebase
      const convoId = makeConversationId(row.sender_id, row.receiver_id);
      await realtimeDb
        .ref(`conversations/${convoId}/messages/${row.id}`)
        .remove();
      // ↓ OR if you want to keep a record that "this was deleted":
      // await realtimeDb.ref(`conversations/${convoId}/messages/${row.id}`)
      //   .update({ isDeleted: true, text: null, imageUrl: null });

      return deletedMessage;
    } finally {
      client.release();
    }
  }

   static async getConversation(user1Id, user2Id) {
    const client = await pool.connect();
    try {
        const messagesQuery = `
            SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2)
               OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC
        `;

        const messagesResult = await client.query(messagesQuery, [user1Id, user2Id]);

        const messages = messagesResult.rows.map(row => new Message(
            row.id,
            row.sender_id,
            row.receiver_id,
            row.text,
            row.image_url,
            row.created_at,
            row.edited_at,
            row.is_deleted
        ));

        return { messages };
    } finally {
        client.release();
    }
}

    
    static async getMessagesBetweenUsersPaginated(userId1, userId2, limit = 10, offset = 0) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT *
                FROM messages
                WHERE (sender_id = $1 AND receiver_id = $2)
                   OR (sender_id = $2 AND receiver_id = $1)
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4;
            `;
            const result = await client.query(query, [userId1, userId2, limit, offset]);
    
            return result.rows.map(row => new Message(
                row.id,
                row.sender_id,
                row.receiver_id,
                row.text,
                row.image_url,
                row.created_at,
                row.edited_at,
                row.is_deleted
            ));
        } finally {
            client.release();
        }
    }
    
      static async searchUsers(searchTerm, limit = 10, offset = 0) {
    const client = await pool.connect();
    try {
      const likePattern = `%${searchTerm}%`;
      const query = `
        SELECT
          id,
          first_name,
          last_name,
          email,
          profilepicture
        FROM users
        WHERE
          first_name ILIKE $1
          OR last_name  ILIKE $1
          OR email      ILIKE $1
        ORDER BY first_name ASC, last_name ASC
        LIMIT $2
        OFFSET $3
      `;
      const values = [likePattern, limit, offset];
      const result = await client.query(query, values);

      return result.rows.map(row => ({
        id:            row.id,
        firstName:     row.first_name,
        lastName:      row.last_name,
        email:         row.email,
        profileImage:  row.profilepicture
      }));
    } finally {
      client.release();
    }
  }


    static async getMessagesByUser(userId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT DISTINCT ON (LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id))
                    m.id,
                    m.sender_id,
                    m.receiver_id,
                    m.text,
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
                    m.created_at DESC
            `;
    
            const result = await client.query(query, [userId]);
    
            return result.rows.map(row => ({
                id: row.id,
                senderId: row.sender_id,
                receiverId: row.receiver_id,
                text: row.text,
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
                    profileImage: row.profilepicture
                }
            }));
        } finally {
            client.release();
        }
    }
}

module.exports = MessageService;
