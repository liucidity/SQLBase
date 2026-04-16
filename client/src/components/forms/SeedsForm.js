import React, { useState } from "react";
import Slider from "@mui/material/Slider";
import { SEED_CATEGORIES, NUMERIC_CATEGORIES, inferSeedType } from "../../helpers/seedTypeHelpers";

const categoryOptions = Object.entries(SEED_CATEGORIES).map(([key, { label }]) => ({
  value: key,
  label,
}));

function FieldConfigRow({ field, tableName, fieldConfig, onConfigChange }) {
  const inferredType = inferSeedType(field.fieldName, field.dataType);
  const saved = fieldConfig[field.fieldName] || {};
  const activeType = saved.seedType || inferredType;
  const isOverridden = !!saved.seedType && saved.seedType !== inferredType;
  const isNumeric = NUMERIC_CATEGORIES.has(activeType);

  const handleTypeChange = e => {
    const next = e.target.value;
    onConfigChange(field.fieldName, next, saved.min, saved.max);
  };

  const handleMinChange = e => {
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    onConfigChange(field.fieldName, activeType, val, saved.max);
  };

  const handleMaxChange = e => {
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    onConfigChange(field.fieldName, activeType, saved.min, val);
  };

  return (
    <div className="seed-field-row">
      <span className="seed-field-name">{field.fieldName}</span>
      <span className="seed-field-datatype">{field.dataType}</span>

      <div className="seed-field-type-wrap">
        {!isOverridden && (
          <span className="seed-inferred-badge">inferred</span>
        )}
        <select
          className="seed-type-select"
          value={activeType}
          onChange={handleTypeChange}
        >
          {categoryOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isNumeric && (
        <div className="seed-range-wrap">
          <input
            type="number"
            className="seed-range-input"
            placeholder="min"
            value={saved.min ?? ""}
            onChange={handleMinChange}
          />
          <span className="seed-range-sep">–</span>
          <input
            type="number"
            className="seed-range-input"
            placeholder="max"
            value={saved.max ?? ""}
            onChange={handleMaxChange}
          />
        </div>
      )}
    </div>
  );
}

function SeedTableRow({ table, dropDownHandler, buttonHandler, fieldConfig, onConfigChange }) {
  const [numRows, setNumRows] = useState(10);
  const [expanded, setExpanded] = useState(false);

  const handleChange = val => {
    setNumRows(val);
    if (table.table) dropDownHandler(table.table, val);
  };

  return (
    <div className={`seed-table-card${expanded ? " expanded" : ""}`}>
      <div className="seed-table-row">
        <span className="seed-table-name">{table.table}</span>
        <div className="seed-slider-wrap">
          <Slider
            value={numRows}
            onChange={(_, val) => handleChange(val)}
            min={1}
            max={500}
            size="small"
            sx={{ color: "var(--accent)", padding: "10px 0" }}
          />
        </div>
        <input
          type="number"
          className="seed-rows-input"
          value={numRows}
          min={1}
          max={500}
          onChange={e => {
            const val = Math.min(500, Math.max(1, Number(e.target.value) || 1));
            handleChange(val);
          }}
        />
        <span className="seed-rows-label">rows</span>
        <button
          type="button"
          className="seed-configure-btn"
          title="Configure field generators"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? "▲ Fields" : "▼ Fields"}
        </button>
        <button
          type="button"
          className="seed-preview-btn"
          onClick={() => buttonHandler(table)}
        >
          Preview
        </button>
      </div>

      {expanded && table.fields && table.fields.length > 0 && (
        <div className="seed-fields-panel">
          <div className="seed-fields-header">
            <span>Field</span>
            <span>Type</span>
            <span>Generator</span>
            <span>Range</span>
          </div>
          {table.fields.map(field => (
            <FieldConfigRow
              key={field.fieldName}
              field={field}
              tableName={table.table}
              fieldConfig={fieldConfig}
              onConfigChange={onConfigChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SeedsForm = ({ table, buttonHandler, dropDownHandler, seedFieldConfig, onFieldConfigChange }) => {
  if (!table || table.length === 0) {
    return (
      <div className="seed-empty">
        No tables defined yet — build a schema first.
      </div>
    );
  }

  return (
    <div className="seeds-config-list">
      {table.map((t, i) => (
        <SeedTableRow
          key={t.table || i}
          table={t}
          dropDownHandler={dropDownHandler}
          buttonHandler={buttonHandler}
          fieldConfig={(seedFieldConfig || {})[t.table] || {}}
          onConfigChange={(fieldName, seedType, min, max) =>
            onFieldConfigChange(t.table, fieldName, seedType, min, max)
          }
        />
      ))}
    </div>
  );
};

export default SeedsForm;
