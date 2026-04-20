require("dotenv").config();
const { Pool } = require("pg");

let config;
if (process.env.DATABASE_URL) {
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  };
} else {
  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
  };
}

const masterPool = new Pool({ ...config, max: 10, idleTimeoutMillis: 30000 });

masterPool.on("error", (err) => {
  console.error("Master pool error:", err.message);
});

// Returns a pool-like object scoped to a schema.
// Each call checks out a client, sets search_path, runs the query,
// then resets search_path before returning the client to the pool.
const getPool = (schemaName) => ({
  query: async (sql, params) => {
    const client = await masterPool.connect();
    try {
      await client.query(`SET search_path = "${schemaName}", public`);
      const result = params ? await client.query(sql, params) : await client.query(sql);
      return result;
    } finally {
      await client.query(`SET search_path = public`);
      client.release();
    }
  },
});

// No-op: no per-schema pools to tear down.
const releasePool = async (_schemaName) => {};

module.exports = { getPool, releasePool };
