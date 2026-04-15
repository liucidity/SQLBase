process.env.JWT_SECRET = "test-secret";

const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const queryApiRoutes = require("../../routes/query-api");
const { authenticate } = require("../../middleware/auth");

const makeApp = (helpers) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/query", authenticate, queryApiRoutes(helpers));
  return app;
};

const makeToken = (id = 1) =>
  jwt.sign({ id, email: "test@example.com" }, "test-secret");

describe("GET /api/query", () => {
  it("returns 401 without auth cookie", async () => {
    const app = makeApp({ queryTable: jest.fn() });
    const res = await request(app).get("/api/query");
    expect(res.status).toBe(401);
  });

  it("returns query results on success", async () => {
    const rows = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
    const queryTable = jest.fn().mockResolvedValue({ rows });
    const app = makeApp({ queryTable });
    const res = await request(app)
      .get("/api/query")
      .query({ databaseName: "testdb", queryString: "SELECT * FROM users" })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.rows).toEqual(rows);
  });

  it("passes databaseName and queryString to queryTable", async () => {
    const queryTable = jest.fn().mockResolvedValue({ rows: [] });
    const app = makeApp({ queryTable });
    await request(app)
      .get("/api/query")
      .query({ databaseName: "mydb", queryString: "SELECT 1" })
      .set("Cookie", `token=${makeToken()}`);
    expect(queryTable).toHaveBeenCalledWith("mydb", "SELECT 1");
  });

  it("returns 500 when queryTable rejects", async () => {
    const queryTable = jest.fn().mockRejectedValue(new Error("syntax error"));
    const app = makeApp({ queryTable });
    const res = await request(app)
      .get("/api/query")
      .query({ databaseName: "testdb", queryString: "BAD SQL" })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("syntax error");
  });
});
