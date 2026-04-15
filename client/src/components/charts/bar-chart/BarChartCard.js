import React from "react";
import ResponsiveBarChart from "./ResponsiveBarChart";
import {
  Card,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const BarChartCard = ({ columns, xKey, yKey, onXChange, onYChange, chartData }) => {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: 400,
        p: 3,
        backgroundColor: "#f9f9f9",
        boxShadow: "0 8px 20px -6px #e0e0e0",
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2, textAlign: "center", color: "#383838" }}
      >
        Bar Chart
      </Typography>
      <Box
        sx={{ display: "flex", gap: 2, mb: 2, justifyContent: "center" }}
      >
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>X Axis</InputLabel>
          <Select
            value={xKey}
            onChange={e => onXChange(e.target.value)}
            label="X Axis"
          >
            {columns.map(col => (
              <MenuItem key={col} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Y Axis</InputLabel>
          <Select
            value={yKey}
            onChange={e => onYChange(e.target.value)}
            label="Y Axis"
          >
            {columns.map(col => (
              <MenuItem key={col} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ResponsiveBarChart chartData={chartData} xKey={xKey} yKey={yKey} />
    </Card>
  );
};

export default BarChartCard;
