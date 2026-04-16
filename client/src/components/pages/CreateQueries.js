import React, { useState } from "react";
import { CopyBlock } from "react-code-blocks";
import { sqlTheme } from "../../helpers/sqlTheme";
import CircularProgress from "@mui/material/CircularProgress";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import QueriesForm from "../forms/QueriesForm";
import "../forms/QueriesForm.scss";
import generateQuerySQL from "../../helpers/queryFormHelpers";
import useQueryState from "../../state/hooks/useQueryState";
import useDatabase from "../../state/hooks/useDatabase";
import useGlobalState from "../../state/hooks/useGlobalState";

const CreateQueriesPage = () => {
  const {
    state,
    addQueryTable,
    removeQueryTable,
    selectTableHandler,
    setQueryParams,
  } = useQueryState();

  const { getTableNames, getColumnList } = useGlobalState();
  const { saveProgress, queryDatabase } = useDatabase();

  const tableNameList = getTableNames();
  const schemas = state.queryState[0].schemas;
  const queries = state.queryState[0].queries;

  const allSQL = generateQuerySQL(queries).join("\n\n");

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [resultColumns, setResultColumns] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const handleRunQuery = async () => {
    if (!state.databaseName) {
      showSnackbar("No database loaded. Load a database first.", true);
      return;
    }
    setQueryLoading(true);
    try {
      const rows = await queryDatabase(state.databaseName, allSQL);
      if (!rows || rows.length === 0) {
        setQueryResults([]);
        setResultColumns([]);
        showSnackbar("Query returned no rows.", true);
      } else {
        setQueryResults(rows);
        setResultColumns(Object.keys(rows[0]));
        showSnackbar(`${rows.length} row${rows.length !== 1 ? "s" : ""} returned.`);
      }
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Query failed.", true);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(allSQL);
      showSnackbar("SQL copied to clipboard.");
    } catch {
      showSnackbar("Failed to copy.", true);
    }
  };

  const handleSave = async () => {
    try {
      await saveProgress();
      showSnackbar("Progress saved.");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to save.", true);
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
          <span className="split-db-name">{state.databaseName || "No database loaded"}</span>
        </div>

        <div className="tables-list">
          {schemas.map((table, tableIndex) => (
            <QueriesForm
              key={`query-${tableIndex}`}
              table={table}
              queries={queries}
              tableIndex={tableIndex}
              handleChange={selectTableHandler}
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
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="split-right">
        <div className="split-right-header">
          <span className="right-panel-title">SQL Preview</span>
        </div>

        <div className="sql-panel">
          <CopyBlock
            language="sql"
            text={allSQL || "-- Select a table and columns to preview SQL"}
            theme={sqlTheme}
            wrapLines={true}
            codeBlock
          />
        </div>

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

        <div className="right-panel-actions">
          <button className="run-query-btn" onClick={handleRunQuery} disabled={queryLoading}>
            {queryLoading
              ? <CircularProgress size={16} color="inherit" />
              : "▶ Run Query"
            }
          </button>
          <button className="action-btn" onClick={handleCopy}>⎘ Copy SQL</button>
          <button className="action-btn" onClick={handleSave}>↑ Save</button>
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
