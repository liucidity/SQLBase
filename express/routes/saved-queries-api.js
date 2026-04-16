const express = require("express");

module.exports = ({ queryDBParams }) => {
  const router = express.Router();

  // List saved queries for a database
  router.get("/", (req, res) => {
    const { databaseUuid } = req.query;
    const userId = req.user.id;
    if (!databaseUuid) {
      return res.status(400).json({ error: "databaseUuid is required." });
    }
    queryDBParams(
      `SELECT id, name, query_state, created_at
       FROM saved_queries
       WHERE user_id = $1 AND database_uuid = $2
       ORDER BY created_at DESC;`,
      [userId, databaseUuid]
    )
      .then(data => res.json(data))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Save a new named query
  router.post("/", (req, res) => {
    const { databaseUuid, name, queryState } = req.body;
    const userId = req.user.id;
    if (!databaseUuid || !name || !queryState) {
      return res.status(400).json({ error: "databaseUuid, name, and queryState are required." });
    }
    queryDBParams(
      `INSERT INTO saved_queries (user_id, database_uuid, name, query_state)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, query_state, created_at;`,
      [userId, databaseUuid, name.trim(), queryState]
    )
      .then(data => res.status(201).json(data[0]))
      .catch(err => res.status(500).json({ error: err.message }));
  });

  // Delete a saved query
  router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    queryDBParams(
      `DELETE FROM saved_queries WHERE id = $1 AND user_id = $2 RETURNING id;`,
      [id, userId]
    )
      .then(data => {
        if (data.length === 0) return res.status(404).json({ error: "Query not found." });
        res.json({ deleted: true });
      })
      .catch(err => res.status(500).json({ error: err.message }));
  });

  return router;
};
