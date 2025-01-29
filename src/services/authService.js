const pool = require("../config/db");
const { hashPassword } = require("../utils/hashUtils");

const registerUser = async (name, email, password) => {
    try {
        const hashedPassword = await hashPassword(password);
        const query = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3) RETURNING id, name, email;
        `;
        const values = [name, email, hashedPassword];
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        throw new Error(error.detail || "Signup failed");
    }
};

module.exports = { registerUser };
