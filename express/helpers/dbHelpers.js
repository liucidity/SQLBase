module.exports = db => {
  const queryDBParams = (queryString, paramsArray) => {
    const query = { text: queryString, values: paramsArray };
    return db.query(query).then(result => result.rows);
  };

  const queryDB = queryString => {
    return db.query({ text: queryString }).then(result => result.rows);
  };

  const createDB = async (dbName) => {
    // Check if the database already exists before attempting to create it
    const existing = await db.query(
      `SELECT 1 FROM pg_database WHERE datname = $1;`,
      [dbName]
    );
    if (existing.rows.length > 0) {
      throw new Error(`Database "${dbName}" already exists.`);
    }
    return db.query(`CREATE DATABASE "${dbName}";`).then(result => result);
  };

  const dropDB = (dbName) => {
    return db.query(`DROP DATABASE IF EXISTS "${dbName}";`).then(result => result);
  };

  return { queryDBParams, queryDB, createDB, dropDB };
};
