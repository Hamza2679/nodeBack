const pool = require("../config/db");

const createUserTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `;
    try {
        await pool.query(query);
        console.log("✅ Users table created (if not exists)");
    } catch (error) {
        console.error("❌ Error creating users table:", error.message);
    }
};

createUserTable(); // Run table creation when server starts

module.exports = pool;
