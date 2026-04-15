const express = require("express");

module.exports = ({ createTable, dropDB, seedTable, queryTable }) => {
  const router = express.Router();

  router.put("/", (req, res) => {
    const schemaString = req.body.schemaString;
    const globalStateString = req.body.globalStateString;
    const originalDBName = globalStateString.databaseName;
    createTable(originalDBName, req.user.id, schemaString)
      .then(data => {
        // console.log(data)
        res.json(data);
      })
      .catch(err => {
        console.log('vda', err.message)
        res.status(500).json({ error: err.message });
      });
  })


  router.post("/", (req, res) => {
    const globalStateString = req.body.globalStateString;
    const originalDBName = globalStateString.databaseName;

    dropDB(originalDBName)
      .then(data => {
        res.json(data);
      })
      .catch(err => {
        console.log('vda', err.message)
        res.status(500).json({ error: err.message });
      });
  })



  return router;
}