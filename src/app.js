const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

const pool = new Pool({
    user: PGUSER,
    host: PGHOST,
    database: PGDATABASE,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
        require: true,
    },
});

app.get('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM event');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.json({ error: `Error: ${err.message}` });
    } finally {
        client.release();
    }
});

app.listen(5000, () => console.log('Server is running on port 5000'));
