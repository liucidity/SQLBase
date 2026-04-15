import { React, useState, useEffect } from "react";
import { Button, Container } from "@mui/material";
import useDatabase from "../../state/hooks/useDatabase";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@emotion/react";
import theme from "../../styles/theme/theme.js";
import useSchemaState from "../../state/hooks/useSchemaState";
import "./UserDatabases.scss";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";

const UserDatabases = () => {
  const { handleSchemaChange } = useSchemaState();

  const {
    createNewState,
    loadDatabase,
    deleteDatabase,
    getDatabases,
  } = useDatabase();

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

  const buttonHandler = async (target, uuid, listIndex, databaseName) => {
    if (target === "load") {
      try {
        await loadDatabase(uuid);
        navigate("/tables");
      } catch (err) {
        showSnackbar(err?.response?.data?.error || "Failed to load database.", true);
      }
    }
    if (target === "delete") {
      try {
        await deleteDatabase(databaseName, uuid);
        const newList = [...list];
        newList.splice(listIndex, 1);
        setList(newList);
        showSnackbar(`"${databaseName}" deleted.`);
      } catch (err) {
        showSnackbar(err?.response?.data?.error || "Failed to delete database.", true);
      }
    }
    if (target === "create") {
      createNewState();
      navigate("/tables");
    }
  };

  return (
    <main>
      <ThemeProvider theme={theme}>
        <Container id="user-database-container" maxWidth="false">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon />}
            onClick={() => buttonHandler("create")}
          >
            New Database
          </Button>

          <div id="database-list">
            {list &&
              list.map((data, listIndex) => {
                let parsed;
                try { parsed = JSON.parse(data.global_state); } catch { return null; }
                if (!parsed) return null;
                const uuid = parsed.databaseUuid;
                const databaseName = parsed.databaseName;
                return (
                  <div className="database-items" key={uuid}>
                    <div className="database-name">
                      <h3>{databaseName}</h3>
                    </div>
                    <div className="database-buttons">
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => buttonHandler("load", uuid)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteForeverIcon />}
                        onClick={() =>
                          buttonHandler("delete", uuid, listIndex, databaseName)
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </Container>
      </ThemeProvider>

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
