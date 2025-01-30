require("dotenv").config({ path: "../.env" }); // Load .env from one level up
const { Pool } = require("pg");

console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT || 5432,
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false, 
});


module.exports = pool;
