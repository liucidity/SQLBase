require("dotenv").config();
const { Pool } = require("pg");

// Resolve base connection config once at startup.
// In production (Railway/Render), DATABASE_URL is provided; individual
// env vars are used in local development.
let baseConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  baseConfig = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: parseInt(url.port, 10) || 5432,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  };
} else {
  baseConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
  };
}

// Keyed pool map: one small Pool per user database name.
// Avoids a new TCP connection on every request while bounding
// total connections (max: 3 per user DB).
const pools = {};

const getPool = (databaseName) => {
  if (!pools[databaseName]) {
    pools[databaseName] = new Pool({
      ...baseConfig,
      database: databaseName,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pools[databaseName].on("error", (err) => {
      console.error(`Pool error for database "${databaseName}":`, err.message);
    });
  }
  return pools[databaseName];
};

// Called when a user database is dropped so we don't hold stale pool connections.
const releasePool = async (databaseName) => {
  if (pools[databaseName]) {
    await pools[databaseName].end().catch(() => {});
    delete pools[databaseName];
  }
};

module.exports = { getPool, releasePool };
