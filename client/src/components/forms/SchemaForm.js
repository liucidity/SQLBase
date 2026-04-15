import React, { useState, useRef, useEffect } from "react";
import "./SchemaForm.scss";

const TYPE_OPTIONS = [
  { value: "INT",       label: "INT",     icon: "123", colorClass: "type-numeric" },
  { value: "BIGINT",    label: "BIGINT",  icon: "##",  colorClass: "type-numeric" },
  { value: "SERIAL",    label: "SERIAL",  icon: "∑",   colorClass: "type-numeric" },
  { value: "DECIMAL",   label: "DECIMAL", icon: "%",   colorClass: "type-numeric" },
  { value: "NUMERIC",   label: "NUM",     icon: "≈",   colorClass: "type-numeric" },
  { value: "FLOAT",     label: "FLOAT",   icon: "~",   colorClass: "type-numeric" },
  { value: "VARCHAR",   label: "VARCHAR", icon: "Aa",  colorClass: "type-text" },
  { value: "TEXT",      label: "TEXT",    icon: "¶",   colorClass: "type-text" },
  { value: "BOOLEAN",   label: "BOOL",    icon: "✓",   colorClass: "type-bool" },
  { value: "DATE",      label: "DATE",    icon: "📅",  colorClass: "type-date" },
  { value: "TIMESTAMP", label: "TIME",    icon: "⏱",  colorClass: "type-date" },
  { value: "UUID",      label: "UUID",    icon: "🔑",  colorClass: "type-uuid" },
];

const CHIP_CONSTRAINTS = ["NOT NULL", "UNIQUE", "PRIMARY KEY"];

