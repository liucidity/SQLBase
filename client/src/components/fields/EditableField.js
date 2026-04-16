import { React, useState } from "react";
import { Typography, TextField, Box } from "@mui/material";

const DB_NAME_RE = /^[a-z0-9_]{1,63}$/;

function getNameError(name) {
  if (!name || name === "") return null;
  if (name.length > 63) return "Name must be 63 characters or fewer.";
  if (/[A-Z]/.test(name)) return "Use lowercase letters only.";
  if (/[^a-z0-9_]/.test(name)) return "Only letters, digits, and underscores are allowed.";
  if (/^[0-9]/.test(name)) return "Name must start with a letter or underscore.";
  return null;
}

const EditableField = props => {
  const [isNameFocused, setIsNamedFocused] = useState(false);
  const handleEditableField = focused => setIsNamedFocused(focused);
  const databaseName = props.state.databaseName;

  const error = getNameError(databaseName);
  const isValid = DB_NAME_RE.test(databaseName);

  return (
    <div id="schema-database-title">
      {!isNameFocused ? (
        <Typography
          sx={{ fontFamily: "Oxygen" }}
          onClick={() => handleEditableField(true)}
        >
          {databaseName}
        </Typography>
      ) : (
        <TextField
          sx={{ color: "#000", fontFamily: "Oxygen" }}
          autoFocus
          value={databaseName}
          onChange={e => props.handleChange(e, "databaseName")}
          onBlur={() => handleEditableField(false)}
          error={!!error}
        />
      )}
      {error && (
        <div style={{
          fontSize: "11px",
          color: "#b45309",
          background: "#fef9c3",
          border: "1px solid #fde68a",
          borderRadius: "4px",
          padding: "3px 8px",
          marginTop: "4px",
          maxWidth: "260px",
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default EditableField;
