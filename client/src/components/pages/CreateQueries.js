import React, { useState, useEffect, useRef } from "react";
import { CopyBlock } from "react-code-blocks";
import { format as formatSQL } from "sql-formatter";
import { sqlTheme } from "../../helpers/sqlTheme";
import CircularProgress from "@mui/material/CircularProgress";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import QueriesForm from "../forms/QueriesForm";
import "../forms/QueriesForm.scss";
import generateQuerySQL from "../../helpers/queryFormHelpers";
import useQueryState from "../../state/hooks/useQueryState";
import useDatabase from "../../state/hooks/useDatabase";
import useGlobalState from "../../state/hooks/useGlobalState";
import { getHistory, addToHistory, clearHistory, formatHistoryTimestamp } from "../../helpers/queryHistory";

const CreateQueriesPage = () => {
  const {
    state,
    addQueryTable,
    removeQueryTable,
    selectTableHandler,
    clearQueryTable,
    setQueryParams,
    loadQueryState,
  } = useQueryState();

  const { getTableNames, getColumnList } = useGlobalState();
  const {
    saveProgress,
    queryDatabase,
    getDatabases,
    loadDatabase,
    getSavedQueries,
    saveNamedQuery,
    deleteSavedQuery,
  } = useDatabase();

  const tableNameList = getTableNames();
  const schemas = state.queryState[0].schemas;
  const queries = state.queryState[0].queries;

  const allSQL = generateQuerySQL(queries).join("\n\n");

  const [dbList, setDbList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const hasRealDb = state.databaseName && state.databaseName !== 'database_name' && state.dbCreated;

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

  // Saved queries
  const [savedQueries, setSavedQueries] = useState([]);
  const [saveMode, setSaveMode] = useState(false);
  const [saveName, setSaveName] = useState("");

  const refreshSavedQueries = (uuid) => {
    if (!uuid || uuid === 'database_name') return;
    getSavedQueries(uuid)
      .then(data => setSavedQueries(data))
      .catch(() => {});
  };

  useEffect(() => {
    refreshSavedQueries(state.databaseUuid);
  }, [state.databaseUuid]);

  const handleSaveQuery = async () => {
    if (!saveName.trim()) return;
    if (!hasRealDb) {
      showSnackbar("Select a database first.", true);
      return;
    }
    try {
      const saved = await saveNamedQuery(
        state.databaseUuid,
        saveName.trim(),
        state.queryState
      );
      setSavedQueries(prev => [saved, ...prev]);
      setSaveName("");
      setSaveMode(false);
      showSnackbar(`Query "${saved.name}" saved.`);
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to save query.", true);
    }
  };

  const handleLoadQuery = (savedQuery) => {
    try {
      const queryState = JSON.parse(savedQuery.query_state);
      loadQueryState(queryState);
      showSnackbar(`Loaded "${savedQuery.name}".`);
    } catch {
      showSnackbar("Failed to load query.", true);
    }
  };

  const handleDeleteQuery = async (id) => {
    try {
      await deleteSavedQuery(id);
      setSavedQueries(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to delete query.", true);
    }
  };

  const [sqlFormatted, setSqlFormatted] = useState(false);
  const prevAllSQL = useRef(allSQL);
  // Reset format toggle when the SQL changes
  if (prevAllSQL.current !== allSQL) {
    prevAllSQL.current = allSQL;
    if (sqlFormatted) setSqlFormatted(false);
  }

  const displaySQL = sqlFormatted
    ? (() => { try { return formatSQL(allSQL, { language: 'postgresql' }); } catch { return allSQL; } })()
    : allSQL;

  // Expert mode: raw SQL textarea
  const [expertMode, setExpertMode] = useState(false);
  const [expertSQL, setExpertSQL] = useState("");

  const toggleExpertMode = () => {
    if (!expertMode) setExpertSQL(displaySQL);
    setExpertMode(v => !v);
  };

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [resultColumns, setResultColumns] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Load history when database changes
  useEffect(() => {
    setHistory(getHistory(state.databaseUuid));
  }, [state.databaseUuid]);

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const handleRunQuery = async () => {
    if (!hasRealDb) {
      showSnackbar("Select a database first.", true);
      return;
    }
    setQueryLoading(true);
    const sqlToRun = expertMode ? expertSQL : allSQL;
    try {
      const rows = await queryDatabase(state.databaseName, sqlToRun);
      if (!rows || rows.length === 0) {
        setQueryResults([]);
        setResultColumns([]);
        showSnackbar("Query returned no rows.", true);
      } else {
        setQueryResults(rows);
        setResultColumns(Object.keys(rows[0]));
        showSnackbar(`${rows.length} row${rows.length !== 1 ? "s" : ""} returned.`);
      }
      // Save to history (even zero-row results count)
      if (sqlToRun.trim()) {
        const next = addToHistory(state.databaseUuid, {
          sql: sqlToRun,
          queryState: state.queryState,
          rowCount: rows ? rows.length : 0,
        });
        setHistory(next);
      }
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Query failed.", true);
    } finally {
      setQueryLoading(false);
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

  const exportCSV = () => {
    if (!queryResults || queryResults.length === 0) return;
    const header = resultColumns.join(",");
    const rows = queryResults.map(row =>
      resultColumns.map(c => JSON.stringify(row[c] ?? "")).join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="split-canvas">
      {/* ── Left Panel ─────────────────────────────── */}
      <div className="split-left">
        <div className="split-left-header">
          <select
            className="db-selector"
            value={hasRealDb ? state.databaseUuid : ""}
            onChange={async e => {
              if (e.target.value) {
                await loadDatabase(e.target.value);
                refreshSavedQueries(e.target.value);
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
              Schema only — create the database first before running queries.
            </div>
          )}
        </div>

        <div className="tables-list">
          {schemas.map((table, tableIndex) => (
            <QueriesForm
              key={`query-${tableIndex}`}
              table={table}
              queries={queries}
              tableIndex={tableIndex}
              handleChange={selectTableHandler}
              clearTable={clearQueryTable}
              removeQuery={removeQueryTable}
              tableNameList={tableNameList}
              getColumnList={getColumnList}
              handleQuery={setQueryParams}
            />
          ))}

          <button className="add-query-card" onClick={addQueryTable}>
            <span>+</span>
            <span>Add Query</span>
          </button>

          {/* ── Query History ──────────────────────── */}
          <div className="saved-queries-panel">
            <div className="saved-queries-panel-header">
              <span className="saved-queries-panel-title">History</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="sq-save-open-btn"
                  onClick={() => setHistoryOpen(o => !o)}
                >
                  {historyOpen ? "▲ Hide" : "▼ Show"}
                </button>
                {history.length > 0 && (
                  <button
                    className="sq-cancel-btn"
                    title="Clear history"
                    onClick={() => {
                      clearHistory(state.databaseUuid);
                      setHistory([]);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {historyOpen && (
              history.length === 0 ? (
                <p className="sq-empty">No queries run yet for this database.</p>
              ) : (
                <ul className="sq-list">
                  {history.map((entry, i) => (
                    <li key={i} className="sq-item sq-history-item">
                      <div className="sq-history-meta">
                        <span className="sq-history-time">{formatHistoryTimestamp(entry.timestamp)}</span>
                        <span className="sq-history-rows">{entry.rowCount} row{entry.rowCount !== 1 ? "s" : ""}</span>
                      </div>
                      <code className="sq-history-sql">{entry.sql.slice(0, 80)}{entry.sql.length > 80 ? "…" : ""}</code>
                      <div className="sq-actions">
                        <button
                          className="sq-load-btn"
                          onClick={() => {
                            try {
                              loadQueryState(entry.queryState);
                              showSnackbar("Query restored from history.");
                            } catch {
                              showSnackbar("Failed to restore query.", true);
                            }
                          }}
                        >
                          Load
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>

          {/* ── Saved Queries ──────────────────────── */}
          <div className="saved-queries-panel">
            <div className="saved-queries-panel-header">
              <span className="saved-queries-panel-title">Saved Queries</span>
              {!saveMode ? (
                <button
                  className="sq-save-open-btn"
                  onClick={() => setSaveMode(true)}
                  disabled={!hasRealDb}
                >
                  + Save current
                </button>
              ) : (
                <div className="sq-save-form">
                  <input
                    className="sq-name-input"
                    placeholder="Query name…"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleSaveQuery();
                      if (e.key === "Escape") { setSaveMode(false); setSaveName(""); }
                    }}
                    autoFocus
                  />
                  <button className="sq-confirm-btn" onClick={handleSaveQuery}>Save</button>
                  <button className="sq-cancel-btn" onClick={() => { setSaveMode(false); setSaveName(""); }}>✕</button>
                </div>
              )}
            </div>

            {savedQueries.length === 0 ? (
              <p className="sq-empty">No saved queries for this database.</p>
            ) : (
              <ul className="sq-list">
                {savedQueries.map(q => (
                  <li key={q.id} className="sq-item">
                    <span className="sq-name">{q.name}</span>
                    <div className="sq-actions">
                      <button className="sq-load-btn" onClick={() => handleLoadQuery(q)}>Load</button>
                      <button className="sq-delete-btn" onClick={() => handleDeleteQuery(q.id)}>✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="split-right">
        <div className="split-right-header">
          <span className="right-panel-title">{expertMode ? "Expert SQL" : "SQL Preview"}</span>
          <button
            className={`expert-toggle-btn${expertMode ? ' active' : ''}`}
            onClick={toggleExpertMode}
            title={expertMode ? "Switch back to builder mode" : "Edit SQL directly"}
          >
            {expertMode ? "← Builder" : "Expert Mode"}
          </button>
        </div>

        {expertMode && (
          <div className="expert-mode-banner">
            Editing SQL directly — type any valid SQL and click Run Query
          </div>
        )}

        <div className="split-right-body">
          {expertMode ? (
            <textarea
              className="expert-sql-textarea"
              value={expertSQL}
              onChange={e => setExpertSQL(e.target.value)}
              spellCheck={false}
              placeholder="-- Write any SQL query here&#10;SELECT * FROM your_table LIMIT 100"
            />
          ) : (
            <div className="sql-panel">
              <CopyBlock
                language="sql"
                text={displaySQL || "-- Select a table and columns to preview SQL"}
                theme={sqlTheme}
                wrapLines={true}
                codeBlock
              />
            </div>
          )}

          {queryResults && queryResults.length > 0 && (
            <div className="query-results-wrap">
              <div className="query-results-header">
                <span className="results-count">
                  {queryResults.length} row{queryResults.length !== 1 ? "s" : ""}
                </span>
                <button className="export-csv-btn" onClick={exportCSV}>
                  ↓ Export CSV
                </button>
              </div>
              <table className="query-results-table">
                <thead>
                  <tr>
                    {resultColumns.map(col => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {queryResults.slice(0, 100).map((row, i) => (
                    <tr key={i}>
                      {resultColumns.map(col => (
                        <td key={col}>{String(row[col] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="right-panel-actions">
          <button className="run-query-btn" onClick={handleRunQuery} disabled={queryLoading}>
            {queryLoading
              ? <CircularProgress size={16} color="inherit" />
              : "▶ Run Query"
            }
          </button>
          <button className="action-btn" onClick={handleCopy}>⎘ Copy SQL</button>
          <button
            className={`action-btn${sqlFormatted ? ' active' : ''}`}
            onClick={() => setSqlFormatted(v => !v)}
            title="Toggle SQL formatting"
          >
            ⌥ Format SQL
          </button>
          <button className="action-btn" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving…' : '↑ Save State'}</button>
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

export default CreateQueriesPage;
