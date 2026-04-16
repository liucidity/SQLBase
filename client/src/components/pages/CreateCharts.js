import React, { useState, useRef } from "react";
import useDatabase from "../../state/hooks/useDatabase";
import ResponsiveBarChart from "../charts/bar-chart/ResponsiveBarChart";
import ResponsivePieChart from "../charts/pie-chart/ResponsivePieChart";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import CircularProgress from "@mui/material/CircularProgress";
import "./CreateCharts.scss";

function DropZone({ label, assignedCol, onDrop }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`drop-zone${over ? " drag-over" : ""}${assignedCol ? " assigned" : ""}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const col = e.dataTransfer.getData("text/plain");
        if (col) onDrop(col);
      }}
    >
      {assignedCol
        ? <span className="drop-zone-value">{assignedCol}</span>
        : <span className="drop-zone-placeholder">{label}</span>
      }
    </div>
  );
}

const CreateChartsPage = () => {
  const { state, queryDatabase } = useDatabase();

  const [sql, setSql] = useState("SELECT * FROM your_table LIMIT 100");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const [xKey, setXKey] = useState("");
  const [barYKey, setBarYKey] = useState("");
  const [pieKey, setPieKey] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const runQuery = async () => {
    if (!state.databaseName) {
      showSnackbar("No database loaded. Load a database first.", true);
      return;
    }
    setLoading(true);
    try {
      const result = await queryDatabase(state.databaseName, sql);
      if (!result || result.length === 0) {
        setRows([]);
        setColumns([]);
        showSnackbar("Query returned no rows.", true);
      } else {
        const cols = Object.keys(result[0]);
        setRows(result);
        setColumns(cols);
        setXKey(cols[0] || "");
        setBarYKey(cols[1] || cols[0] || "");
        setPieKey(cols[0] || "");
        showSnackbar(`${result.length} row${result.length !== 1 ? "s" : ""} loaded.`);
      }
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Query failed.", true);
    } finally {
      setLoading(false);
    }
  };

  const barData = rows.map(row => ({
    ...row,
    [barYKey]: Number(row[barYKey]) || 0,
  }));

  const pieData = (() => {
    const counts = {};
    rows.forEach(row => {
      const key = String(row[pieKey] ?? "null");
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 20);
  })();

  const hasData = rows.length > 0;

  return (
    <main className="charts-canvas">
      {/* ── SQL input area ──────────────────────────── */}
      <div className="charts-sql-bar">
        <div className="charts-sql-header">
          <span className="charts-db-label">
            Database: <strong>{state.databaseName || "None loaded"}</strong>
          </span>
        </div>
        <textarea
          className="charts-sql-input"
          value={sql}
          onChange={e => setSql(e.target.value)}
          rows={2}
          spellCheck={false}
        />
        <button
          className="charts-run-btn"
          onClick={runQuery}
          disabled={loading}
        >
          {loading
            ? <CircularProgress size={14} color="inherit" />
            : "▶ Run Query"
          }
          {hasData && !loading && (
            <span className="charts-row-count">
              {rows.length} row{rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </button>
      </div>

      {/* ── Column pills tray ───────────────────────── */}
      {hasData && (
        <div className="charts-columns-tray">
          <span className="charts-tray-label">Columns</span>
          <div className="charts-column-pills">
            {columns.map(col => (
              <div
                key={col}
                className="chart-col-pill"
                draggable
                onDragStart={e => e.dataTransfer.setData("text/plain", col)}
              >
                {col}
              </div>
            ))}
          </div>
          <span className="charts-tray-hint">Drag a column onto a chart axis</span>
        </div>
      )}

      {/* ── Chart cards ─────────────────────────────── */}
      {hasData && (
        <div className="charts-cards-row">
          {/* Bar chart card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-card-title">Bar Chart</span>
              <div className="chart-drop-zones">
                <div className="chart-drop-zone-group">
                  <span className="drop-zone-label">X Axis</span>
                  <DropZone
                    label="Drop column ↓"
                    assignedCol={xKey}
                    onDrop={setXKey}
                  />
                </div>
                <div className="chart-drop-zone-group">
                  <span className="drop-zone-label">Y Axis</span>
                  <DropZone
                    label="Drop column ↓"
                    assignedCol={barYKey}
                    onDrop={setBarYKey}
                  />
                </div>
              </div>
            </div>
            <div className="chart-card-body">
              <ResponsiveBarChart chartData={barData} xKey={xKey} yKey={barYKey} />
            </div>
          </div>

          {/* Pie chart card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <span className="chart-card-title">Pie Chart</span>
              <div className="chart-drop-zones">
                <div className="chart-drop-zone-group">
                  <span className="drop-zone-label">Label Key</span>
                  <DropZone
                    label="Drop column ↓"
                    assignedCol={pieKey}
                    onDrop={setPieKey}
                  />
                </div>
              </div>
            </div>
            <div className="chart-card-body">
              <ResponsivePieChart chartData={pieData} groupByKey={pieKey} />
            </div>
          </div>
        </div>
      )}

      {!hasData && (
        <div className="charts-empty">
          <div className="charts-empty-icon">📊</div>
          <p>Run a query to load data and build charts</p>
        </div>
      )}

      <SuccessSnackbar
        open={snackbar.open}
        message={snackbar.message}
        isError={snackbar.isError}
        handleClose={closeSnackbar}
      />
    </main>
  );
};

export default CreateChartsPage;
