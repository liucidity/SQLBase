import React, { useState, useEffect } from "react";
import useDatabase from "../../state/hooks/useDatabase";
import { useNavigate } from "react-router-dom";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import "./UserDatabases.scss";

const UserDatabases = () => {
  const { createNewState, loadDatabase, deleteDatabase, getDatabases } = useDatabase();
  const [list, setList] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", isError: false });
  const navigate = useNavigate();

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  useEffect(() => {
    const fetchDatabaseList = async () => {
      try {
        const databases = await getDatabases();
        setList(databases);
      } catch (err) {
        showSnackbar(err?.response?.data?.error || "Failed to load databases.", true);
      }
    };
    fetchDatabaseList();
  }, []);

  const handleLoad = async uuid => {
    try {
      await loadDatabase(uuid);
      navigate("/tables");
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to load database.", true);
    }
  };

  const handleDelete = async (databaseName, uuid, listIndex) => {
    try {
      await deleteDatabase(databaseName, uuid);
      setList(prev => prev.filter((_, i) => i !== listIndex));
      showSnackbar(`"${databaseName}" deleted.`);
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Failed to delete database.", true);
    }
  };

  const handleCreate = () => {
    createNewState();
    navigate("/tables");
  };

  const parsedList = list.map((data, index) => {
    let parsed;
    try { parsed = JSON.parse(data.global_state); } catch { return null; }
    if (!parsed) return null;
    return { ...parsed, _index: index, _raw: data };
  }).filter(Boolean);

  return (
    <main className="databases-canvas">
      <div className="databases-header">
        <div className="databases-header-left">
          <h1 className="databases-title">My Databases</h1>
          <span className="databases-count">
            {parsedList.length} database{parsedList.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button className="new-db-btn" onClick={handleCreate}>
          + New Database
        </button>
      </div>

      {parsedList.length === 0 ? (
        <div className="databases-empty">
          <div className="databases-empty-icon">🗄</div>
          <h2>No databases yet</h2>
          <p>Create your first database to get started.</p>
          <button className="new-db-btn" onClick={handleCreate}>
            + New Database
          </button>
        </div>
      ) : (
        <div className="databases-grid">
          {parsedList.map((db) => (
            <div key={db.databaseUuid} className="database-card">
              <div className="database-card-body">
                <div className="database-card-name">{db.databaseName}</div>
                <div className="database-card-meta">
                  <span className="db-status-badge active">active</span>
                  <span className="db-table-count">
                    {(db.schemaState || []).length} table{(db.schemaState || []).length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="database-card-actions">
                <button
                  className="db-load-btn"
                  onClick={() => handleLoad(db.databaseUuid)}
                >
                  Load →
                </button>
                <button
                  className="db-delete-btn"
                  onClick={() => handleDelete(db.databaseName, db.databaseUuid, db._index)}
                  title="Delete database"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SuccessSnackbar
        open={snackbar.open}
        message={snackbar.message}
        isError={snackbar.isError}
        handleClose={closeSnackbar}
      />
    </main>
  );
};

export default UserDatabases;
