import React, { useState, useEffect, useRef } from "react";
import { format as formatSQL } from "sql-formatter";
import { CopyBlock } from "react-code-blocks";
import { sqlTheme } from "../../helpers/sqlTheme";
import useSeedState from "../../state/hooks/useSeedState";
import useDatabase from "../../state/hooks/useDatabase";
import SeedsForm from "../forms/SeedsForm";
import SeedsModal from "../modal/SeedsModal";
import { generateSeedSQL } from "../../helpers/seedFormHelpers";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import "../forms/SeedsForm.scss";
import "../forms/SchemaForm.scss";

const CreateSeedsPage = () => {
  const { state, generateSeedState, setSeedFieldConfig } = useSeedState();
  const { saveProgress, seedDatabase, getDatabases, loadDatabase } = useDatabase();

  const table = state.schemaState;
  const seeds = state.seedState;
  const seedSQL = generateSeedSQL(seeds, state.schemaState);

  const [dbList, setDbList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const hasRealDb = state.databaseName && state.databaseName !== "database_name" && state.dbCreated;

  useEffect(() => {
    getDatabases()
      .then(data => {
        const parsed = data
          .map(item => { try { return JSON.parse(item.global_state); } catch { return null; } })
          .filter(db => db && db.dbCreated);
        setDbList(parsed);
      })
      .catch(() => {});
  }, []);

  const [sqlFormatted, setSqlFormatted] = useState(false);
  const prevSeedSQL = useRef(seedSQL);
  if (prevSeedSQL.current !== seedSQL) {
    prevSeedSQL.current = seedSQL;
    if (sqlFormatted) setSqlFormatted(false);
  }
  const displaySQL = sqlFormatted
    ? (() => { try { return formatSQL(seedSQL, { language: 'postgresql' }); } catch { return seedSQL; } })()
    : seedSQL;

  // Expert mode: raw SQL textarea for custom INSERT statements
  const [expertMode, setExpertMode] = useState(false);
  const [expertSQL, setExpertSQL] = useState("");

  const toggleExpertMode = () => {
    if (!expertMode) setExpertSQL(displaySQL);
    setExpertMode(v => !v);
  };

  const [isOpen, setIsOpen] = useState({ modal: false, table: null });
  const [seeding, setSeeding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const buttonHandler = t => setIsOpen({ modal: true, table: t });
  const handleClose = () => setIsOpen({ modal: false, table: null });

  const handleSeed = async () => {
    if (!hasRealDb) {
      showSnackbar("Select a database first.", true);
      return;
    }
    setSeeding(true);
    const sqlToRun = expertMode ? expertSQL : seedSQL;
    try {
      await seedDatabase(state.databaseName, sqlToRun);
      showSnackbar("Database seeded successfully.");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to seed database.", true);
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveProgress();
      showSnackbar("Progress saved.");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to save.", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(expertMode ? expertSQL : displaySQL);
      showSnackbar("SQL copied to clipboard.");
    } catch {
      showSnackbar("Failed to copy.", true);
    }
  };

  return (
    <main className="split-canvas">
      {isOpen.modal && (
        <SeedsModal
          open={isOpen}
          onClick={handleClose}
          table={isOpen.table}
          seeds={seeds}
        />
      )}

      {/* ── Left Panel ─────────────────────────────── */}
      <div className="split-left pinned-footer">
        <div className="split-left-header">
          <select
            className="db-selector"
            value={hasRealDb ? state.databaseUuid : ""}
            onChange={async e => {
              if (e.target.value) {
                await loadDatabase(e.target.value);
              }
            }}
          >
            {!hasRealDb && <option value="">— Select a created database —</option>}
            {dbList.map(db => (
              <option key={db.databaseUuid} value={db.databaseUuid}>
                {db.databaseName}
              </option>
            ))}
          </select>
          {state.databaseName && state.databaseName !== "database_name" && !state.dbCreated && (
            <div className="schema-only-banner">
              Schema only — create the database first before seeding.
            </div>
          )}
        </div>

        <div className="tables-list">
          <SeedsForm
            table={table}
            buttonHandler={buttonHandler}
            dropDownHandler={generateSeedState}
            seedFieldConfig={state.seedFieldConfig}
            onFieldConfigChange={setSeedFieldConfig}
          />
        </div>

        <button
          className="seed-all-btn"
          onClick={handleSeed}
          disabled={seeding || !table || table.length === 0}
        >
          {seeding ? "Seeding…" : "⚡ Seed All Tables"}
        </button>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="split-right">
        <div className="split-right-header">
          <span className="right-panel-title">{expertMode ? "Expert SQL" : "SQL Preview"}</span>
          <button
            className={`expert-toggle-btn${expertMode ? ' active' : ''}`}
            onClick={toggleExpertMode}
            title={expertMode ? "Switch back to builder mode" : "Write custom INSERT statements"}
          >
            {expertMode ? "← Builder" : "Expert Mode"}
          </button>
        </div>

        {expertMode && (
          <div className="expert-mode-banner">
            Write custom INSERT statements — these will be executed when you click "Seed All Tables"
          </div>
        )}

        <div className="split-right-body">
          {expertMode ? (
            <textarea
              className="expert-sql-textarea"
              value={expertSQL}
              onChange={e => setExpertSQL(e.target.value)}
              spellCheck={false}
              placeholder="-- Write INSERT statements here&#10;INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');"
            />
          ) : (
            <div className="sql-panel">
              <CopyBlock
                language="sql"
                text={displaySQL || "-- Configure tables and row counts to preview INSERT SQL"}
                theme={sqlTheme}
                wrapLines={true}
                codeBlock
              />
            </div>
          )}
        </div>

        <div className="right-panel-actions">
          <button className="action-btn" onClick={handleCopy}>⎘ Copy SQL</button>
          {!expertMode && (
            <button
              className={`action-btn${sqlFormatted ? ' active' : ''}`}
              onClick={() => setSqlFormatted(v => !v)}
              title="Toggle SQL formatting"
            >
              ⌥ Format SQL
            </button>
          )}
          <button className="action-btn" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : '↑ Save'}</button>
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

export default CreateSeedsPage;
