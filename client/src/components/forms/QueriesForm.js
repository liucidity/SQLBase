import React, { useState } from "react";
import "./QueriesForm.scss";
import CircularProgress from "@mui/material/CircularProgress";
import useDatabase from "../../state/hooks/useDatabase";
import useQueryState from "../../state/hooks/useQueryState";
import generateQuerySQL from "../../helpers/queryFormHelpers";

const AGGREGATES = ["SUM", "AVG", "COUNT", "MAX", "MIN"];

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
  removeQuery,
  tableNameList,
  getColumnList,
  handleQuery,
  onRunQuery,
  queryLoading,
  queryResults,
}) => {
  const { state } = useQueryState();
  const query = queries[tableIndex] || {};
  const columns = query.columns || [];
  const availableCols = getColumnList(table).filter(c => c.value !== "none");

  const addColumn = colName => {
    if (!columns.includes(colName)) {
      handleQuery({ target: { value: colName } }, tableIndex, "columns", columns.length);
    }
  };

  const removeColumn = colIndex => {
    handleQuery({ target: { value: "none" } }, tableIndex, "columns", colIndex);
  };

  const setAggregate = (colIndex, agg) => {
    handleQuery({ target: { value: agg || "none" } }, tableIndex, "aggregate", colIndex);
  };

  const addWhereCondition = () => {
    const idx = (query.whereCondition || []).length;
    handleQuery({ target: { value: "" } }, tableIndex, "whereCondition", idx);
  };

  const setWhereCondition = (idx, val) => {
    handleQuery({ target: { value: val } }, tableIndex, "whereCondition", idx);
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
          {tableNameList.map(t => (
            <button
              key={t.value}
              type="button"
              className={`table-chip${table.table === t.value ? " active" : ""}`}
              onClick={() => handleChange({ target: { value: t.value } }, tableIndex)}
            >
              {t.label}
            </button>
          ))}
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

          {/* Available columns to add */}
          <div className="col-add-row">
            {availableCols.map(col => (
              <button
                key={col.value}
                type="button"
                className={`col-available-chip${columns.includes(col.value) ? " added" : ""}`}
                onClick={() => addColumn(col.value)}
                title={columns.includes(col.value) ? "Already selected" : `Add ${col.value}`}
              >
                {col.label}
              </button>
            ))}
            {availableCols.length === 0 && (
              <span className="query-empty-hint">Select a table first</span>
            )}
          </div>

          {/* Selected columns with aggregate options */}
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
          {(query.whereCondition || []).map((cond, idx) => (
            <div key={idx} className="condition-row">
              <input
                type="text"
                className="condition-input"
                placeholder={`e.g. age > 18${idx > 0 ? " AND …" : ""}`}
                value={cond || ""}
                onChange={e => setWhereCondition(idx, e.target.value)}
              />
              <button
                type="button"
                className="condition-remove-btn"
                onClick={() => removeWhereCondition(idx)}
                title="Remove condition"
              >
                ×
              </button>
            </div>
          ))}
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
