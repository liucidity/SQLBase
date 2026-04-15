import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../state/hooks/useDatabase", () => jest.fn());
jest.mock("../charts/bar-chart/BarChartCard", () => () => <div>Bar Chart</div>);
jest.mock("../charts/pie-chart/PieChartCard", () => () => <div>Pie Chart</div>);

import useDatabase from "../../state/hooks/useDatabase";
import CreateChartsPage from "./CreateCharts";

const mockQueryDatabase = jest.fn();

const defaultHook = () => ({
  state: { databaseName: "testdb" },
  queryDatabase: mockQueryDatabase,
});

beforeEach(() => {
  useDatabase.mockImplementation(defaultHook);
  mockQueryDatabase.mockReset();
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <CreateChartsPage />
    </MemoryRouter>
  );

describe("CreateCharts", () => {
  it("renders Run Query button", () => {
    renderPage();
    expect(screen.getByText(/run query/i)).toBeInTheDocument();
  });

  it("shows the loaded database name", () => {
    renderPage();
    expect(screen.getByText(/testdb/)).toBeInTheDocument();
  });

  it("shows 'None loaded' when no database is set", () => {
    useDatabase.mockImplementation(() => ({
      state: { databaseName: "" },
      queryDatabase: mockQueryDatabase,
    }));
    renderPage();
    expect(screen.getByText(/none loaded/i)).toBeInTheDocument();
  });

  it("shows error snackbar when no database loaded and Run Query is clicked", async () => {
    useDatabase.mockImplementation(() => ({
      state: { databaseName: "" },
      queryDatabase: mockQueryDatabase,
    }));
    renderPage();
    fireEvent.click(screen.getByText(/run query/i));
    await waitFor(() => {
      expect(screen.getByText(/no database loaded/i)).toBeInTheDocument();
    });
  });

  it("shows row count after successful query", async () => {
    mockQueryDatabase.mockResolvedValue([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
    renderPage();
    fireEvent.click(screen.getByText(/run query/i));
    await waitFor(() => {
      expect(screen.getByText(/2 rows loaded/i)).toBeInTheDocument();
    });
  });

  it("renders bar and pie chart cards after successful query", async () => {
    mockQueryDatabase.mockResolvedValue([
      { id: 1, status: "active" },
      { id: 2, status: "inactive" },
    ]);
    renderPage();
    fireEvent.click(screen.getByText(/run query/i));
    await waitFor(() => {
      expect(screen.getByText(/bar chart/i)).toBeInTheDocument();
      expect(screen.getByText(/pie chart/i)).toBeInTheDocument();
    });
  });

  it("shows error snackbar when query fails", async () => {
    mockQueryDatabase.mockRejectedValue({
      response: { data: { error: "relation does not exist" } },
    });
    renderPage();
    fireEvent.click(screen.getByText(/run query/i));
    await waitFor(() => {
      expect(screen.getByText("relation does not exist")).toBeInTheDocument();
    });
  });

  it("shows 'no rows' snackbar when query returns empty", async () => {
    mockQueryDatabase.mockResolvedValue([]);
    renderPage();
    fireEvent.click(screen.getByText(/run query/i));
    await waitFor(() => {
      expect(screen.getByText(/no rows/i)).toBeInTheDocument();
    });
  });
});
