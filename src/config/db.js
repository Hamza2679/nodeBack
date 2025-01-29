const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: { require: true },
});

module.exports = pool;
