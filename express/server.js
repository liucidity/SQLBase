const express = require("express");
const app = express();
const server = require("http").createServer(app);
const debug = require("debug")("express:server");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

/**
 * Database setup
 */
const db = require("./db");
const virtualDB = require("./helpers/clientHelpers");
const dbHelpers = require("./helpers/dbHelpers")(db);
const dbSeedQueryHelpers = require("./helpers/virtualDBHelpers")(virtualDB);

/**
 * Middleware
 */
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(logger("dev"));
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
const { authenticate } = require("./middleware/auth");

app.use("/api/auth", authApiRoutes(dbHelpers));
app.use("/api/databases", authenticate, userDatabaseApiRoutes(dbHelpers));
app.use("/api/virtualDatabases", authenticate, virtualDatabaseApiRoutes(dbSeedQueryHelpers));
app.use("/api/seed", authenticate, seedApiRoutes(dbSeedQueryHelpers));
app.use("/api/query", authenticate, queryApiRoutes(dbSeedQueryHelpers));
app.use("/api/tables", authenticate, tableApiRoutes(dbHelpers));

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
server.listen(port);

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
