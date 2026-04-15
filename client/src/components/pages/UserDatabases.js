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

const UserDatabases = () => {
  const { handleSchemaChange } = useSchemaState();

  const {
    createNewState,
    loadDatabase,
    deleteDatabase,
    getDatabases,
  } = useDatabase();

  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatabaseList = async () => {
      const databases = await getDatabases();
      setList(databases);
    };
    fetchDatabaseList();
  }, []);

  const buttonHandler = (target, uuid, listIndex, databaseName) => {
    if (target === "load") {
      loadDatabase(uuid);
      navigate("/tables");
    }
    if (target === "delete") {
      deleteDatabase(databaseName, uuid);
      const newList = [...list];
      newList.splice(listIndex, 1);
      setList(newList);
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
                let uuid = JSON.parse(data.global_state).databaseUuid;
                let databaseName = JSON.parse(data.global_state).databaseName;
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
    </main>
  );
};

export default UserDatabases;
