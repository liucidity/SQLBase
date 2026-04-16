import React, { useState } from "react";
import "./QueriesForm.scss";
import CircularProgress from "@mui/material/CircularProgress";

const AGGREGATES = ["SUM", "AVG", "COUNT", "MAX", "MIN"];
const NO_VALUE_OPS = ["IS NULL", "IS NOT NULL", "IS TRUE", "IS FALSE"];

function getOperatorsForType(dataType) {
  if (!dataType) return ["=", "!=", "LIKE", "IS NULL", "IS NOT NULL"];
  const dt = dataType.toLowerCase();
  if (
    ["int", "numeric", "float", "decimal", "double", "real", "bigint", "smallint"].some(t =>
      dt.includes(t)
    )
  ) {
    return ["=", "!=", ">", "<", ">=", "<=", "IS NULL", "IS NOT NULL"];
  }
  if (dt.includes("bool")) return ["IS TRUE", "IS FALSE", "IS NULL", "IS NOT NULL"];
  if (dt.includes("date") || dt.includes("timestamp") || dt.includes("time")) {
    return ["=", "!=", ">", "<", ">=", "<=", "IS NULL", "IS NOT NULL"];
  }
  if (dt.includes("uuid")) return ["=", "!=", "IS NULL", "IS NOT NULL"];
  return ["=", "!=", "LIKE", "ILIKE", "IS NULL", "IS NOT NULL"];
}

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`query-section${open ? " open" : ""}`}>
      <button type="button" className="section-toggle" onClick={() => setOpen(o => !o)}>
        <span className="section-chevron">{open ? "▾" : "▸"}</span>
        {title}
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

