const pool = require("../config/db");
const Message = require("../models/message");

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
            
            return new Message(
                row.id,
                row.sender_id,
                row.receiver_id,
                row.text,
                row.image_url,
                row.created_at,
                row.edited_at,
                row.is_deleted
            );
        } finally {
            client.release();
        }
    }

    static async getConversation(user1Id, user2Id, limit = 10, offset = 0) {
        const client = await pool.connect();
        try {
            const messagesQuery = `
                SELECT * FROM messages
                WHERE (sender_id = $1 AND receiver_id = $2)
                   OR (sender_id = $2 AND receiver_id = $1)
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
            `;
    
            const countQuery = `
                SELECT COUNT(*) FROM messages
                WHERE (sender_id = $1 AND receiver_id = $2)
                   OR (sender_id = $2 AND receiver_id = $1)
            `;
    
            const messagesResult = await client.query(messagesQuery, [user1Id, user2Id, limit, offset]);
            const countResult = await client.query(countQuery, [user1Id, user2Id]);
    
            const total = parseInt(countResult.rows[0].count, 10);
    
            // reverse the order to ASC (so frontend displays in correct order)
            const messages = messagesResult.rows
                .map(row => new Message(
                    row.id,
                    row.sender_id,
                    row.receiver_id,
                    row.text,
                    row.image_url,
                    row.created_at,
                    row.edited_at,
                    row.is_deleted
                ))
    
            return { messages, total };
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
            return new Message(
                result.rows[0].id,
                result.rows[0].sender_id,
                result.rows[0].receiver_id,
                result.rows[0].text,
                result.rows[0].image_url,
                result.rows[0].created_at,
                result.rows[0].edited_at,
                result.rows[0].is_deleted
            );
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
            return new Message(
                result.rows[0].id,
                result.rows[0].sender_id,
                result.rows[0].receiver_id,
                result.rows[0].text,
                result.rows[0].image_url,
                result.rows[0].created_at,
                result.rows[0].edited_at,
                result.rows[0].is_deleted
            );
        } finally {
            client.release();
        }
    }
}

module.exports = MessageService;