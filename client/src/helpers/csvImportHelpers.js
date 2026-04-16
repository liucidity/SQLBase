import Papa from "papaparse";

// ── Type inference ────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;
const BOOL_VALUES = new Set(["true", "false", "yes", "no", "1", "0"]);

function inferTypeFromValues(values) {
  const nonEmpty = values.filter(v => v !== "" && v != null);
  if (nonEmpty.length === 0) return "TEXT";

  if (nonEmpty.every(v => BOOL_VALUES.has(String(v).toLowerCase()))) return "BOOLEAN";
  if (nonEmpty.every(v => DATE_RE.test(String(v).trim()))) return "DATE";
  if (nonEmpty.every(v => Number.isInteger(Number(v)) && !isNaN(Number(v)) && String(v).trim() !== "")) return "INT";
  if (nonEmpty.every(v => !isNaN(parseFloat(v)) && String(v).trim() !== "")) return "FLOAT";

  const maxLen = Math.max(...nonEmpty.map(v => String(v).length));
  if (maxLen <= 255) return "VARCHAR(255)";
  return "TEXT";
}

// ── CSV → schema table ────────────────────────────────────────────────────────

export function csvToSchemaTable(tableName, headers, rows) {
  const fields = headers.map(header => {
    const values = rows.map(r => r[header]);
    const rawType = inferTypeFromValues(values);
    const [dataType, varcharSize] = rawType.startsWith("VARCHAR")
      ? ["VARCHAR", "255"]
      : [rawType, ""];

    return {
      fieldName: header.trim().toLowerCase().replace(/\s+/g, "_"),
      dataType,
      varcharSize,
      mod1: "",
      mod2: "",
      default: "",
      reference: "",
      relationType: "one-to-many",
    };
  });

  return { table: tableName, fields };
}

// ── CSV → seed rows (array of plain objects) ──────────────────────────────────

export function csvToSeedRows(headers, rows) {
  return rows.map(row => {
    const obj = {};
    headers.forEach(h => {
      const key = h.trim().toLowerCase().replace(/\s+/g, "_");
      const val = row[h];
      const num = Number(val);
      obj[key] = val !== "" && !isNaN(num) ? num : val;
    });
    return obj;
  });
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Parse a CSV File object into { schemaTable, seedRows }.
 * Returns a Promise.
 */
export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta, errors }) => {
        if (errors.length > 0 && data.length === 0) {
          return reject(new Error(errors[0].message));
        }
        const headers = meta.fields || [];
        if (headers.length === 0) return reject(new Error("CSV has no columns."));

        // Derive table name from file name (strip extension, snake_case)
        const tableName = file.name
          .replace(/\.csv$/i, "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "");

        const schemaTable = csvToSchemaTable(tableName, headers, data);
        const seedRows = csvToSeedRows(headers, data);
        resolve({ schemaTable, seedRows, tableName });
      },
      error: err => reject(err),
    });
  });
}