const QueriesForm = ({
  table,
  queries,
  tableIndex,
  handleChange,
  clearTable,
  removeQuery,
  tableNameList,
  getColumnList,
  handleQuery,
}) => {
  const query = queries[tableIndex] || {};
  const columns = query.columns || [];
  const availableCols = getColumnList(table).filter(c => c.value !== "none");

  const addOrRemoveColumn = colName => {
    const colIdx = columns.indexOf(colName);
    if (colIdx !== -1) {
      // already selected — remove it
      handleQuery({ target: { value: "none" } }, tableIndex, "columns", colIdx);
    } else {
      handleQuery({ target: { value: colName } }, tableIndex, "columns", columns.length);
    }
  };

  const setAggregate = (colIndex, agg) => {
    handleQuery({ target: { value: agg || "none" } }, tableIndex, "aggregate", colIndex);
  };

  const removeColumn = colIndex => {
    handleQuery({ target: { value: "none" } }, tableIndex, "columns", colIndex);
  };

  const addWhereCondition = () => {
    const idx = (query.whereCondition || []).length;
    handleQuery(
      { target: { value: { column: "", dataType: "", operator: "=", value: "" } } },
      tableIndex,
      "whereCondition",
      idx
    );
  };

  const setWhereFilter = (idx, filter) => {
    handleQuery({ target: { value: filter } }, tableIndex, "whereCondition", idx);
  };

  const removeWhereCondition = idx => {
    handleQuery({ target: { value: null } }, tableIndex, "whereCondition", idx);
  };

  const addOrderBy = colName => {
    handleQuery({ target: { value: colName } }, tableIndex, "orderBy", 0);
  };

  const setOrder = val => {
    handleQuery({ target: { value: val } }, tableIndex, "order");
  };

  const setLimit = val => {
    handleQuery({ target: { value: val } }, tableIndex, "limit");
  };

  return (
    <div className="query-builder-card">
      {/* Table selector row */}
      <div className="query-card-header">
        <span className="query-card-table-label">Table</span>
        <div className="table-chip-row">
          {tableNameList.map(t => {
            const isActive = table.table === t.value;
            return (
              <button
                key={t.value}
                type="button"
                className={`table-chip${isActive ? " active" : ""}`}
                onClick={() => isActive ? clearTable(tableIndex) : handleChange(t.value, tableIndex)}
                title={isActive ? `Deselect ${t.label}` : `Select ${t.label}`}
              >
                {t.label}
              </button>
            );
          })}
          {tableNameList.length === 0 && (
            <span className="query-empty-hint">No tables defined yet — build a schema first.</span>
          )}
        </div>
        <button
          type="button"
          className="query-remove-btn"
          onClick={() => removeQuery(tableIndex)}
          title="Remove this query"
        >
          ×
        </button>
      </div>

      {/* Columns section */}
      {table.table && (
        <div className="query-columns-section">
          <div className="query-section-label">Columns</div>

          <div className="col-add-row">
            {availableCols.map(col => {
              const isAdded = columns.includes(col.value);
              return (
                <button
                  key={col.value}
                  type="button"
                  className={`col-available-chip${isAdded ? " added" : ""}`}
                  onClick={() => addOrRemoveColumn(col.value)}
                  title={isAdded ? `Remove ${col.value}` : `Add ${col.value}`}
                >
                  {col.label}
                  {isAdded && <span className="col-chip-remove">×</span>}
                </button>
              );
            })}
            {availableCols.length === 0 && (
              <span className="query-empty-hint">Select a table first</span>
            )}
          </div>

          {columns.length > 0 && (
            <div className="selected-cols-list">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="selected-col-row">
                  <span className="selected-col-name">{col}</span>
                  <div className="agg-chips">
                    {AGGREGATES.map(agg => (
                      <button
                        key={agg}
                        type="button"
                        className={`agg-chip${(query.aggregate || [])[colIdx] === agg ? " active" : ""}`}
                        onClick={() =>
                          setAggregate(colIdx, (query.aggregate || [])[colIdx] === agg ? "" : agg)
                        }
                      >
                        {agg}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="col-remove-btn"
                    onClick={() => removeColumn(colIdx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WHERE section */}
      <CollapsibleSection title="WHERE">
        <div className="where-conditions">
          {(query.whereCondition || []).map((cond, idx) => {
            const condObj = typeof cond === "string"
              ? { column: "", dataType: "", operator: "=", value: cond }
              : (cond || { column: "", dataType: "", operator: "=", value: "" });
            const colInfo = availableCols.find(c => c.value === condObj.column);
            const ops = getOperatorsForType(colInfo?.dataType || condObj.dataType);
            const noValue = NO_VALUE_OPS.includes(condObj.operator);

            return (
              <div key={idx} className="condition-row structured">
                <select
                  className="condition-col-select"
                  value={condObj.column || ""}
                  onChange={e => {
                    const col = availableCols.find(c => c.value === e.target.value);
                    const newOps = getOperatorsForType(col?.dataType);
                    setWhereFilter(idx, {
                      column: e.target.value,
                      dataType: col?.dataType || "",
                      operator: newOps[0],
                      value: "",
                    });
                  }}
                >
                  <option value="">column…</option>
                  {availableCols.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                {condObj.column && (
                  <select
                    className="condition-op-select"
                    value={condObj.operator || "="}
                    onChange={e =>
                      setWhereFilter(idx, { ...condObj, operator: e.target.value, value: "" })
                    }
                  >
                    {ops.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                )}

                {condObj.column && !noValue && (
                  <input
                    type="text"
                    className="condition-input"
                    placeholder="value…"
                    value={condObj.value || ""}
                    onChange={e =>
                      setWhereFilter(idx, { ...condObj, value: e.target.value })
                    }
                  />
                )}

                <button
                  type="button"
                  className="condition-remove-btn"
                  onClick={() => removeWhereCondition(idx)}
                  title="Remove condition"
                >
                  ×
                </button>
              </div>
            );
          })}
          <button type="button" className="add-condition-btn" onClick={addWhereCondition}>
            + Add Condition
          </button>
        </div>
      </CollapsibleSection>

      {/* ORDER BY section */}
      <CollapsibleSection title="ORDER BY">
        <div className="orderby-row">
          <div className="orderby-chips">
            {availableCols.map(col => (
              <button
                key={col.value}
                type="button"
                className={`orderby-chip${(query.orderBy || [])[0] === col.value ? " active" : ""}`}
                onClick={() => addOrderBy(col.value)}
              >
                {col.label}
              </button>
            ))}
          </div>
          <div className="order-direction">
            {["ASC", "DESC"].map(dir => (
              <button
                key={dir}
                type="button"
                className={`direction-btn${query.order === dir ? " active" : ""}`}
                onClick={() => setOrder(dir)}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* LIMIT row */}
      <div className="limit-row">
        <label className="limit-label">LIMIT</label>
        <input
          type="number"
          className="limit-input"
          placeholder="1000"
          min={1}
          value={query.limit === 1000 ? "" : query.limit || ""}
          onChange={e => setLimit(e.target.value ? Number(e.target.value) : 1000)}
        />
      </div>
    </div>
  );
};

export default QueriesForm;
