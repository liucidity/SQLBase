import { React, useState, useRef, useCallback, useEffect } from "react";
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
import "../forms/SchemaForm.scss";

// ── SQL → schema parser ────────────────────────────────────
function parseSQLToSchema(sql) {
  const tables = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const tableName = m[1];
    const body = m[2];
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    const fields = [];
    for (const rawLine of lines) {
      const line = rawLine.replace(/,\s*$/, '').trim();
      if (!line) continue;
      if (/^id\s+SERIAL\s+PRIMARY\s+KEY/i.test(line)) continue;
      if (/^CONSTRAINT\b/i.test(line)) continue;
      const nameMatch = line.match(/^(\w+)\s+(.*)/);
      if (!nameMatch) continue;
      const fieldName = nameMatch[1];
      let rest = nameMatch[2].trim();
      let dataType = '', varcharSize = '', reference = '';
      const fkMatch = rest.match(/^INTEGER\s+REFERENCES\s+(\w+)\s*\([^)]*\)/i);
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
        default: defaultMatch ? defaultMatch[1] : '', reference,
      });
    }
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
  } = useSchemaState();

  const { saveProgress, saveProgressWithState, createDatabase } = useDatabase();

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [sqlText, setSqlText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', isError: false });
  const [erdVisible, setErdVisible] = useState(true);
  const [erdHeight, setErdHeight] = useState(240);
  const debounceRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

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
    const text = expertMode ? sqlText : allSQL;
    navigator.clipboard.writeText(text).then(() => showSnackbar('Copied to clipboard!'));
  };

  const handleSave = async () => {
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

  const handleCreate = async () => {
    try {
      const sql = expertMode ? sqlText : allSQL;
      if (expertMode) {
        const parsed = parseSQLToSchema(sqlText);
        if (parsed.length > 0) setAllSchemaTables(parsed);
      }
      await createDatabase(sql);
      showSnackbar('Database created!');
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
              text={allSQL || '-- Add a table to see SQL'}
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
          <button className="action-btn" onClick={handleSave}>↑ Save</button>
          <button
            className={`action-btn erd-toggle-btn${erdVisible ? ' active' : ''}`}
            onClick={() => setErdVisible(v => !v)}
          >
            {erdVisible ? '⊟ Hide ERD' : '⊞ Show ERD'}
          </button>
          <button className="action-btn primary" onClick={handleCreate}>
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
