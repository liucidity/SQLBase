import { useContext } from "react";
import { GlobalContext } from "../GlobalStateProvider";

import {
  QUERY_ADD_TABLE,
  INSERT_QUERY_TABLE,
  SET_QUERY_PARAMS,
  QUERY_REMOVE_TABLE,
  LOAD_QUERY_STATE,
  QUERY_SET_TABLE,
  QUERY_CLEAR_TABLE,
} from "../reducers/globalReducer";

const useQueryState = () => {
  const [state, dispatch] = useContext(GlobalContext);

  const addQueryTable = () => {
    console.log("Add Table function triggered");
    dispatch({ type: QUERY_ADD_TABLE });
  };

  const removeQueryTable = tableIndex => {
    dispatch({ type: QUERY_REMOVE_TABLE, tableIndex });
  };

  const selectTableHandler = (tableName, queryIndex) => {
    dispatch({ type: QUERY_SET_TABLE, tableName, queryIndex });
  };

  const clearQueryTable = (queryIndex) => {
    dispatch({ type: QUERY_CLEAR_TABLE, queryIndex });
  };

  const setQueryParams = (event, queryIndex, queryType, fieldIndex) => {
    const queryName = event.target.value;
    dispatch({ type: SET_QUERY_PARAMS, queryName, queryIndex, queryType, fieldIndex });
  };

  const loadQueryState = (queryState) => {
    dispatch({ type: LOAD_QUERY_STATE, queryState });
  };

  return {
    state,
    addQueryTable,
    removeQueryTable,
    selectTableHandler,
    clearQueryTable,
    setQueryParams,
    loadQueryState,
  };
};

export default useQueryState;
