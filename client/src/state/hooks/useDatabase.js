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
  const saveProgress = async () => {
    const globalStateString = JSON.stringify(state);
    const databaseName = state.databaseName;
    const databaseUuid = state.databaseUuid;
    await axios.post(`/api/tables`, { databaseName, globalStateString, databaseUuid });
  };

  // loads last created state into state
  const loadProgress = async () => {
    const { data } = await axios.get(`/api/tables`);
    const globalStateString = JSON.parse(data[0]["global_state"]);
    loadData(globalStateString);
  };

  //loads target database/saved state into state
  const loadDatabase = async uuid => {
    const { data } = await axios.get(`/api/tables`, { params: { uuid } });
    const globalStateString = JSON.parse(data[0]["global_state"]);
    loadData(globalStateString);
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
    await axios.post(`/api/databases`, { databaseName });
    await axios.delete(`/api/tables`, { params: { databaseUuid } });
  };

  //inserts into virtual database
  const seedDatabase = async (databaseName, seedString) => {
    const { data } = await axios.put("/api/seed", { databaseName, seedString });
    return data;
  };

  //runs query from virtual database
  const queryDatabase = async (databaseName, queryString) => {
    const { data } = await axios.get("/api/query", {
      params: { databaseName, queryString },
    });
    return data.rows;
  };

  //Retrieves List of databases found in Core database
  const getDatabases = async () => {
    const { data } = await axios.get(`/api/databases`);
    return data;
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
