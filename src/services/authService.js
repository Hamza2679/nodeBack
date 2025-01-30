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


exports.loginUser = async (email, password) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            throw new InvalidCredentialsError('Invalid email or password');
        }

        const user = result.rows[0];

        // Compare passwords directly (NOT SECURE if passwords are stored in plain text)
        if (password !== user.password) {
            throw new InvalidCredentialsError('Invalid email or password');
        }


        return { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email };
    } catch (error) {
        throw new Error(error.message);
    }
};
