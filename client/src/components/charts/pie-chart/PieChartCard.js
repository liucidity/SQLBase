import React from "react";
import ResponsivePieChart from "./ResponsivePieChart";
import {
  Card,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const PieChartCard = ({ columns, pieKey, onPieKeyChange, chartData }) => {
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
        Pie Chart
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Group By</InputLabel>
          <Select
            value={pieKey}
            onChange={e => onPieKeyChange(e.target.value)}
            label="Group By"
          >
            {columns.map(col => (
              <MenuItem key={col} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ResponsivePieChart chartData={chartData} groupByKey={pieKey} />
    </Card>
  );
};

export default PieChartCard;
