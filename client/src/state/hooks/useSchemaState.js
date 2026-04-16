import { useContext } from "react";
import { GlobalContext } from "../GlobalStateProvider";

import {
  SCHEMA_ADD_TABLE,
  SCHEMA_REMOVE_TABLE,
  SCHEMA_ADD_FIELD,
  SCHEMA_REMOVE_FIELD,
  SCHEMA_HANDLE_CHANGE,
  SCHEMA_SET_ALL_TABLES,
  SCHEMA_DUPLICATE_TABLE,
} from "../reducers/globalReducer";

const useSchemaState = () => {
  const [state, dispatch] = useContext(GlobalContext);

  const addSchemaTable = () => {
    dispatch({ type: SCHEMA_ADD_TABLE });
  };
  const removeSchemaTable = tableIndex =>
    dispatch({ type: SCHEMA_REMOVE_TABLE, tableIndex });
  const addSchemaField = tableIndex =>
    dispatch({ type: SCHEMA_ADD_FIELD, tableIndex });
  const removeSchemaField = (tableIndex, fieldIndex) =>
    dispatch({ type: SCHEMA_REMOVE_FIELD, tableIndex, fieldIndex });
  const handleSchemaChange = (event, fieldType, tableIndex, fieldIndex) =>
    dispatch({
      type: SCHEMA_HANDLE_CHANGE,
      event,
      fieldType,
      tableIndex,
      fieldIndex,
    });

  const setAllSchemaTables = tables =>
    dispatch({ type: SCHEMA_SET_ALL_TABLES, tables });

  const duplicateSchemaTable = tableIndex =>
    dispatch({ type: SCHEMA_DUPLICATE_TABLE, tableIndex });

  return {
    state,
    addSchemaTable,
    removeSchemaTable,
    addSchemaField,
    removeSchemaField,
    handleSchemaChange,
    setAllSchemaTables,
    duplicateSchemaTable,
  };
};

export default useSchemaState;
