const express = require("express");

module.exports = ({ createDB, dropDB, queryDBParams, queryDB }) => {
  const router = express.Router();
  // Create a new PostgreSQL database
  router.put("/", (req, res) => {
    const globalStateString = req.body.globalStateString;
    if (!globalStateString || !globalStateString.databaseName) {
      return res.status(400).json({ error: "globalStateString.databaseName is required." });
    }
    const dbName = globalStateString.databaseName;
    createDB(dbName)
      .then(() => res.status(201).json({ message: `Database "${dbName}" created.` }))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Get all databases for the authenticated user
  // TODO (Phase B): replace with req.user.id once auth middleware is in place
  router.get("/", (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    queryDBParams(
      `SELECT global_state FROM databases WHERE user_id = $1 ORDER BY updated_at DESC;`,
      [userId]
    )
      .then(data => res.json(data))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Drop a PostgreSQL database
  router.post("/", (req, res) => {
    const { databaseName } = req.body;
    if (!databaseName) {
      return res.status(400).json({ error: "databaseName is required." });
    }
    dropDB(databaseName)
      .then(() => res.json({ message: `Database "${databaseName}" dropped.` }))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  return router;
};
