import React, { useState } from "react";
import Slider from "@mui/material/Slider";

function SeedTableRow({ table, dropDownHandler, buttonHandler }) {
  const [numRows, setNumRows] = useState(10);

  const handleChange = val => {
    setNumRows(val);
    dropDownHandler(table.table, val);
  };

  return (
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
        className="seed-preview-btn"
        onClick={() => buttonHandler(table)}
      >
        Preview
      </button>
    </div>
  );
}

const SeedsForm = ({ table, buttonHandler, dropDownHandler }) => {
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
        />
      ))}
    </div>
  );
};

export default SeedsForm;
