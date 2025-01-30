const pool = require('../config/db');
const User = require('../models/User');

exports.createUser = async (firstName, lastName, email, password) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [firstName, lastName, email, password]
        );
        return new User(result.rows[0].id, firstName, lastName, email);
    } finally {
        client.release();
    }
};
