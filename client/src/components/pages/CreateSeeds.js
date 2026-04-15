import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import "../forms/SeedsForm.scss";
import useSeedState from "../../state/hooks/useSeedState";
import useDatabase from "../../state/hooks/useDatabase";
import useGlobalState from "../../state/hooks/useGlobalState";
import { numRowsDropdown } from "../../state/data_structures/seedState";
import SeedsForm from "../forms/SeedsForm";
import SeedsModal from "../modal/SeedsModal";
import { CopyBlock, monokai } from "react-code-blocks";
import { generateSeedSQL } from "../../helpers/seedFormHelpers";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";

const CreateSeedsPage = () => {
  const { state, generateSeedState } = useSeedState();
  const { getTableNames } = useGlobalState();
  const { saveProgress, loadProgress, seedDatabase } = useDatabase();

  const tableNameList = getTableNames();
  const table = state.schemaState;
  const seeds = state.seedState;
  let seedString = generateSeedSQL(seeds);

  const [isOpen, setIsOpen] = useState({ modal: false, table: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const buttonHandler = table => setIsOpen({ modal: true, table });
  const handleClose = () => isOpen && setIsOpen(false);

  const handleSeed = async () => {
    try {
      await seedDatabase(state.databaseName, seedString);
      showSnackbar("Database seeded successfully.");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to seed database.", true);
    }
  };

  const handleSave = async () => {
    try {
      await saveProgress();
      showSnackbar("Progress saved.");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to save.", true);
    }
  };

  return (
    <main id="seedsMain">
      {isOpen.modal && (
        <SeedsModal
          id="seedsModal"
          open={isOpen}
          onClick={handleClose}
          table={isOpen.table}
          seeds={seeds}
        />
      )}

      <div id="seedsContainer">
        <form id="seedsForm">
          <label id="seedsFormTitle">Seed Database</label>
          <SeedsForm
            key="SeedsForm"
            tableNameList={tableNameList}
            numRowsDropdown={numRowsDropdown}
            table={table}
            buttonHandler={buttonHandler}
            dropDownHandler={generateSeedState}
          />
        </form>
        <div id="seedsDemo">
          <CopyBlock
            key="CopyBlock-seeds"
            language="sql"
            text={generateSeedSQL(seeds)}
            theme={monokai}
            wrapLines={true}
            codeBlock
          />
        </div>
      </div>

      <Box id="seeds-buttons">
        <Button
          variant="contained"
          color="primary"
          startIcon={<AutoFixHighIcon />}
          onClick={handleSeed}
        >
          Seed
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
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

      <SuccessSnackbar
        open={snackbar.open}
        message={snackbar.message}
        isError={snackbar.isError}
        handleClose={closeSnackbar}
      />
    </main>
  );
};

export default CreateSeedsPage;
