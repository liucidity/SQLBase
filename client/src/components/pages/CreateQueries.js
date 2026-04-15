import React from "react";
import { CopyBlock, monokai } from "react-code-blocks";
import { Button, Box } from "@mui/material";
import QueriesForm from "../forms/QueriesForm";
import "../forms/QueriesForm.scss";
import generateQuerySQL from "../../helpers/queryFormHelpers";
import useQueryState from "../../state/hooks/useQueryState";
import useDatabase from "../../state/hooks/useDatabase";
import useGlobalState from "../../state/hooks/useGlobalState";
import SaveIcon from "@mui/icons-material/Save";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";

const CreateQueriesPage = () => {
  const {
    state,
    addQueryTable,
    removeQueryTable,
    selectTableHandler,
    setQueryParams,
  } = useQueryState();

  const { getTableNames, getColumnList } = useGlobalState();
  const { saveProgress, loadProgress, queryDatabase } = useDatabase();

  const tableNameList = getTableNames();
  let schemas = state.queryState[0].schemas;
  let queries = state.queryState[0].queries;

  const copyHandler = () => {
    let allStrings = generateQuerySQL(queries);
    return navigator.clipboard.writeText(allStrings.join(""));
  };

  return (
    <main>
      <div id="container">
        <div id="query-database-title">
          <p>{state.databaseName}</p>
        </div>

        {schemas.map((table, tableIndex) => (
          <div id="row-container" key={`row-${tableIndex}`}>
            <form>
              <QueriesForm
                key={`QueriesForm-${tableIndex}`}
                table={table}
                tableIndex={tableIndex}
                handleChange={selectTableHandler}
                tableNameList={tableNameList}
                removeQuery={removeQueryTable}
                getColumnList={getColumnList}
                handleQuery={setQueryParams}
                queries={queries}
                state={state}
              />
            </form>
            <div className="query-demo">
              <CopyBlock
                key={`CopyBlock-${tableIndex}`}
                language="sql"
                text={generateQuerySQL(queries)[tableIndex]}
                theme={monokai}
                wrapLines={true}
                codeBlock
              />
            </div>
          </div>
        ))}

        <Box id="query-add-copy-buttons">
          <Button
            id="queries-add-table"
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => addQueryTable()}
          >
            Add Table
          </Button>
          <Button
            id="queries-copy-all"
            variant="outlined"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={() => copyHandler()}
          >
            Copy All Queries
          </Button>
        </Box>
      </div>

      <Box id="query-buttons">
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={() => saveProgress()}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={() => loadProgress()}
        >
          Load
        </Button>
      </Box>
    </main>
  );
};

export default CreateQueriesPage;
