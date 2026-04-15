import React, { useState } from "react";
import useDatabase from "../../state/hooks/useDatabase";
import BarChartCard from "../charts/bar-chart/BarChartCard";
import PieChartCard from "../charts/pie-chart/PieChartCard";
import SuccessSnackbar from "../snackbars/SuccessSnackbar";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import "./CreateCharts.scss";

const CreateChartsPage = () => {
  const { state, queryDatabase } = useDatabase();

  const [sql, setSql] = useState("SELECT * FROM your_table LIMIT 100");
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const [xKey, setXKey] = useState("");
  const [barYKey, setBarYKey] = useState("");
  const [pieKey, setPieKey] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    isError: false,
  });

  const showSnackbar = (message, isError = false) =>
    setSnackbar({ open: true, message, isError });
  const closeSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  const runQuery = async () => {
    if (!state.databaseName) {
      showSnackbar("No database loaded. Load a database first.", true);
      return;
    }
    setLoading(true);
    try {
      const result = await queryDatabase(state.databaseName, sql);
      if (!result || result.length === 0) {
        setRows([]);
        setColumns([]);
        showSnackbar("Query returned no rows.", true);
      } else {
        const cols = Object.keys(result[0]);
        setRows(result);
        setColumns(cols);
        setXKey(cols[0] || "");
        setBarYKey(cols[1] || cols[0] || "");
        setPieKey(cols[0] || "");
        showSnackbar(`${result.length} row${result.length !== 1 ? "s" : ""} loaded.`);
      }
    } catch (err) {
      showSnackbar(err?.response?.data?.error || "Query failed.", true);
    } finally {
      setLoading(false);
    }
  };

  const barData = rows.map(row => ({
    ...row,
    [barYKey]: Number(row[barYKey]) || 0,
  }));

  const pieData = (() => {
    const counts = {};
    rows.forEach(row => {
      const key = String(row[pieKey] ?? "null");
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .slice(0, 20);
  })();

  const hasData = rows.length > 0;

  return (
    <main>
      <Box id="chart-container" sx={{ flexDirection: "column !important" }}>
        <Box
          sx={{
            mb: 3,
            p: 2,
            border: "1px solid #e0e0e0",
            borderRadius: 2,
            background: "white",
            width: "100%",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
            Database: <strong>{state.databaseName || "None loaded"}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={sql}
            onChange={e => setSql(e.target.value)}
            placeholder="SELECT * FROM your_table LIMIT 100"
            variant="outlined"
            size="small"
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={runQuery}
            disabled={loading}
          >
            Run Query
          </Button>
          {hasData && (
            <Typography variant="caption" sx={{ ml: 2, color: "#666" }}>
              {rows.length} row{rows.length !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>

        {hasData && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 3,
              flexWrap: "wrap",
              width: "100%",
            }}
          >
            <BarChartCard
              columns={columns}
              xKey={xKey}
              yKey={barYKey}
              onXChange={setXKey}
              onYChange={setBarYKey}
              chartData={barData}
            />
            <PieChartCard
              columns={columns}
              pieKey={pieKey}
              onPieKeyChange={setPieKey}
              chartData={pieData}
            />
          </Box>
        )}
      </Box>

      <SuccessSnackbar
        open={snackbar.open}
        message={snackbar.message}
        isError={snackbar.isError}
        handleClose={closeSnackbar}
      />
    </main>
  );
};

export default CreateChartsPage;
