import { React, useState, useRef, useCallback, useEffect, useContext } from "react";
import { CopyBlock } from "react-code-blocks";
import Editor from "react-simple-code-editor";
import SchemaForm from "../forms/SchemaForm";
import useSchemaState from "../../state/hooks/useSchemaState";
import useDatabase from "../../state/hooks/useDatabase";
import Mermaid from "../modal/Mermaid";
import { generateSQL, generateReferenceObject } from "../../helpers/schemaFormHelpers";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import EditableField from "../fields/EditableField";
import { sqlTheme } from "../../helpers/sqlTheme";
import { highlightSQL } from "../../helpers/prismSql";
import { parseCSVFile } from "../../helpers/csvImportHelpers";
import { GlobalContext } from "../../state/GlobalStateProvider";
import { CSV_IMPORT_TABLE } from "../../state/reducers/globalReducer";
import { SCHEMA_TEMPLATES } from "../../helpers/schemaTemplates";
import { format as formatSQL } from "sql-formatter";
import "../forms/SchemaForm.scss";

// ── SQL → schema parser ────────────────────────────────────
function parseSQLToSchema(sql) {
  const tables = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const tableName = m[1];
    const body = m[2];
    // Merge continuation lines (REFERENCES, ON DELETE/UPDATE) onto their preceding line
    // so multi-line FK constraints become a single line before parsing
    const rawLines = body.split('\n').map(l => l.trim()).filter(Boolean);
    const mergedLines = [];
    for (const rawLine of rawLines) {
      const stripped = rawLine.replace(/,\s*$/, '').trim();
      if (
        /^REFERENCES\b/i.test(stripped) ||
        /^ON\s+(DELETE|UPDATE)\b/i.test(stripped)
      ) {
        if (mergedLines.length > 0) {
          mergedLines[mergedLines.length - 1] += ' ' + stripped;
        }
      } else {
        mergedLines.push(stripped);
      }
    }

    const fields = [];
    const pendingFKs = []; // { col, refTable } from table-level FOREIGN KEY constraints

    for (const line of mergedLines) {
      if (!line) continue;
      // Skip auto-generated id field
      if (/^id\s+SERIAL\s+PRIMARY\s+KEY/i.test(line)) continue;
      // Skip CONSTRAINT declarations
      if (/^CONSTRAINT\b/i.test(line)) continue;
      // Handle table-level FOREIGN KEY (col) REFERENCES table(col)
      const fkConstraint = line.match(/^FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)\s*\(/i);
      if (fkConstraint) {
        pendingFKs.push({ col: fkConstraint[1], refTable: fkConstraint[2] });
        continue;
      }
      // Skip other table-level constraints that start with SQL keywords
      if (/^(PRIMARY|UNIQUE|CHECK|INDEX|KEY)\b/i.test(line)) continue;

      const nameMatch = line.match(/^(\w+)\s+(.*)/);
      if (!nameMatch) continue;
      const fieldName = nameMatch[1];
      let rest = nameMatch[2].trim();
      let dataType = '', varcharSize = '', reference = '';

      // Inline FK: col INTEGER REFERENCES table(id)  OR  col INT REFERENCES table(id)
      const fkMatch = rest.match(/^(?:INTEGER|INT)\s+REFERENCES\s+(\w+)\s*\([^)]*\)/i);
      if (fkMatch) {
        dataType = 'INT';
        reference = fkMatch[1];
        rest = rest.slice(fkMatch[0].length).trim();
      } else {
        const typeMatch = rest.match(/^(\w+)(?:\((\d+)\))?(.*)/i);
        if (!typeMatch) continue;
        dataType = typeMatch[1].toUpperCase();
        varcharSize = typeMatch[2] || '';
        rest = typeMatch[3] ? typeMatch[3].trim() : '';
      }

      const constraints = [];
      if (/PRIMARY\s+KEY/i.test(rest)) constraints.push('PRIMARY KEY');
      if (/NOT\s+NULL/i.test(rest)) constraints.push('NOT NULL');
      if (/\bUNIQUE\b/i.test(rest)) constraints.push('UNIQUE');
      const defaultMatch = rest.match(/DEFAULT\s+'?([^'\s,]+)'?/i);
      fields.push({
        fieldName, dataType, varcharSize,
        mod1: constraints[0] || '', mod2: constraints[1] || '',
        default: defaultMatch ? defaultMatch[1] : '',
        reference,
        relationType: 'one-to-many',
      });
    }

    // Apply table-level FK constraints: find the column and set its reference
    pendingFKs.forEach(({ col, refTable }) => {
      const field = fields.find(f => f.fieldName === col);
      if (field) {
        field.reference = refTable;
        if (!field.dataType) field.dataType = 'INT';
      }
    });

    tables.push({ table: tableName, fields });
  }
  return tables;
}

