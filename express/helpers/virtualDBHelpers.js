require("dotenv").config();

module.exports = ({ createClientFromState }) => {

  const createTable = async (databaseName, userID, schemaString) => {
    const newClient = createClientFromState(databaseName);
    try {
      await newClient.connect();
      const result = await newClient.query(schemaString);
      return result;
    } finally {
      await newClient.end().catch(() => {});
    }
  };

  const seedTable = async (databaseName, seedString) => {
    const newClient = createClientFromState(databaseName);
    try {
      await newClient.connect();
      const result = await newClient.query(seedString);
      return result;
    } finally {
      await newClient.end().catch(() => {});
    }
  };

  const queryTable = async (databaseName, queryString) => {
    const newClient = createClientFromState(databaseName);
    try {
      await newClient.connect();
      const result = await newClient.query(queryString);
      return result;
    } finally {
      await newClient.end().catch(() => {});
    }
  };

  return { createTable, seedTable, queryTable };
};
