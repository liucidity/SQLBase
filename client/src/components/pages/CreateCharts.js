import React, { useState, useEffect, useCallback } from "react";
import useGlobalState from "../../state/hooks/useGlobalState";
import useChartsState from "../../state/hooks/useChartsState";
import useSchemaState from "../../state/hooks/useSchemaState";
import useSeedState from "../../state/hooks/useSeedState";
import PieChartCard from "../charts/pie-chart/PieChartCard";
import BarChartCard from "../charts/bar-chart/BarChartCard";
import { deepCopy } from "../../helpers/schemaFormHelpers";
import {
  initialPieChartData,
  initialBarChartData,
} from "../../state/data_structures/chartState";
import "./CreateCharts.scss";

const CreateChartsPage = () => {
  const { getTableNames, getColumnList } = useGlobalState();
  const { yearsGenerator } = useSeedState();
  const {
    getUniqueValues,
    getAllPieValues,
    getRelTableList,
    getRelColList,
    filterPieChartData,
  } = useChartsState();

  const { state } = useSchemaState();
  let tableList = getTableNames();
  let allTables = state.schemaState;

  const [pieIndexes, setPieIndexes] = useState({
    tableIndex: 0,
    colIndex: 1,
    valIndex: 0,
    relTableIndex: 0,
    relColIndex: 8,
  });

  const [pieColList, setPieColList] = useState(
    getColumnList(allTables[pieIndexes.tableIndex])
  );
  const [pieValList, setPieValList] = useState(
    getUniqueValues(
      String(tableList[pieIndexes.tableIndex].value),
      String(pieColList[pieIndexes.colIndex].value)
    )
  );
  const [pieRelTableList, setPieRelTableList] = useState(
    getRelTableList(String(tableList[pieIndexes.tableIndex].value))
  );
  const [pieRelColList, setPieRelColList] = useState(
    getRelColList(String(pieRelTableList[pieIndexes.relTableIndex].value))
  );
  const [pieRelValList, setPieRelValList] = useState(
    getAllPieValues(
      String(pieRelTableList[pieIndexes.relTableIndex].value),
      String(pieRelColList[pieIndexes.relColIndex].value),
      pieIndexes.valIndex
    )
  );
  const [pieChartData, setPieChartData] = useState(initialPieChartData);

  const [barIndexes, setBarIndexes] = useState({
    tableIndex: 0,
    colIndex: 1,
    valIndex: 0,
  });

  const [barColList, setBarColList] = useState(
    getColumnList(allTables[barIndexes.tableIndex])
  );
  const [barValList, setBarValList] = useState(
    getUniqueValues(
      String(tableList[barIndexes.tableIndex].value),
      String(barColList[barIndexes.colIndex].value)
    )
  );
  const [barChartData, setBarChartData] = useState(initialBarChartData);

  useEffect(() => {
    setPieColList(prev => getColumnList(allTables[pieIndexes.tableIndex]));
    setPieValList(prev =>
      getUniqueValues(
        String(tableList[pieIndexes.tableIndex].value),
        String(pieColList[pieIndexes.colIndex].value)
      )
    );
    setPieRelTableList(prev =>
      getRelTableList(String(tableList[pieIndexes.tableIndex].value))
    );
    setPieRelColList(prev =>
      getRelColList(String(pieRelTableList[pieIndexes.relTableIndex].value))
    );
    setPieRelValList(prev =>
      getAllPieValues(
        String(pieRelTableList[pieIndexes.relTableIndex].value),
        String(pieRelColList[pieIndexes.relColIndex].value),
        pieIndexes.valIndex
      )
    );
  }, [
    pieIndexes.colIndex,
    pieIndexes.tableIndex,
    pieIndexes.relTableIndex,
    pieIndexes.relColIndex,
    pieIndexes.valIndex,
  ]);

  useEffect(() => {
    setBarColList(prev => getColumnList(allTables[barIndexes.tableIndex]));
    setBarChartData(prev =>
      yearsGenerator([5, 7, 9][Math.floor(Math.random() * 3)])
    );
  }, [barIndexes.colIndex, barIndexes.tableIndex, barIndexes.valIndex]);

  const generatePieData = useCallback(() => {
    setPieChartData(prev =>
      filterPieChartData(
        pieChartData,
        String(pieRelColList[pieIndexes.relColIndex].value),
        pieRelValList
      )
    );
  }, [pieRelValList]);

  useEffect(() => {
    generatePieData(pieChartData, pieRelValList);
  }, [generatePieData]);

  const selectHandler = (chart, list, index, event) => {
    if (chart === "pie") {
      setPieIndexes(prev => {
        let next = deepCopy(prev);
        next[index] = list.map(val => val.value).indexOf(event.target.value);
        return next;
      });
    }
    if (chart === "bar") {
      setBarIndexes(prev => {
        let next = deepCopy(prev);
        next[index] = list.map(val => val.value).indexOf(event.target.value);
        return next;
      });
    }
  };

  return (
    <main>
      <div id="chart-container">
        <PieChartCard
          tableList={tableList}
          columnList={pieColList}
          valueList={pieValList}
          relTableList={pieRelTableList}
          relColList={pieRelColList}
          indexes={pieIndexes}
          setIndexes={setPieIndexes}
          selectHandler={selectHandler}
          chartData={pieChartData}
        />
        <BarChartCard
          tableList={tableList}
          columnList={barColList}
          valueList={barValList}
          indexes={barIndexes}
          setIndexes={setBarIndexes}
          selectHandler={selectHandler}
          chartData={barChartData}
        />
      </div>
    </main>
  );
};

export default CreateChartsPage;
