require("dotenv").config({ path: "../.env" }); // Load .env from one level up
const { Pool } = require("pg");


const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
    ssl: { rejectUnauthorized: false },

});


module.exports = pool;
