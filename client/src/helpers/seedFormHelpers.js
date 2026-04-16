// ── Topological sort ──────────────────────────────────────────────────────────
// schemaState: [{ table, fields: [{ reference }] }]
// Returns table names sorted so parents always precede children.
export function topoSortTables(tableNames, schemaState) {
  const deps = {}; // tableName → Set of parent table names it depends on
  tableNames.forEach(name => { deps[name] = new Set(); });

  schemaState.forEach(t => {
    if (!tableNames.includes(t.table)) return;
    t.fields.forEach(f => {
      if (f.reference && tableNames.includes(f.reference)) {
        deps[t.table].add(f.reference);
      }
    });
  });

  const sorted = [];
  const visited = new Set();

  function visit(name, ancestors = new Set()) {
    if (visited.has(name)) return;
    if (ancestors.has(name)) return; // cycle guard
    ancestors = new Set(ancestors).add(name);
    deps[name].forEach(parent => visit(parent, ancestors));
    visited.add(name);
    sorted.push(name);
  }

  tableNames.forEach(n => visit(n));
  return sorted;
}

// ── SQL value formatter ───────────────────────────────────────────────────────
function fmtValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "boolean") return value;
  // Escape single quotes inside string values
  return "'" + String(value).replace(/'/g, "''") + "'";
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * @param {object} seedState  state.seedState  ([{ tableName: rows[] }])
 * @param {Array}  schemaState  state.schemaState (for FK ordering)
 */
export const generateSeedSQL = (seedState, schemaState = []) => {
  const seedMap = seedState[0] || {};
  const schemaTableNames = new Set(schemaState.map(s => s.table).filter(Boolean));
  // Only include tables that exist in the current schema; ignore stale seed data.
  // If no schema is defined yet, fall through with all keys so the preview isn't blank.
  const hasSchema = schemaTableNames.size > 0;
  const tableNames = Object.keys(seedMap).filter(
    t => t && (!hasSchema || schemaTableNames.has(t))
  );

  // Sort so parents are seeded before children
  const sortedNames = topoSortTables(tableNames, schemaState);

  const seedStrings = [];

  // Truncate in reverse order (children first) then restart sequences so
  // SERIAL IDs always start at 1 and FK references stay valid on re-seed.
  if (sortedNames.length > 0) {
    const truncateList = [...sortedNames].reverse().join(", ");
    seedStrings.push(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE;`);
  }

  sortedNames.forEach(table => {
    const seedData = seedMap[table];
    if (!seedData || seedData.length === 0) return;

    const firstRow = seedData[0];
    const fields = Object.keys(firstRow);
    if (fields.length === 0) return;

    const columnList = fields.map(f => `"${f}"`).join(", ");
    const valueRows = seedData.map(row =>
      "(" + fields.map(f => fmtValue(row[f])).join(", ") + ")"
    );

    // Show all rows (truncation is handled in the UI preview)
    seedStrings.push(
      `INSERT INTO ${table}(${columnList})\nVALUES\n    ${valueRows.join(",\n    ")};`
    );
  });

  return seedStrings.join("\n\n");
};
