import { useContext } from "react";
import { GlobalContext } from "../GlobalStateProvider";
import axios from "axios";

import { LOAD_DB_TO_STATE, CREATE_NEW_STATE } from "../reducers/globalReducer";

// Send cookies with every request
axios.defaults.withCredentials = true;

const useDatabase = () => {
  const [state, dispatch] = useContext(GlobalContext);

  const loadData = loadedData =>
    dispatch({ type: LOAD_DB_TO_STATE, loadedData });
  //creates new unique state with uuid
  const createNewState = uuid => dispatch({ type: CREATE_NEW_STATE, uuid });

  /**
   * Save/load progress:  User can save the current global state (all schema, queries, seeds)
   * @param {integer} id the user's id (**STRETCH**)
   * @param {object} state the tables data
   * @returns an axios call to save/load current progress
   */

  //save state progress
  const saveProgress = () => {
    const globalStateString = JSON.stringify(state);
    const databaseName = state.databaseName;
    const databaseUuid = state.databaseUuid;
    return axios
      .post(`/api/tables`, {
        databaseName,
        globalStateString,
        databaseUuid,
      })
      .then(data => console.log("Save successful: ", data));
  };
  // unused: loads last created state into state
  const loadProgress = () => {
    return axios
      .get(`/api/tables`) // add ${id} to route if we have multiple users
      .then(data => {
        console.log(
          "Data Loaded from DB: ",
          JSON.parse(data.data[0]["global_state"])
        );
        const globalStateString = JSON.parse(data.data[0]["global_state"]);
        loadData(globalStateString);
      })
      .catch(err => {
        console.log("Error loading: ", err);
      });
  };

  //loads target database/saved state into state
  const loadDatabase = uuid => {
    console.log(uuid);

    return axios
      .get(`/api/tables`, { params: { uuid } }) // add ${id} to route if we have multiple users
      .then(data => {
        console.log(data.data);
        console.log("Loading log: ", JSON.parse(data.data[0]["global_state"]));
        const globalStateString = JSON.parse(data.data[0]["global_state"]);
        loadData(globalStateString);
      })
      .catch(err => {
        console.log("Error loading: ", err);
      });
  };

  // get current user

  // saves progress, creates new pgsql database, and creates tables from schema string
  const createDatabase = async schemaString => {
    const globalStateString = state;
    await saveProgress();
    await axios.put(`/api/databases`, { globalStateString });
    await axios.put(`/api/virtualDatabases`, { globalStateString, schemaString });
  };

  const deleteDatabase = async (databaseName, databaseUuid) => {
    return axios
      .all([
        await axios.post(`/api/databases`, { databaseName }),
        await axios.delete(`/api/tables`, { params: { databaseUuid } }),
      ])
      .then(
        axios.spread((dropDBData, removeStateData) => {
          console.log("post dropDBData", dropDBData);
          console.log("delete removeStateData", removeStateData);
        })
      )
      .catch(err => {
        console.log("Error loading: ", err);
      });
  };

  //inserts into virtual database
  const seedDatabase = async (databaseName, seedString) => {
    return axios
      .put("/api/seed", { databaseName, seedString })
      .then(data => {
        // console.log(JSON.parse(data.data.global_state))
        return data.data;
      })
      .catch(err => {
        console.log("Error loading: ", err);
      });
  };

  //runs query from virtual database
  const queryDatabase = async (databaseName, queryString) => {
    console.log(databaseName, queryString);
    return axios
      .get("/api/query", {
        params: { databaseName: databaseName, queryString: queryString },
      })
      .then(data => {
        // console.log(JSON.parse(data.data.global_state))
        console.log(data.data.rows);
        return data.data.rows;
      })
      .catch(err => {
        console.log("Error loading: ", err);
      });
  };

  //Retrieves List of databases found in Core database
  const getDatabases = () => {
    console.log("getDatabase");
    return axios
      .get(`/api/databases`)
      .then(data => {
        // console.log(JSON.parse(data.data.global_state))
        return data.data;
      })
      .catch(err => {
        console.log("Error loading: ", err);
      });
  };

  return {
    state,
    saveProgress,
    createNewState,
    loadProgress,
    loadDatabase,
    createDatabase,
    seedDatabase,
    queryDatabase,
    getDatabases,
    deleteDatabase,
  };
};

export default useDatabase;
