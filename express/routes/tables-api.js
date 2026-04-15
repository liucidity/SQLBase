const express = require("express");
const router = express.Router();

module.exports = ({ queryDBParams, queryDB }) => {
  // Insert new database record (legacy — upsert via POST is preferred)
  router.put("/", (req, res) => {
    const { databaseName, globalStateString } = req.body;
    const userId = req.user.id;
    if (!databaseName || !globalStateString) {
      return res.status(400).json({ error: "databaseName and globalStateString are required." });
    }
    queryDBParams(
      `INSERT INTO databases (user_id, name, global_state) VALUES ($1, $2, $3) RETURNING *;`,
      [userId, databaseName, globalStateString]
    )
      .then(data => res.status(201).json(data))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Upsert database record by UUID
  router.post("/", (req, res) => {
    const { databaseName, globalStateString, databaseUuid } = req.body;
    const userId = req.user.id;
    if (!databaseName || !globalStateString || !databaseUuid) {
      return res.status(400).json({ error: "databaseName, globalStateString, and databaseUuid are required." });
    }
    queryDBParams(
      `INSERT INTO databases (user_id, name, global_state, database_uuid) VALUES ($1, $2, $3, $4)
        ON CONFLICT (database_uuid)
        DO UPDATE SET global_state = $3, updated_at = CURRENT_TIMESTAMP
        RETURNING *;`,
      [userId, databaseName, globalStateString, databaseUuid]
    )
      .then(data => res.json(data))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Delete database record by UUID (scoped to authenticated user)
  router.delete("/", (req, res) => {
    const { databaseUuid } = req.query;
    const userId = req.user.id;
    if (!databaseUuid) {
      return res.status(400).json({ error: "databaseUuid query parameter is required." });
    }
    queryDBParams(
      `DELETE FROM databases WHERE database_uuid = $1 AND user_id = $2 RETURNING *;`,
      [databaseUuid, userId]
    )
      .then(data => {
        if (data.length === 0) return res.status(404).json({ error: "Database record not found." });
        res.json(data);
      })
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Get database state by UUID (scoped to authenticated user)
  router.get("/", (req, res) => {
    const { uuid } = req.query;
    const userId = req.user.id;
    if (!uuid) {
      queryDBParams(
        `SELECT global_state FROM databases WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1;`,
        [userId]
      )
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: err.message }));
    } else {
      queryDBParams(
        `SELECT global_state FROM databases WHERE database_uuid = $1 AND user_id = $2;`,
        [uuid, userId]
      )
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: err.message }));
    }
  });

  return router;
};
