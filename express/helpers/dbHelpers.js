const sanitizeSchemaName = (name) => {
  if (typeof name !== "string" || !/^[a-z0-9_]{1,63}$/.test(name)) {
    throw new Error("Invalid schema name: must be 1–63 lowercase alphanumeric/underscore characters");
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

  const createDB = async (schemaName) => {
    const safe = sanitizeSchemaName(schemaName);
    await db.query(`CREATE SCHEMA IF NOT EXISTS "${safe}";`);
  };

  const dropDB = async (schemaName) => {
    const safe = sanitizeSchemaName(schemaName);
    await db.query(`DROP SCHEMA IF EXISTS "${safe}" CASCADE;`);
  };

  return { queryDBParams, queryDB, createDB, dropDB };
};
