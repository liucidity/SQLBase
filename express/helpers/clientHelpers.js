require("dotenv").config();
const { Pool } = require("pg");

// Keyed pool map: one small Pool per user database name.
// Avoids a new TCP connection on every request while bounding
// total connections (max: 3 per user DB).
const pools = {};

const getPool = (databaseName) => {
  if (!pools[databaseName]) {
    pools[databaseName] = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
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
