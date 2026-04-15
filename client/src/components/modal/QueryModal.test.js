import React from "react";
import { render, screen } from "@testing-library/react";
import QueryModal from "./QueryModal";

// Suppress MUI Modal warnings about missing Portal target in tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

const noopClick = () => {};

describe("QueryModal", () => {
  it("shows 'No results returned' when result is empty array", () => {
    render(<QueryModal open={true} result={[]} onClick={noopClick} />);
    expect(screen.getByText(/no results returned/i)).toBeInTheDocument();
  });

  it("shows 'No results returned' when result is null", () => {
    render(<QueryModal open={true} result={null} onClick={noopClick} />);
    expect(screen.getByText(/no results returned/i)).toBeInTheDocument();
  });

  it("renders column headers from result rows", () => {
    const result = [
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
    ];
    render(<QueryModal open={true} result={result} onClick={noopClick} />);
    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("age")).toBeInTheDocument();
  });

  it("renders row values", () => {
    const result = [{ id: 1, name: "Alice" }];
    render(<QueryModal open={true} result={result} onClick={noopClick} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders multiple rows", () => {
    const result = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    render(<QueryModal open={true} result={result} onClick={noopClick} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("handles null cell values without crashing", () => {
    const result = [{ id: 1, name: null }];
    render(<QueryModal open={true} result={result} onClick={noopClick} />);
    // null rendered as empty string — no crash
    expect(screen.getByText("id")).toBeInTheDocument();
  });
});