const REL_NOTATION = {
  'one-to-one':  '||--||',
  'one-to-many': '||--o{',
  'many-to-many': '}o--o{',
};

// ── Mermaid diagram generator ──────────────────────────────
function generateMermaid(schemaState) {
  if (!schemaState || schemaState.length === 0) return '';
  const validTables = schemaState.filter(t => t.table && /^[A-Za-z_]\w*$/.test(t.table));
  if (validTables.length === 0) return '';
  let out = 'erDiagram\n';
  const relations = [];
  validTables.forEach(tbl => {
    out += `  ${tbl.table} {\n`;
    tbl.fields.forEach(f => {
      const dtype = (f.dataType || 'TEXT').replace(/[^A-Za-z0-9_]/g, '');
      const fname = (f.fieldName || '').replace(/[^a-zA-Z0-9_]/g, '_');
      if (!dtype || !fname) return;
      if (f.reference && /^[A-Za-z_]\w*$/.test(f.reference)) {
        const notation = REL_NOTATION[f.relationType] || REL_NOTATION['one-to-many'];
        relations.push(`  ${f.reference} ${notation} ${tbl.table} : " "`);
      }
      out += `    ${dtype} ${fname}\n`;
    });
    out += `  }\n`;
  });
  if (relations.length) out += relations.join('\n') + '\n';
  return out;
}

