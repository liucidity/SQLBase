import React, { useState } from "react";
import { CopyBlock } from "react-code-blocks";
import { sqlTheme } from "../../helpers/sqlTheme";
import useSeedState from "../../state/hooks/useSeedState";
import useDatabase from "../../state/hooks/useDatabase";
import SeedsForm from "../forms/SeedsForm";
import SeedsModal from "../modal/SeedsModal";
import { generateSeedSQL } from "../../helpers/seedFormHelpers";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import "../forms/SeedsForm.scss";
import "../forms/SchemaForm.scss";

const CreateSeedsPage = () => {
  const { state, generateSeedState } = useSeedState();
  const { saveProgress, seedDatabase } = useDatabase();

  const table = state.schemaState;
  const seeds = state.seedState;
  const seedSQL = generateSeedSQL(seeds);

  const [isOpen, setIsOpen] = useState({ modal: false, table: null });
  const [seeding, setSeeding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const buttonHandler = t => setIsOpen({ modal: true, table: t });
  const handleClose = () => setIsOpen({ modal: false, table: null });

  const handleSeed = async () => {
    if (!state.databaseName) {
      showSnackbar("No database loaded.", true);
      return;
    }
    setSeeding(true);
    try {
      await seedDatabase(state.databaseName, seedSQL);
      showSnackbar("Database seeded successfully.");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to seed database.", true);
    } finally {
      setSeeding(false);
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(seedSQL);
      showSnackbar("SQL copied to clipboard.");
    } catch {
      showSnackbar("Failed to copy.", true);
    }
  };

  return (
    <main className="split-canvas">
      {isOpen.modal && (
        <SeedsModal
          open={isOpen}
          onClick={handleClose}
          table={isOpen.table}
          seeds={seeds}
        />
      )}

      {/* ── Left Panel ─────────────────────────────── */}
      <div className="split-left">
        <div className="split-left-header">
          <span className="split-db-name">{state.databaseName || "No database loaded"}</span>
        </div>

        <div className="tables-list">
          <SeedsForm
            table={table}
            buttonHandler={buttonHandler}
            dropDownHandler={generateSeedState}
          />

          <button
            className="seed-all-btn"
            onClick={handleSeed}
            disabled={seeding || !table || table.length === 0}
          >
            {seeding ? "Seeding…" : "⚡ Seed All Tables"}
          </button>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="split-right">
        <div className="split-right-header">
          <span className="right-panel-title">SQL Preview</span>
        </div>

        <div className="sql-panel">
          <CopyBlock
            language="sql"
            text={seedSQL || "-- Configure tables and row counts to preview INSERT SQL"}
            theme={sqlTheme}
            wrapLines={true}
            codeBlock
          />
        </div>

        <div className="right-panel-actions">
          <button className="action-btn" onClick={handleCopy}>⎘ Copy SQL</button>
          <button className="action-btn" onClick={handleSave}>↑ Save</button>
        </div>
      </div>

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
