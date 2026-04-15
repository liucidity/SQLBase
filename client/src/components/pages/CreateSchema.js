import { React, useState } from "react";
import { CopyBlock, monokai } from "react-code-blocks";
import { Button, Box } from "@mui/material";
import SchemaForm from "../forms/SchemaForm";
import useSchemaState from "../../state/hooks/useSchemaState";
import useDatabase from "../../state/hooks/useDatabase";
import ERDModal from "../modal/ERDModal";
import {
  generateSQL,
  generateReferenceObject,
} from "../../helpers/schemaFormHelpers";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import "../forms/SchemaForm.scss";
import EditableField from "../fields/EditableField";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";
import LanIcon from "@mui/icons-material/Lan";

const CreateSchemaPage = () => {
  const {
    state,
    addSchemaTable,
    removeSchemaTable,
    addSchemaField,
    removeSchemaField,
    handleSchemaChange,
  } = useSchemaState();

  const { saveProgress, loadProgress, createDatabase } = useDatabase();

  const [isNameFocused, setIsNamedFocused] = useState(false);
  const [isOpen, setIsOpen] = useState({
    modal: false,
    copy: false,
    save: false,
    load: false,
    create: false,
    addTable: false,
    message: null,
  });

  const buttonHandler = target => {
    switch (target) {
      case "modal":
        setIsOpen({ modal: true });
        break;
      case "copy":
        setIsOpen({ copy: true, message: "Copy Success!" });
        copyHandler();
        break;
      case "save":
        setIsOpen({ save: true, message: "Save Success!" });
        saveProgress();
        break;
      case "createDB":
        setIsOpen({ create: true, message: "Database Created!" });
        let allStrings = generateSQL(state.schemaState);
        createDatabase(allStrings.join(""));
        break;
      case "addTable":
        setIsOpen({ addTable: true, message: "Table Added" });
        addSchemaTable();
        break;
      default:
        return false;
    }
  };

  const handleClose = () => isOpen && setIsOpen(false);
  const handleEditableField = focused => setIsNamedFocused(focused);

  const copyHandler = () => {
    let allStrings = generateSQL(state.schemaState);
    return navigator.clipboard.writeText(allStrings.join(""));
  };

  return (
    <main onClick={handleClose}>
      <div id="container">
        <EditableField
          focused={isNameFocused}
          handleChange={handleSchemaChange}
          focus={handleEditableField}
          state={state}
        />

        {isOpen.modal && (
          <ERDModal
            open={isOpen}
            table={state.schemaState}
            onClick={handleClose}
          />
        )}
        {isOpen && !isOpen.modal && (
          <SuccessSnackbar
            open={isOpen}
            table={state}
            handleClose={handleClose}
            message={isOpen.message}
          />
        )}

        {state.schemaState.map((table, tableIndex) => (
          <div id="row-container" key={`row-${tableIndex}`}>
            <form>
              <SchemaForm
                key={`SchemaForm-${tableIndex}`}
                table={table}
                tableIndex={tableIndex}
                handleChange={handleSchemaChange}
                removeField={removeSchemaField}
                addField={addSchemaField}
                references={generateReferenceObject(state.schemaState, table)}
                removeTable={removeSchemaTable}
              />
            </form>
            <div className="schema-demo">
              <CopyBlock
                key={`CopyBlock-${tableIndex}`}
                language="sql"
                text={generateSQL(state.schemaState)[tableIndex]}
                theme={monokai}
                wrapLines={true}
                codeBlock
              />
            </div>
          </div>
        ))}

        <Box id="add-copy-buttons">
          <Button
            id="add-table"
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => buttonHandler("addTable")}
          >
            Add Table
          </Button>
          <Button
            id="copy-all"
            variant="outlined"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={() => buttonHandler("copy")}
          >
            Copy All Schema
          </Button>
        </Box>
      </div>

      <Box id="schema-buttons">
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LanIcon />}
          onClick={() => buttonHandler("modal")}
        >
          View ERD
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={() => buttonHandler("save")}
        >
          Save
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleIcon />}
          onClick={() => buttonHandler("createDB")}
        >
          Create
        </Button>
      </Box>
    </main>
  );
};

export default CreateSchemaPage;