// ── Component ──────────────────────────────────────────────
const CreateSchemaPage = () => {
  const {
    state,
    addSchemaTable,
    removeSchemaTable,
    addSchemaField,
    removeSchemaField,
    handleSchemaChange,
    setAllSchemaTables,
    duplicateSchemaTable,
  } = useSchemaState();

  const [, dispatch] = useContext(GlobalContext);
  const csvInputRef = useRef(null);

  const { saveProgress, saveProgressWithState, createDatabase, getDatabases } = useDatabase();

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [existingDbNames, setExistingDbNames] = useState([]);
  const [sqlText, setSqlText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', isError: false });
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef(null);
  const [sqlFormatted, setSqlFormatted] = useState(false);
  const [erdVisible, setErdVisible] = useState(true);
  const [erdHeight, setErdHeight] = useState(240);
  const debounceRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  // Load existing database names for duplicate detection
  useEffect(() => {
    getDatabases()
      .then(data => {
        const names = data
          .map(item => { try { return JSON.parse(item.global_state); } catch { return null; } })
          .filter(db => db && db.databaseName)
          .map(db => db.databaseName);
        setExistingDbNames(names);
      })
      .catch(() => {});
  }, []);

  // Close template picker on outside click
  useEffect(() => {
    const handler = e => {
      if (templateRef.current && !templateRef.current.contains(e.target))
        setTemplateOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = erdHeight;
  }, [erdHeight]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const delta = dragStartY.current - e.clientY;
      setErdHeight(h => Math.max(80, Math.min(560, dragStartH.current + delta)));
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const showSnackbar = (msg, isError = false) =>
    setSnackbar({ open: true, message: msg, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const allSQL = generateSQL(state.schemaState).join('\n\n');
  const displaySQL = sqlFormatted
    ? (() => { try { return formatSQL(allSQL, { language: 'postgresql' }); } catch { return allSQL; } })()
    : allSQL;

  // Live-update left panel while typing in expert mode
  const handleSqlChange = useCallback((code) => {
    setSqlText(code);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseSQLToSchema(code);
      if (parsed.length > 0) setAllSchemaTables(parsed);
    }, 500);
  }, [setAllSchemaTables]);

  const handleExpertToggle = () => {
    if (!expertMode) {
      setSqlText(allSQL);
    } else {
      const parsed = parseSQLToSchema(sqlText);
      if (parsed.length > 0) setAllSchemaTables(parsed);
    }
    setExpertMode(e => !e);
  };

  const handleCopy = () => {
    const text = expertMode ? sqlText : displaySQL;
    navigator.clipboard.writeText(text).then(() => showSnackbar('Copied to clipboard!'));
  };

  const handleLoadTemplate = (tmpl) => {
    setAllSchemaTables(tmpl.tables);
    setTemplateOpen(false);
    setSqlFormatted(false);
    showSnackbar(`Loaded "${tmpl.label}" template.`);
  };

  const handleSave = async () => {
    if (state.databaseName === 'database_name') {
      showSnackbar('Rename the database before saving — "database_name" is the default placeholder.', true);
      return;
    }
    try {
      if (expertMode) {
        const parsed = parseSQLToSchema(sqlText);
        const overrideState = {
          ...state,
          schemaState: parsed.length > 0 ? parsed : state.schemaState,
        };
        await saveProgressWithState(overrideState);
      } else {
        await saveProgress();
      }
      showSnackbar('Progress saved.');
    } catch {
      showSnackbar('Failed to save.', true);
    }
  };

  const handleCSVImport = async e => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-imported
    try {
      const { schemaTable, seedRows } = await parseCSVFile(file);
      dispatch({ type: CSV_IMPORT_TABLE, schemaTable, seedRows });
      showSnackbar(`Imported "${schemaTable.table}" — ${seedRows.length} rows ready to seed.`);
    } catch (err) {
      showSnackbar(err.message || "Failed to import CSV.", true);
    }
  };

  const handleCreate = async () => {
    if (state.databaseName === 'database_name') {
      showSnackbar('Rename the database before creating — "database_name" is the default placeholder.', true);
      return;
    }
    const isDuplicate = existingDbNames.some(
      n => n === state.databaseName && !state.dbCreated
    );
    if (isDuplicate) {
      showSnackbar(`A database named "${state.databaseName}" already exists. Choose a different name.`, true);
      return;
    }
    try {
      const sql = expertMode ? sqlText : allSQL;
      if (expertMode) {
        const parsed = parseSQLToSchema(sqlText);
        if (parsed.length > 0) setAllSchemaTables(parsed);
      }
      await createDatabase(sql);
      showSnackbar('Database created!');
      // Refresh name list so future creates detect this name as taken
      setExistingDbNames(prev => [...prev, state.databaseName]);
    } catch (err) {
      showSnackbar(err?.response?.data?.error || 'Failed to create database.', true);
    }
  };

  const erdChart = generateMermaid(state.schemaState);

  return (
    <main className="split-canvas">
      {/* ── Left Panel ─────────────────────────────── */}
      <div className="split-left">
        <div className="split-left-header">
          <EditableField
            focused={isNameFocused}
            handleChange={handleSchemaChange}
            focus={setIsNameFocused}
            state={state}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleCSVImport}
          />
          <button
            className="action-btn csv-import-btn"
            onClick={() => csvInputRef.current?.click()}
            title="Import a CSV file to generate a table schema and seed data"
          >
            ↑ Import CSV
          </button>
          <div className="template-picker-wrap" ref={templateRef}>
            <button
              className="action-btn template-picker-btn"
              onClick={() => setTemplateOpen(o => !o)}
              title="Load a schema template"
            >
              ⬡ Templates
            </button>
            {templateOpen && (
              <div className="template-dropdown">
                {SCHEMA_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    className="template-option"
                    onClick={() => handleLoadTemplate(tmpl)}
                  >
                    <span className="template-icon">{tmpl.icon}</span>
                    <div className="template-text">
                      <span className="template-label">{tmpl.label}</span>
                      <span className="template-desc">{tmpl.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tables-list">
          {state.schemaState.map((table, tableIndex) => (
            <SchemaForm
              key={`table-${tableIndex}`}
              table={table}
              tableIndex={tableIndex}
              handleChange={handleSchemaChange}
              removeField={removeSchemaField}
              addField={addSchemaField}
              references={generateReferenceObject(state.schemaState, table)}
              removeTable={removeSchemaTable}
              duplicateTable={duplicateSchemaTable}
            />
          ))}

          <button className="add-table-card" onClick={addSchemaTable}>
            <span className="add-table-plus">+</span>
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="split-right">
        <div className="split-right-header">
          <button className="expert-toggle-btn" onClick={handleExpertToggle}>
            {expertMode ? '← Form' : '✎ Expert'}
          </button>
        </div>

        <div className="sql-pane">
          {expertMode ? (
            <Editor
              value={sqlText}
              onValueChange={handleSqlChange}
              highlight={highlightSQL}
              padding={0}
              className="prism-sql-editor"
              textareaClassName="prism-sql-textarea"
              preClassName="prism-sql-pre"
              style={{
                fontFamily: "'Courier New', Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.6,
                background: 'transparent',
                color: '#cdd6f4',
                minHeight: '100%',
                width: '100%',
              }}
            />
          ) : (
            <CopyBlock
              language="sql"
              text={displaySQL || '-- Add a table to see SQL'}
              theme={sqlTheme}
              wrapLines={true}
              codeBlock
            />
          )}
        </div>

        <div
          className="erd-resize-handle"
          onMouseDown={onResizeMouseDown}
          style={{
            opacity: erdVisible ? 1 : 0,
            pointerEvents: erdVisible ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />
        <div
          className="erd-pane"
          style={{
            height: erdVisible ? erdHeight : 0,
            opacity: erdVisible ? 1 : 0,
            overflow: 'hidden',
            transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
          }}
        >
          <div style={{ height: erdHeight, position: 'relative' }}>
            <Mermaid chart={erdChart} />
          </div>
        </div>

        <div className="right-panel-actions">
          <button className="action-btn" onClick={handleCopy}>⎘ Copy Schema</button>
          {!expertMode && (
            <button
              className={`action-btn${sqlFormatted ? ' active' : ''}`}
              onClick={() => setSqlFormatted(v => !v)}
              title="Toggle SQL formatting"
            >
              ⌥ Format SQL
            </button>
          )}
          <button className="action-btn" onClick={handleSave}>↑ Save</button>
          <button
            className={`action-btn erd-toggle-btn${erdVisible ? ' active' : ''}`}
            onClick={() => setErdVisible(v => !v)}
          >
            {erdVisible ? '⊟ Hide ERD' : '⊞ Show ERD'}
          </button>
          <button
            className="action-btn primary"
            onClick={handleCreate}
            disabled={
              !/^[a-z0-9_]{1,63}$/.test(state.databaseName) ||
              state.databaseName === 'database_name'
            }
            title={
              state.databaseName === 'database_name'
                ? 'Rename the database before creating'
                : !/^[a-z0-9_]{1,63}$/.test(state.databaseName)
                  ? 'Fix the database name before creating'
                  : undefined
            }
          >
            Create Database
          </button>
        </div>
      </div>

      <SuccessSnackbar
        open={snackbar.open}
        message={snackbar.message}
        isError={snackbar.isError}
        handleClose={closeSnackbar}
      />
    </main>
  );
};

export default CreateSchemaPage;
