import { generateSeedSQL } from "./seedFormHelpers";

describe("generateSeedSQL", () => {
  it("returns empty string when seed state has no tables", () => {
    expect(generateSeedSQL([{}])).toBe("");
  });

  it("skips tables with empty arrays", () => {
    const seedState = [{ users: [], products: [] }];
    expect(generateSeedSQL(seedState)).toBe("");
  });

  it("generates a valid INSERT for a table with one row", () => {
    const seedState = [{ users: [{ name: "Alice", age: 30 }] }];
    const sql = generateSeedSQL(seedState);
    expect(sql).toContain('INSERT INTO users');
    expect(sql).toContain('"name"');
    expect(sql).toContain('"age"');
    expect(sql).toContain("'Alice'");
    expect(sql).toContain("30");
    expect(sql).toContain("VALUES");
    expect(sql).toContain(";");
  });

  it("generates INSERT for a table with multiple rows", () => {
    const seedState = [{
      items: [
        { label: "foo", count: 1 },
        { label: "bar", count: 2 },
      ],
    }];
    const sql = generateSeedSQL(seedState);
    expect(sql).toContain("INSERT INTO items");
    expect(sql).toContain("'foo'");
    expect(sql).toContain("'bar'");
  });

  it("generates multiple INSERTs joined with newlines", () => {
    const seedState = [{
      users: [{ name: "Alice" }],
      orders: [{ amount: 100 }],
    }];
    const sql = generateSeedSQL(seedState);
    expect(sql).toContain("INSERT INTO users");
    expect(sql).toContain("INSERT INTO orders");
  });

  it("skips empty tables but includes non-empty ones", () => {
    const seedState = [{ empty: [], users: [{ name: "Bob" }] }];
    const sql = generateSeedSQL(seedState);
    expect(sql).not.toContain("INSERT INTO empty");
    expect(sql).toContain("INSERT INTO users");
  });
});
