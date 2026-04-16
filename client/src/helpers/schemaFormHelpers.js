const deepCopy = dataStructure => JSON.parse(JSON.stringify(dataStructure));

const generateSQL = tables => {
  let result = [];
  tables.forEach(table => {
    const lines = [
      `CREATE TABLE IF NOT EXISTS ${table.table} (`,
      `    id SERIAL PRIMARY KEY NOT NULL`,
    ];
    table.fields.forEach(field => {
      if (!field.fieldName) return;
      const parts = [field.fieldName];
      if (field.reference) {
        parts.push(`INTEGER REFERENCES ${field.reference}(id) ON DELETE CASCADE`);
      } else {
        const type = `${field.dataType || ''}${field.varcharSize ? '(' + field.varcharSize + ')' : ''}`;
        if (type) parts.push(type);
      }
      if (field.mod1) parts.push(field.mod1);
      if (field.mod2) parts.push(field.mod2);
      if (field.default) parts.push(`DEFAULT '${field.default}'`);
      lines.push(`    ${parts.join(' ')}`);
    });
    result.push(lines[0] + '\n' + lines.slice(1).join(',\n') + '\n);\n');
  });
  return result;
};

const generateReferenceObject = (tables, i) => {
  let output = [];
  tables.map(table => {
    if (i !== table) {
      let obj = { label: table.table, value: table.table };
      output.push(obj);
    }
  });
  output.push({ label: "None", value: "" })
  return output;
};

export { deepCopy, generateSQL, generateReferenceObject };
