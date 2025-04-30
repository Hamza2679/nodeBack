// services/UserService.js
const pool = require("../config/db");

class UserService {
  static async updateRole(userId, newRole) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE users SET role = $1 WHERE id = $2 
         RETURNING id, first_name, last_name, email, role`,
        [newRole, userId]
      );
      if (result.rows.length === 0) throw new Error("User not found");
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

module.exports = UserService;