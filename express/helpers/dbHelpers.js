const sanitizeDbName = (name) => {
  if (typeof name !== "string" || !/^[a-z0-9_]{1,63}$/.test(name)) {
    throw new Error("Invalid database name: must be 1–63 lowercase alphanumeric/underscore characters");
  }
  return name;
};

module.exports = db => {
  const queryDBParams = (queryString, paramsArray) => {
    const query = { text: queryString, values: paramsArray };
    return db.query(query).then(result => result.rows);
  };

  const queryDB = queryString => {
    return db.query({ text: queryString }).then(result => result.rows);
  };

  const createDB = async (dbName) => {
    const safe = sanitizeDbName(dbName);
    const existing = await db.query(
      `SELECT 1 FROM pg_database WHERE datname = $1;`,
      [safe]
    );
    if (existing.rows.length > 0) {
      return; // DB already exists, skip creation and let the caller continue to table creation
    }
    return db.query(`CREATE DATABASE "${safe}";`).then(result => result);
  };

  const dropDB = (dbName) => {
    const safe = sanitizeDbName(dbName);
    return db.query(`DROP DATABASE IF EXISTS "${safe}";`).then(result => result);
  };

  return { queryDBParams, queryDB, createDB, dropDB };
};
