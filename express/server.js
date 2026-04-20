const express = require("express");
const app = express();
const server = require("http").createServer(app);
const debug = require("debug")("express:server");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

/**
 * Database setup
 */
const db = require("./db");
const virtualDB = require("./helpers/clientHelpers");
const dbHelpers = require("./helpers/dbHelpers")(db);
const dbSeedQueryHelpers = require("./helpers/virtualDBHelpers")(virtualDB);

/**
 * Trust proxy — required for express-rate-limit when behind a reverse proxy (Fly, nginx, etc.)
 */
app.set("trust proxy", 1);

/**
 * Security middleware
 */
app.use(helmet({
  // Allow inline scripts/styles that the React build may use
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));

/**
 * Rate limiting
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/**
 * General middleware
 */
if (process.env.NODE_ENV === "production") {
  const logsDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  const accessLog = fs.createWriteStream(path.join(logsDir, "access.log"), { flags: "a" });
  app.use(logger("combined", { stream: accessLog }));
} else {
  app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

/**
 * Routes
 */
const tableApiRoutes = require("./routes/tables-api");
const seedApiRoutes = require("./routes/seed-api");
const queryApiRoutes = require("./routes/query-api");
const userDatabaseApiRoutes = require("./routes/user-database-api");
const virtualDatabaseApiRoutes = require("./routes/virtual-database-api");
const authApiRoutes = require("./routes/auth-api");
const savedQueriesApiRoutes = require("./routes/saved-queries-api");
const { authenticate } = require("./middleware/auth");

// Health check — includes live DB ping so load balancers get a 503 on DB outage
app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", db: "ok", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

app.use("/api/auth", authLimiter, authApiRoutes({ ...dbHelpers, ...dbSeedQueryHelpers }));
app.use("/api/databases", apiLimiter, authenticate, userDatabaseApiRoutes(dbHelpers));
app.use("/api/virtualDatabases", apiLimiter, authenticate, virtualDatabaseApiRoutes({ ...dbSeedQueryHelpers, ...dbHelpers, ...virtualDB }));
app.use("/api/seed", apiLimiter, authenticate, seedApiRoutes(dbSeedQueryHelpers));
app.use("/api/query", apiLimiter, authenticate, queryApiRoutes(dbSeedQueryHelpers));
app.use("/api/tables", apiLimiter, authenticate, tableApiRoutes(dbHelpers));
app.use("/api/savedQueries", apiLimiter, authenticate, savedQueriesApiRoutes(dbHelpers));

/**
 * Serve React build in production
 */
if (process.env.NODE_ENV === "production") {
  const clientBuild = path.join(__dirname, "../client/build");
  app.use(express.static(clientBuild));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

/**
 * Port setup
 */
const normalizePort = val => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const port = normalizePort(process.env.PORT || "3001");
app.set("port", port);

// Start listening immediately so Fly's health check passes.
// Migrations run in the background after startup — they are idempotent
// (IF NOT EXISTS) so a failure just logs without crashing the server.
server.listen(port);

(async () => {
  try {
    const schemaDir = path.join(__dirname, "db/schema");
    const files = fs.readdirSync(schemaDir).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(schemaDir, file), "utf8");
      await db.query(sql);
      console.log(`  migrated: ${file}`);
    }
    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration failed (non-fatal):", err.message);
  }
})();

server.on("error", error => {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
  console.log(`Server listening on port ${port}!`);
});