function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function TypePill({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const selected = TYPE_OPTIONS.find(t => t.value === value);

  return (
    <div className={`type-pill-wrap${disabled ? " disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className={`type-pill${selected ? ` ${selected.colorClass}` : ""}`}
        onClick={() => !disabled && setOpen(o => !o)}
        title={disabled ? "Type set by FK reference" : "Choose type"}
      >
        <span className="type-pill-icon">{selected ? selected.icon : "?"}</span>
        <span className="type-pill-label">{selected ? selected.label : "Type"}</span>
      </button>
      {open && (
        <div className="type-popover">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t.value}
              type="button"
              className={`type-opt ${t.colorClass}${t.value === value ? " selected" : ""}`}
              onClick={() => { onChange(t.value); setOpen(false); }}
            >
              <span className="type-opt-icon">{t.icon}</span>
              <span className="type-opt-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConstraintChips({ field, tableIndex, fieldIndex, handleChange, references }) {
  const [fkOpen, setFKOpen] = useState(false);
  const fkRef = useRef(null);
  useClickOutside(fkRef, () => setFKOpen(false));

  const activeConstraints = [field.mod1, field.mod2].filter(Boolean);
  const hasFK = Boolean(field.reference);

  const toggleConstraint = constraint => {
    if (field.mod1 === constraint) {
      handleChange({ target: { value: "" } }, "mod1", tableIndex, fieldIndex);
    } else if (field.mod2 === constraint) {
      handleChange({ target: { value: "" } }, "mod2", tableIndex, fieldIndex);
    } else if (!field.mod1) {
      handleChange({ target: { value: constraint } }, "mod1", tableIndex, fieldIndex);
    } else if (!field.mod2) {
      handleChange({ target: { value: constraint } }, "mod2", tableIndex, fieldIndex);
    }
  };

  const chipLabel = c => c === "PRIMARY KEY" ? "PK" : c === "NOT NULL" ? "NN" : c;

  return (
    <div className="constraint-chips">
      {CHIP_CONSTRAINTS.map(c => (
        <button
          key={c}
          type="button"
          className={`constraint-chip${activeConstraints.includes(c) ? " active" : ""}`}
          onClick={() => toggleConstraint(c)}
          title={c}
        >
          {chipLabel(c)}
        </button>
      ))}
      <div className="fk-wrap" ref={fkRef}>
        <button
          type="button"
          className={`constraint-chip fk-chip${hasFK ? " active" : ""}`}
          onClick={() => setFKOpen(o => !o)}
          title={hasFK ? `References: ${field.reference}` : "Add foreign key"}
        >
          FK →
        </button>
        {fkOpen && (
          <div className="fk-popover">
            <div className="fk-label">References table:</div>
            {references.filter(r => r.value !== "").map(ref => (
              <button
                key={ref.value}
                type="button"
                className={`fk-opt${field.reference === ref.value ? " selected" : ""}`}
                onClick={() => {
                  handleChange({ target: { value: ref.value } }, "reference", tableIndex, fieldIndex);
                  setFKOpen(false);
                }}
              >
                {ref.label}
              </button>
            ))}
            {hasFK && (
              <>
                <div className="fk-label" style={{ paddingTop: 10 }}>Relationship:</div>
                <div className="rel-type-selector">
                  {[
                    { value: 'one-to-one',   label: '1 : 1' },
                    { value: 'one-to-many',  label: '1 : N' },
                    { value: 'many-to-many', label: 'N : M' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`rel-type-btn${(field.relationType || 'one-to-many') === opt.value ? ' active' : ''}`}
                      onClick={() =>
                        handleChange({ target: { value: opt.value } }, "relationType", tableIndex, fieldIndex)
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="fk-opt fk-clear"
                  onClick={() => {
                    handleChange({ target: { value: "" } }, "reference", tableIndex, fieldIndex);
                    setFKOpen(false);
                  }}
                >
                  Clear FK
                </button>
              </>
            )}
            {references.filter(r => r.value !== "").length === 0 && (
              <span className="fk-empty">No other tables yet</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRow({ field, fieldIndex, tableIndex, handleChange, removeField, references }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="field-row-wrap">
      <div className="field-row">
        <input
          type="text"
          className="field-name-input"
          placeholder="field_name"
          value={field.fieldName}
          onChange={e => handleChange(e, "fieldName", tableIndex, fieldIndex)}
        />
        <TypePill
          value={field.dataType}
          disabled={Boolean(field.reference)}
          onChange={val =>
            handleChange({ target: { value: val } }, "dataType", tableIndex, fieldIndex)
          }
        />
        <ConstraintChips
          field={field}
          tableIndex={tableIndex}
          fieldIndex={fieldIndex}
          handleChange={handleChange}
          references={references}
        />
        <button
          type="button"
          className={`advanced-btn${showAdvanced ? " open" : ""}`}
          onClick={() => setShowAdvanced(o => !o)}
          title="Advanced options"
        >
          ⋯
        </button>
        <button
          type="button"
          className="field-remove-btn"
          onClick={() => removeField(tableIndex, fieldIndex)}
          title="Remove field"
        >
          ×
        </button>
      </div>

      {showAdvanced && (
        <div className="field-advanced">
          <label>Default</label>
          <input
            type="text"
            placeholder="default value"
            value={field.default || ""}
            onChange={e => handleChange(e, "default", tableIndex, fieldIndex)}
          />
          {field.dataType === "VARCHAR" && (
            <>
              <label>Length</label>
              <input
                type="number"
                placeholder="255"
                value={field.varcharSize || ""}
                onChange={e =>
                  handleChange(e, "varcharSize", tableIndex, fieldIndex)
                }
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

const SchemaForm = ({
  table,
  tableIndex,
  handleChange,
  addField,
  removeField,
  references,
  removeTable,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <div className="schema-table-card">
      <div className="table-card-header">
        <input
          type="text"
          className="table-name-input"
          placeholder="table_name"
          value={table.table}
          onChange={e => handleChange(e, "tableName", tableIndex)}
        />
        <div className="table-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="table-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            title="Table options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="table-menu-dropdown">
              <button
                type="button"
                className="table-menu-item danger"
                onClick={() => { removeTable(tableIndex); setMenuOpen(false); }}
              >
                Delete Table
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="fields-list">
        {table.fields.map((field, fieldIndex) => (
          <FieldRow
            key={fieldIndex}
            field={field}
            fieldIndex={fieldIndex}
            tableIndex={tableIndex}
            handleChange={handleChange}
            removeField={removeField}
            references={references}
          />
        ))}
      </div>

      <button
        type="button"
        className="add-field-btn"
        onClick={() => addField(tableIndex)}
      >
        + Add Field
      </button>
    </div>
  );
};

export default SchemaForm;
