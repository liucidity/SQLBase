require("dotenv").config();

module.exports = ({ getPool, releasePool }) => {

  const createTable = async (databaseName, userID, schemaString) => {
    const pool = getPool(databaseName);
    const result = await pool.query(schemaString);
    return result;
  };

  const seedTable = async (databaseName, seedString) => {
    const pool = getPool(databaseName);
    const result = await pool.query(seedString);
    return result;
  };

  const queryTable = async (databaseName, queryString) => {
    const pool = getPool(databaseName);
    const result = await pool.query(queryString);
    return result;
  };

  return { createTable, seedTable, queryTable };
};
