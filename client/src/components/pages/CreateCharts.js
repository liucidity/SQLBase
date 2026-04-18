import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import useDatabase from "../../state/hooks/useDatabase";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  ScatterChart, Scatter,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import CircularProgress from "@mui/material/CircularProgress";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import "./CreateCharts.scss";

/* ─── Constants ──────────────────────────────────────────── */

const PALETTE = [
  '#6366f1','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#ec4899','#f97316',
  '#14b8a6','#84cc16','#a78bfa','#34d399',
];

const CHART_TYPES = [
  { id: 'bar',     label: 'Bar',     icon: '▪' },
  { id: 'line',    label: 'Line',    icon: '∿' },
  { id: 'area',    label: 'Area',    icon: '◭' },
  { id: 'donut',   label: 'Donut',   icon: '◯' },
  { id: 'scatter', label: 'Scatter', icon: '·' },
];

const AXIS_TICK  = { fontSize: 11, fill: '#64748b' };
const GRID_STYLE = { stroke: '#1e293b', strokeDasharray: '3 3' };

/* ─── Math helpers ───────────────────────────────────────── */

function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  if (!Number.isInteger(n)) return n.toFixed(2);
  return n.toLocaleString();
}

function isNumericCol(rows, col) {
  if (!rows.length) return false;
  return rows.every(r => r[col] === null || r[col] === '' || !isNaN(Number(r[col])));
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  );
  return den === 0 ? 0 : num / den;
}

// Map correlation -1..1 to a CSS color
function corrColor(r) {
  if (r >= 1)    return 'rgba(16,185,129,0.25)';   // perfect positive
  if (r >= 0.7)  return 'rgba(16,185,129,0.15)';
  if (r >= 0.3)  return 'rgba(16,185,129,0.07)';
  if (r > -0.3)  return 'transparent';              // weak
  if (r > -0.7)  return 'rgba(239,68,68,0.07)';
  if (r > -1)    return 'rgba(239,68,68,0.15)';
  return 'rgba(239,68,68,0.25)';
}

