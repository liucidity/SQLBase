import React, { useCallback, useState } from "react";
import { PieChart, Pie } from "recharts";
import ActivePieShape from "./ActivePieShape";
import { pieChartColors } from "../../../state/data_structures/chartState";
import { capitalizeWord } from "../../../helpers/chartFormHelpers";

const ResponsivePieChart = ({ chartData = [], groupByKey = "" }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = useCallback((_, index) => setActiveIndex(index), []);

  if (!chartData || chartData.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
        No data to display.
      </p>
    );
  }

  return (
    <>
      <p
        style={{
          textAlign: "center",
          color: "#666",
          marginBottom: 4,
          fontSize: "0.9em",
        }}
      >
        Grouped by <strong>{capitalizeWord(groupByKey)}</strong> —{" "}
        {chartData.length} categories
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PieChart width={500} height={400}>
          <Pie
            activeIndex={activeIndex}
            activeShape={
              <ActivePieShape
                chartColors={pieChartColors}
                subTextColor="#3a3a3b"
                activeIndex={activeIndex}
                sectorName="record"
              />
            }
            data={chartData}
            cx={250}
            cy={200}
            innerRadius={100}
            outerRadius={140}
            dataKey="value"
            onMouseEnter={onPieEnter}
          />
        </PieChart>
      </div>
    </>
  );
};

export default ResponsivePieChart;
