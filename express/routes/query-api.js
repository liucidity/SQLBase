const express = require("express");

module.exports = ({ queryTable }) => {
  const router = express.Router();
  router.get('/', (req, res) => {
    // console.log('query', req)
    let databaseName = req.query.databaseName;
    let queryString = req.query.queryString
    console.log(databaseName)
    queryTable(databaseName, queryString)
      .then(data => {
        console.log('returned Data', data)
        res.json(data);
      })
      .catch(err => {
        console.log('queryTable', err.message)
        res.status(500).json({ error: err.message });
      });
  })

  return router;
};
