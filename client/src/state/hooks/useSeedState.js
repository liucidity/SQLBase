import { useContext } from "react";
import { GlobalContext } from "../GlobalStateProvider";

import { randNumber } from "@ngneat/falso";

import { SEED_ALL_FAKE_DATA, SEED_FAKE_DATA, SET_SEED_FIELD_CONFIG } from "../reducers/globalReducer";
import { SEED_CATEGORIES, inferSeedType } from "../../helpers/seedTypeHelpers";
import { topoSortTables } from "../../helpers/seedFormHelpers";

const useSeedState = () => {
  const [state, dispatch] = useContext(GlobalContext);

  const genericSeed = (tableName, numDataPoints, seedStateOverride = null) => {
    const tableSchema = state.schemaState.find(t => t.table === tableName);
    const fields = tableSchema ? tableSchema.fields : [];
    const fieldConfig = (state.seedFieldConfig || {})[tableName] || {};
    const currentSeedState = seedStateOverride || state.seedState[0] || {};
    const rows = [];

    for (let i = 0; i < numDataPoints; i++) {
      const row = {};
      fields.forEach(field => {
        // FK field: pick a random ID from the parent table's seeded row count
        if (field.reference) {
          const parentRows = currentSeedState[field.reference];
          const parentCount = Array.isArray(parentRows) && parentRows.length > 0
            ? parentRows.length
            : 100; // fallback if parent not yet seeded
          row[field.fieldName] = randNumber({ min: 1, max: parentCount });
          return;
        }

        const override = fieldConfig[field.fieldName];
        const seedType = override?.seedType ?? inferSeedType(field.fieldName, field.dataType);
        const category = SEED_CATEGORIES[seedType] || SEED_CATEGORIES.word;
        const opts = { min: override?.min, max: override?.max };
        row[field.fieldName] = category.generate(opts);
      });
      rows.push(row);
    }
    return rows;
  };

  const setSeedFieldConfig = (tableName, fieldName, seedType, min, max) => {
    dispatch({ type: SET_SEED_FIELD_CONFIG, tableName, fieldName, seedType, min, max });
  };

  const generateAllSeedState = seedFormData => {
    const seedState = {};
    const tableNames = seedFormData.map(t => t[0]);
    const sortedNames = topoSortTables(tableNames, state.schemaState);

    const dataMap = Object.fromEntries(seedFormData.map(t => [t[0], t[1]]));

    sortedNames.forEach(tableName => {
      const numDataPoints = dataMap[tableName];
      if (numDataPoints === undefined) return;
      seedState[tableName] = genericSeed(tableName, numDataPoints, seedState);
    });

    dispatch({ type: SEED_ALL_FAKE_DATA, seedState });
  };

  const generateSeedState = (tableName, numDataPoints) => {
    const seedData = genericSeed(tableName, numDataPoints);
    dispatch({ type: SEED_FAKE_DATA, seedData, tableName });
  };

  return {
    state,
    generateAllSeedState,
    generateSeedState,
    setSeedFieldConfig,
  };
};

export default useSeedState;