/* ─── Custom Tooltip ─────────────────────────────────────── */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined && <div className="chart-tooltip-label">{String(label)}</div>}
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color || p.fill || PALETTE[i] }} />
          <span className="chart-tooltip-key">{p.name || p.dataKey}</span>
          <span className="chart-tooltip-val">{fmtNum(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Chart renderer ─────────────────────────────────────── */

function ChartView({ type, data, xKey, yKey, height = 320 }) {
  if (!data.length || !xKey) {
    return (
      <div className="chart-no-data">
        <span className="chart-no-data-icon">⬡</span>
        <span>Assign columns above to render</span>
      </div>
    );
  }

  const margin = { top: 12, right: 16, bottom: 56, left: 8 };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={AXIS_TICK} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={yKey} radius={[3,3,0,0]} maxBarSize={48}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={margin}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={AXIS_TICK} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            dataKey={yKey}
            stroke={PALETTE[0]}
            strokeWidth={2}
            dot={{ r: 3, fill: PALETTE[0], strokeWidth: 0 }}
            activeDot={{ r: 5, fill: PALETTE[0] }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    const gradId = `areaGrad-${xKey}-${yKey}`;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={margin}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={PALETTE[0]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={AXIS_TICK} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area dataKey={yKey} stroke={PALETTE[0]} strokeWidth={2} fill={`url(#${gradId})`} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'scatter') {
    const scatterData = data.map(row => ({
      x: Number(row[xKey]) || 0,
      y: Number(row[yKey]) || 0,
    }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ ...margin, bottom: 36 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="x" type="number" name={xKey} tick={AXIS_TICK}
            label={{ value: xKey, position: 'insideBottom', offset: -8, fill: '#475569', fontSize: 11 }}
          />
          <YAxis dataKey="y" type="number" name={yKey} tick={AXIS_TICK} width={48} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div className="chart-tooltip">
                  <div className="chart-tooltip-row">
                    <span className="chart-tooltip-key">{xKey}</span>
                    <span className="chart-tooltip-val">{fmtNum(d?.x)}</span>
                  </div>
                  <div className="chart-tooltip-row">
                    <span className="chart-tooltip-key">{yKey}</span>
                    <span className="chart-tooltip-val">{fmtNum(d?.y)}</span>
                  </div>
                </div>
              );
            }}
            cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
          />
          <Scatter data={scatterData} fill={PALETTE[0]} fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'donut') {
    const counts = {};
    data.forEach(row => {
      const k = String(row[xKey] ?? 'null');
      counts[k] = (counts[k] || 0) + 1;
    });
    const pieData = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
    const total = pieData.reduce((s, d) => s + d.value, 0);
    return (
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius="38%" outerRadius="62%" paddingAngle={2} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <div className="chart-tooltip">
                    <div className="chart-tooltip-label">{p.name}</div>
                    <div className="chart-tooltip-row">
                      <span className="chart-tooltip-dot" style={{ background: PALETTE[pieData.findIndex(d => d.name === p.name) % PALETTE.length] }} />
                      <span className="chart-tooltip-val">{p.value}</span>
                      <span className="chart-tooltip-pct">({((p.value / total) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <span className="donut-center-val">{total.toLocaleString()}</span>
          <span className="donut-center-label">total</span>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Stat card ──────────────────────────────────────────── */

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ '--card-accent': accent }}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

/* ─── Correlation matrix ─────────────────────────────────── */

function CorrelationMatrix({ rows, numCols }) {
  const matrix = useMemo(() => {
    return numCols.map(a => {
      const xs = rows.map(r => Number(r[a]));
      return numCols.map(b => {
        if (a === b) return 1;
        const ys = rows.map(r => Number(r[b]));
        return pearson(xs, ys);
      });
    });
  }, [rows, numCols]);

  return (
    <div className="corr-section">
      <div className="corr-header">
        <span className="corr-title">Correlation Matrix</span>
        <span className="corr-hint">Pearson r between numeric columns</span>
      </div>
      <div className="corr-table-wrap">
        <table className="corr-table">
          <thead>
            <tr>
              <th />
              {numCols.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {numCols.map((rowCol, ri) => (
              <tr key={rowCol}>
                <th>{rowCol}</th>
                {numCols.map((colCol, ci) => {
                  const r = matrix[ri][ci];
                  const isDiag = ri === ci;
                  return (
                    <td
                      key={colCol}
                      style={{ background: isDiag ? 'rgba(99,102,241,0.08)' : corrColor(r) }}
                      className={isDiag ? 'corr-diag' : ''}
                      title={`${rowCol} ↔ ${colCol}: ${r.toFixed(4)}`}
                    >
                      <span className="corr-val" style={{
                        color: isDiag ? 'var(--accent)' :
                          r >= 0.5 ? '#10b981' :
                          r <= -0.5 ? '#ef4444' :
                          'var(--text-muted)'
                      }}>
                        {isDiag ? '1.00' : r.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Relationship panel ─────────────────────────────────── */

function RelationPanel({ relationships, schemaTables, onLoadSQL }) {
  if (!relationships.length) return null;

  function buildJoinSQL(rel) {
    const t1 = schemaTables.find(t => t.table === rel.fromTable);
    const t2 = schemaTables.find(t => t.table === rel.toTable);
    const cols1 = t1?.fields.filter(f => f.fieldName).map(f => `  ${rel.fromTable}.${f.fieldName}`) || [`  ${rel.fromTable}.*`];
    const cols2 = t2?.fields.filter(f => f.fieldName).map(f => `  ${rel.toTable}.${f.fieldName}`) || [`  ${rel.toTable}.*`];
    return `SELECT\n${[...cols1, ...cols2].join(',\n')}\nFROM ${rel.fromTable}\nJOIN ${rel.toTable}\n  ON ${rel.fromTable}.${rel.fromField} = ${rel.toTable}.${rel.toField}\nLIMIT 100`;
  }

  const typeLabel = {
    'one-to-many': '1→N',
    'many-to-one': 'N→1',
    'one-to-one':  '1→1',
    'many-to-many':'N→N',
  };

  return (
    <div className="relation-panel">
      <div className="relation-panel-header">
        <span className="relation-panel-title">⟷ Relationships</span>
        <span className="relation-panel-count">{relationships.length} foreign key{relationships.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="relation-list">
        {relationships.map((rel, i) => (
          <div key={i} className="relation-item">
            <div className="relation-item-diagram">
              <span className="rel-table">{rel.fromTable}</span>
              <span className="rel-field">.{rel.fromField}</span>
              <span className="rel-arrow">
                <span className="rel-type-badge">{typeLabel[rel.relationType] || '1→N'}</span>
              </span>
              <span className="rel-table">{rel.toTable}</span>
              <span className="rel-field">.{rel.toField}</span>
            </div>
            <button
              className="rel-join-btn"
              onClick={() => onLoadSQL(buildJoinSQL(rel))}
              title="Load JOIN query into the editor"
            >
              JOIN →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Focused chart modal ────────────────────────────────── */

function FocusedModal({ panel, data, columns, onClose, onUpdate }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="focus-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="focus-modal">
        {/* Modal header */}
        <div className="focus-modal-header">
          <div className="focus-modal-controls">
            {/* Type pills */}
            <div className="focus-type-pills">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.id}
                  className={`dash-type-pill${panel.type === ct.id ? ' active' : ''}`}
                  onClick={() => onUpdate({ type: ct.id })}
                >
                  <span className="dash-type-pill-icon">{ct.icon}</span>
                  <span>{ct.label}</span>
                </button>
              ))}
            </div>
            {/* Axis selectors */}
            <div className="focus-axes">
              <div className="dash-axis-group">
                <span className="dash-axis-label">
                  {panel.type === 'scatter' ? 'X (num)' : panel.type === 'donut' ? 'Group by' : 'X Axis'}
                </span>
                <select
                  className="panel-axis-select"
                  value={panel.xKey}
                  onChange={e => onUpdate({ xKey: e.target.value })}
                >
                  <option value="">— column —</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {panel.type !== 'donut' && (
                <div className="dash-axis-group">
                  <span className="dash-axis-label">
                    {panel.type === 'scatter' ? 'Y (num)' : 'Y Axis (numeric)'}
                  </span>
                  <select
                    className="panel-axis-select"
                    value={panel.yKey}
                    onChange={e => onUpdate({ yKey: e.target.value })}
                  >
                    <option value="">— column —</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          <button className="focus-close-btn" onClick={onClose} title="Close (Esc)">×</button>
        </div>

        {/* Chart */}
        <div className="focus-modal-body">
          <ChartView
            type={panel.type}
            data={data}
            xKey={panel.xKey}
            yKey={panel.yKey}
            height={480}
          />
        </div>

        {/* Footer hint */}
        <div className="focus-modal-footer">
          <span>Press <kbd>Esc</kbd> or click outside to close</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Col select ─────────────────────────────────────────── */

function ColSelect({ value, onChange, columns, placeholder }) {
  return (
    <select className="panel-axis-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {columns.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

const CreateChartsPage = () => {
  const { state, queryDatabase, getDatabases, loadDatabase } = useDatabase();

  const [dbList, setDbList]             = useState([]);
  const [schemaOpen, setSchemaOpen]     = useState(false);
  const [relOpen, setRelOpen]           = useState(false);
  const [sql, setSql]                   = useState("SELECT * FROM your_table LIMIT 100");
  const [rows, setRows]                 = useState([]);
  const [columns, setColumns]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [tableVisible, setTableVisible] = useState(false);
  const [sortCol, setSortCol]           = useState(null);
  const [sortDir, setSortDir]           = useState('asc');
  const [page, setPage]                 = useState(0);
  const [pageSize, setPageSize]         = useState(25);
  const [snackbar, setSnackbar]         = useState({ open: false, message: '', isError: false });
  const [focusedPanelId, setFocusedPanelId] = useState(null);
  const panelIdRef                      = useRef(3);

  const [panels, setPanels] = useState([
    { id: 1, type: 'bar',   xKey: '', yKey: '' },
    { id: 2, type: 'donut', xKey: '', yKey: '' },
  ]);

  const hasRealDb    = state.databaseName && state.databaseName !== 'database_name' && state.dbCreated;
  const schemaTables = (state.schemaState || []).filter(t => t.table && t.table !== 'table_name');

  // Extract FK relationships from schema
  const relationships = useMemo(() =>
    schemaTables.flatMap(t =>
      t.fields
        .filter(f => f.fieldName && f.reference && f.reference.includes('.'))
        .map(f => {
          const [toTable, toField] = f.reference.split('.');
          return {
            fromTable:    t.table,
            fromField:    f.fieldName,
            toTable,
            toField:      toField || 'id',
            relationType: f.relationType || 'one-to-many',
          };
        })
    ),
    [schemaTables]
  );

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

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const runQuery = async () => {
    if (!hasRealDb) { showSnackbar("Select a database first.", true); return; }
    setLoading(true);
    try {
      const result = await queryDatabase(state.databaseName, sql);
      if (!result || result.length === 0) {
        setRows([]); setColumns([]);
        showSnackbar("Query returned no rows.", true);
      } else {
        const cols    = Object.keys(result[0]);
        const numCols = cols.filter(c => isNumericCol(result, c));
        const txtCols = cols.filter(c => !numCols.includes(c));
        setRows(result);
        setColumns(cols);
        const autoX = txtCols[0]  || cols[0] || '';
        const autoY = numCols[0]  || cols[1] || cols[0] || '';
        setPanels(p => p.map(panel => ({
          ...panel,
          xKey: panel.xKey || autoX,
          yKey: panel.yKey || autoY,
        })));
        setPage(0);
        showSnackbar(`${result.length} row${result.length !== 1 ? 's' : ''} loaded.`);
      }
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Query failed.", true);
    } finally {
      setLoading(false);
    }
  };

  /* ── Stats ───────────────────────────────────────────── */
  const { stats, numCols } = useMemo(() => {
    if (!rows.length) return { stats: null, numCols: [] };
    const nc = columns.filter(c => isNumericCol(rows, c));
    const tc = columns.filter(c => !nc.includes(c));
    const fn = nc[0];
    const nums = fn ? rows.map(r => Number(r[fn])).filter(n => !isNaN(n)) : [];
    const sum  = nums.length ? nums.reduce((a, b) => a + b, 0) : null;
    const avg  = nums.length ? sum / nums.length : null;
    const min  = nums.length ? Math.min(...nums) : null;
    const max  = nums.length ? Math.max(...nums) : null;
    const unique = tc[0] ? new Set(rows.map(r => r[tc[0]])).size : null;
    return {
      stats: { totalRows: rows.length, firstNum: fn, sum, avg, min, max, unique, textCols: tc, numCols: nc },
      numCols: nc,
    };
  }, [rows, columns]);

  /* ── Table sort + paginate ───────────────────────────── */
  const tableData = useMemo(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const an = Number(av), bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) return sortDir === 'asc' ? an - bn : bn - an;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, sortCol, sortDir]);

  const totalPages = Math.ceil(tableData.length / pageSize);
  const pageData   = tableData.slice(page * pageSize, (page + 1) * pageSize);

  /* ── Panel helpers ───────────────────────────────────── */
  const addPanel    = () => {
    if (panels.length >= 4) return;
    const id = panelIdRef.current++;
    setPanels(p => [...p, { id, type: 'line', xKey: '', yKey: '' }]);
  };
  const removePanel = id => setPanels(p => p.filter(pan => pan.id !== id));
  const updatePanel = useCallback((id, changes) =>
    setPanels(p => p.map(pan => pan.id === id ? { ...pan, ...changes } : pan)),
    []
  );

  const hasData       = rows.length > 0;
  const focusedPanel  = panels.find(p => p.id === focusedPanelId) || null;

  /* ── Render ──────────────────────────────────────────── */
  return (
    <main className="dash-canvas">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-title">
            <span className="dash-title-icon">◈</span>
            Analytics
          </h1>
          {hasData && (
            <span className="dash-badge">{rows.length.toLocaleString()} rows</span>
          )}
        </div>

        <div className="dash-header-right">
          <select
            className="dash-db-select"
            value={hasRealDb ? state.databaseUuid : ''}
            onChange={async e => { if (e.target.value) await loadDatabase(e.target.value); }}
          >
            {!hasRealDb && <option value="">— Select database —</option>}
            {dbList.map(db => (
              <option key={db.databaseUuid} value={db.databaseUuid}>{db.databaseName}</option>
            ))}
          </select>

          {hasRealDb && schemaTables.length > 0 && (
            <button className="dash-schema-btn" onClick={() => setSchemaOpen(o => !o)}>
              Schema {schemaOpen ? '▲' : '▾'}
            </button>
          )}
          {relationships.length > 0 && (
            <button
              className={`dash-schema-btn${relOpen ? ' active' : ''}`}
              onClick={() => setRelOpen(o => !o)}
            >
              ⟷ Joins {relOpen ? '▲' : '▾'}
            </button>
          )}
        </div>
      </div>

      {/* ── Schema panel ────────────────────────────────── */}
      {hasRealDb && schemaOpen && schemaTables.length > 0 && (
        <div className="dash-schema-panel">
          {schemaTables.map(t => (
            <div key={t.table} className="dash-schema-table">
              <button
                className="dash-schema-table-btn"
                onClick={() => {
                  const fields = t.fields.map(f => f.fieldName).filter(Boolean);
                  setSql(`SELECT ${fields.length ? fields.join(', ') : '*'} FROM ${t.table} LIMIT 100`);
                }}
              >
                {t.table}
              </button>
              <div className="dash-schema-cols">
                {t.fields.filter(f => f.fieldName).map(f => (
                  <span key={f.fieldName} className="dash-schema-col">
                    {f.fieldName}
                    {f.reference && <span className="fk-indicator" title={`FK → ${f.reference}`}>FK</span>}
                    {f.dataType && <span className="dash-schema-col-type">{f.dataType}</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Relationship panel ───────────────────────────── */}
      {relOpen && (
        <RelationPanel
          relationships={relationships}
          schemaTables={schemaTables}
          onLoadSQL={sql => { setSql(sql); setRelOpen(false); }}
        />
      )}

      {/* ── SQL bar ─────────────────────────────────────── */}
      <div className="dash-sql-bar">
        <textarea
          className="dash-sql-input"
          value={sql}
          onChange={e => setSql(e.target.value)}
          rows={3}
          spellCheck={false}
          placeholder="SELECT col1, col2 FROM your_table LIMIT 100"
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
          }}
        />
        <button className="dash-run-btn" onClick={runQuery} disabled={loading}>
          {loading
            ? <CircularProgress size={14} color="inherit" />
            : <><span className="dash-run-icon">▶</span><span>Run</span></>
          }
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      {hasData && stats && (
        <div className="dash-stats-row">
          <StatCard
            label="Total Rows"
            value={fmtNum(stats.totalRows)}
            sub={`${columns.length} column${columns.length !== 1 ? 's' : ''}`}
            accent="#6366f1"
          />
          {stats.firstNum ? (
            <>
              <StatCard label={`Sum · ${stats.firstNum}`}   value={fmtNum(stats.sum)} accent="#10b981" />
              <StatCard label={`Avg · ${stats.firstNum}`}   value={fmtNum(stats.avg)} accent="#f59e0b" />
              <StatCard
                label={`Range · ${stats.firstNum}`}
                value={`${fmtNum(stats.min)} – ${fmtNum(stats.max)}`}
                accent="#8b5cf6"
              />
            </>
          ) : stats.textCols.length > 0 ? (
            <>
              <StatCard label={`Unique · ${stats.textCols[0]}`} value={fmtNum(stats.unique)} accent="#10b981" />
              {stats.textCols[1] && (
                <StatCard
                  label={`Unique · ${stats.textCols[1]}`}
                  value={fmtNum(new Set(rows.map(r => r[stats.textCols[1]])).size)}
                  accent="#f59e0b"
                />
              )}
              <StatCard label="Columns" value={columns.length} accent="#8b5cf6" />
            </>
          ) : (
            <StatCard label="Columns" value={columns.length} accent="#10b981" />
          )}
        </div>
      )}

      {/* ── Correlation matrix ───────────────────────────── */}
      {hasData && numCols.length >= 2 && (
        <CorrelationMatrix rows={rows} numCols={numCols} />
      )}

      {/* ── Chart panels ────────────────────────────────── */}
      {hasData && (
        <>
          <div className="dash-panels-grid">
            {panels.map(panel => (
              <div key={panel.id} className="dash-panel">
                <div className="dash-panel-header">
                  <div className="dash-panel-type-row">
                    {CHART_TYPES.map(ct => (
                      <button
                        key={ct.id}
                        className={`dash-type-pill${panel.type === ct.id ? ' active' : ''}`}
                        onClick={() => updatePanel(panel.id, { type: ct.id })}
                        title={ct.label}
                      >
                        <span className="dash-type-pill-icon">{ct.icon}</span>
                        <span>{ct.label}</span>
                      </button>
                    ))}
                    <div className="dash-panel-actions">
                      <button
                        className="dash-focus-btn"
                        onClick={() => setFocusedPanelId(panel.id)}
                        title="Expand chart"
                      >
                        ⤢
                      </button>
                      {panels.length > 1 && (
                        <button className="dash-panel-close" onClick={() => removePanel(panel.id)} title="Remove">×</button>
                      )}
                    </div>
                  </div>

                  <div className="dash-panel-axes-row">
                    <div className="dash-axis-group">
                      <span className="dash-axis-label">
                        {panel.type === 'scatter' ? 'X (num)' : panel.type === 'donut' ? 'Group by' : 'X Axis'}
                      </span>
                      <ColSelect value={panel.xKey} onChange={v => updatePanel(panel.id, { xKey: v })} columns={columns} placeholder="— column —" />
                    </div>
                    {panel.type !== 'donut' && (
                      <div className="dash-axis-group">
                        <span className="dash-axis-label">
                          {panel.type === 'scatter' ? 'Y (num)' : 'Y Axis (numeric)'}
                        </span>
                        <ColSelect value={panel.yKey} onChange={v => updatePanel(panel.id, { yKey: v })} columns={columns} placeholder="— column —" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="dash-panel-body">
                  <ChartView type={panel.type} data={rows} xKey={panel.xKey} yKey={panel.yKey} height={300} />
                </div>
              </div>
            ))}

            {panels.length < 4 && (
              <button className="dash-add-panel" onClick={addPanel}>
                <span className="dash-add-icon">+</span>
                <span>Add Chart</span>
              </button>
            )}
          </div>

          {/* ── Data table ─────────────────────────────── */}
          <div className="dash-table-section">
            <div className="dash-table-topbar">
              <button className="dash-table-toggle-btn" onClick={() => setTableVisible(v => !v)}>
                <span className="dash-table-toggle-arrow">{tableVisible ? '▲' : '▼'}</span>
                Raw Data
                <span className="dash-table-count">{rows.length.toLocaleString()} rows · {columns.length} cols</span>
              </button>
              {tableVisible && (
                <div className="dash-table-controls">
                  <select className="dash-page-size" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>
                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                  <div className="dash-pagination">
                    <button className="dash-page-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
                    <span className="dash-page-info">{page + 1} / {totalPages}</span>
                    <button className="dash-page-btn" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>›</button>
                  </div>
                </div>
              )}
            </div>

            {tableVisible && (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      {columns.map(col => (
                        <th
                          key={col}
                          className={sortCol === col ? 'sorted' : ''}
                          onClick={() => {
                            if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            else { setSortCol(col); setSortDir('asc'); }
                          }}
                        >
                          <span className="th-content">
                            {col}
                            <span className="sort-icon">{sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((row, i) => (
                      <tr key={i}>
                        {columns.map(col => (
                          <td key={col}>
                            {row[col] === null
                              ? <span className="null-badge">null</span>
                              : String(row[col])
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Empty state ─────────────────────────────────── */}
      {!hasData && (
        <div className="dash-empty">
          <div className="dash-empty-glyph">◈</div>
          <h2 className="dash-empty-title">Analytics Dashboard</h2>
          <p className="dash-empty-sub">
            Run a query to unlock stat cards, correlation analysis, configurable charts, and a full data table.
          </p>
          <div className="dash-empty-steps">
            <div className={`dash-step${!hasRealDb ? ' active' : ' done'}`}>
              <span className="dash-step-num">{hasRealDb ? '✓' : '1'}</span>
              <div>
                <strong>{hasRealDb ? state.databaseName : 'Select a database'}</strong>
                {!hasRealDb && <p>Use the dropdown in the top-right</p>}
              </div>
            </div>
            <div className={`dash-step${hasRealDb ? ' active' : ''}`}>
              <span className="dash-step-num">2</span>
              <div>
                <strong>Write & run a query</strong>
                <p>⌘↵ to run · Schema ▾ to browse · Joins ▾ for FKs</p>
              </div>
            </div>
            <div className="dash-step">
              <span className="dash-step-num">3</span>
              <div>
                <strong>Explore your data</strong>
                <p>Metrics · correlation matrix · 5 chart types · raw table</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Focused chart modal ──────────────────────────── */}
      {focusedPanel && (
        <FocusedModal
          panel={focusedPanel}
          data={rows}
          columns={columns}
          onClose={() => setFocusedPanelId(null)}
          onUpdate={changes => updatePanel(focusedPanel.id, changes)}
        />
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
