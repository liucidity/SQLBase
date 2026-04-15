require("dotenv").config();

const fs = require("fs");
const chalk = require("chalk");
const { Client } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=disable`;

const client = new Client({ connectionString });

const runFiles = async (dir, label) => {
  console.log(chalk.cyan(`-> Loading ${label} ...`));
  const files = fs.readdirSync(dir).sort();
  for (const fn of files) {
    const sql = fs.readFileSync(`${dir}/${fn}`, "utf8");
    console.log(`\t-> Running ${chalk.green(fn)}`);
    await client.query(sql);
  }
};

(async () => {
  try {
    console.log(`-> Connecting to PG ...`);
    await client.connect();
    await runFiles("./db/schema", "Schema Files");
    await runFiles("./db/seeds", "Seeds");
    await runFiles("./db/functions", "Function Files");
    console.log(chalk.green("-> Done!"));
  } catch (err) {
    console.error(chalk.red(`Failed: ${err.message}`));
    process.exit(1);
  } finally {
    await client.end();
  }
})();
