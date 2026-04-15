import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Use factory to avoid loading the real module (which imports axios ESM)
jest.mock("../../state/hooks/useDatabase", () => jest.fn());
jest.mock("../../state/hooks/useSchemaState", () => () => ({
  handleSchemaChange: jest.fn(),
}));

import useDatabase from "../../state/hooks/useDatabase";
import UserDatabases from "./UserDatabases";

const twoDBs = [
  { global_state: JSON.stringify({ databaseUuid: "uuid-1", databaseName: "MyDB" }) },
  { global_state: JSON.stringify({ databaseUuid: "uuid-2", databaseName: "OtherDB" }) },
];

const defaultHook = () => ({
  createNewState: jest.fn(),
  loadDatabase: jest.fn().mockResolvedValue(),
  deleteDatabase: jest.fn().mockResolvedValue(),
  getDatabases: jest.fn().mockResolvedValue(twoDBs),
});

beforeEach(() => {
  useDatabase.mockImplementation(defaultHook);
});

const renderComponent = () =>
  render(
    <MemoryRouter>
      <UserDatabases />
    </MemoryRouter>
  );

describe("UserDatabases", () => {
  it("renders the New Database button", async () => {
    renderComponent();
    expect(screen.getByText(/new database/i)).toBeInTheDocument();
  });

  it("renders database names fetched on mount", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("MyDB")).toBeInTheDocument();
      expect(screen.getByText("OtherDB")).toBeInTheDocument();
    });
  });

  it("renders Load and Delete buttons for each database", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/load/i)).toHaveLength(2);
      expect(screen.getAllByText(/delete/i)).toHaveLength(2);
    });
  });

  it("shows an error snackbar when getDatabases rejects", async () => {
    useDatabase.mockImplementation(() => ({
      ...defaultHook(),
      getDatabases: jest.fn().mockRejectedValue({
        response: { data: { error: "DB error" } },
      }),
    }));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeInTheDocument();
    });
  });

  it("skips entries with invalid JSON in global_state", async () => {
    useDatabase.mockImplementation(() => ({
      ...defaultHook(),
      getDatabases: jest.fn().mockResolvedValue([
        { global_state: "not-json" },
        { global_state: JSON.stringify({ databaseUuid: "uuid-3", databaseName: "ValidDB" }) },
      ]),
    }));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("ValidDB")).toBeInTheDocument();
    });
  });
});
