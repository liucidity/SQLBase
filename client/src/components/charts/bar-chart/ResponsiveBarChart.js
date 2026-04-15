import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const ResponsiveBarChart = ({ chartData, xKey, yKey }) => {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 70, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#d9d1ff" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#383838" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 12, fill: "#383838" }} />
          <Tooltip />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar dataKey={yKey} fill="#413ea0" barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponsiveBarChart;
