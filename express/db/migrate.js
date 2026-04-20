require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const client = new Client({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    await client.connect();
    const schemaDir = path.join(__dirname, "schema");
    const files = fs.readdirSync(schemaDir).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(schemaDir, file), "utf8");
      await client.query(sql);
      console.log(`  migrated: ${file}`);
    }
    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
