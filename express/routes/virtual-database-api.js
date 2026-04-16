const express = require("express");

module.exports = ({ createTable, dropDB, seedTable, queryTable, releasePool }) => {
  const router = express.Router();

  router.put("/", (req, res) => {
    const schemaString = req.body.schemaString;
    const globalStateString = req.body.globalStateString;
    const originalDBName = globalStateString.databaseName;
    createTable(originalDBName, req.user.id, schemaString)
      .then(data => {
        res.json(data);
      })
      .catch(err => {
        console.log('vda', err.message);
        res.status(500).json({ error: err.message });
      });
  });

  router.post("/", async (req, res) => {
    const globalStateString = req.body.globalStateString;
    const originalDBName = globalStateString.databaseName;
    try {
      // Release pool before dropping so no stale connections remain
      if (releasePool) await releasePool(originalDBName);
      const data = await dropDB(originalDBName);
      res.json(data);
    } catch (err) {
      console.log('vda', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
