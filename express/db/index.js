const pg = require("pg");
require("dotenv").config();

let config;
if (process.env.DATABASE_URL) {
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  };
} else {
  config = {
    connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  };
}

const pool = new pg.Pool({
  ...config,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Master DB pool error:", err.message);
});

// Verify connectivity at startup
pool.query("SELECT 1").then(() => {
  const db = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).pathname.slice(1)
    : process.env.DB_NAME;
  console.log(`Connected to ${db}`);
}).catch(err => {
  console.error("Master DB connection failed:", err.message);
  process.exit(1);
});

module.exports = pool;
