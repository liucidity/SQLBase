process.env.JWT_SECRET = "test-secret";

const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const tablesApiRoutes = require("../../routes/tables-api");
const { authenticate } = require("../../middleware/auth");

const makeApp = (dbHelpers) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/tables", authenticate, tablesApiRoutes(dbHelpers));
  return app;
};

const makeToken = (id = 1) =>
  jwt.sign({ id, email: "test@example.com" }, "test-secret");

describe("GET /api/tables", () => {
  it("returns 401 without auth cookie", async () => {
    const app = makeApp({ queryDBParams: jest.fn(), queryDB: jest.fn() });
    const res = await request(app).get("/api/tables");
    expect(res.status).toBe(401);
  });

  it("returns empty array when no records exist (no uuid)", async () => {
    const queryDBParams = jest.fn().mockResolvedValue([]);
    const app = makeApp({ queryDBParams, queryDB: jest.fn() });
    const res = await request(app)
      .get("/api/tables")
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns data for a valid uuid", async () => {
    const mockData = [{ global_state: '{"databaseName":"mydb"}' }];
    const queryDBParams = jest.fn().mockResolvedValue(mockData);
    const app = makeApp({ queryDBParams, queryDB: jest.fn() });
    const res = await request(app)
      .get("/api/tables")
      .query({ uuid: "abc-123" })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
    expect(queryDBParams).toHaveBeenCalledWith(
      expect.stringContaining("database_uuid = $1"),
      ["abc-123", 1]
    );
  });
});

describe("POST /api/tables (upsert)", () => {
  it("returns 401 without auth cookie", async () => {
    const app = makeApp({ queryDBParams: jest.fn(), queryDB: jest.fn() });
    const res = await request(app).post("/api/tables").send({});
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const app = makeApp({ queryDBParams: jest.fn(), queryDB: jest.fn() });
    const res = await request(app)
      .post("/api/tables")
      .set("Cookie", `token=${makeToken()}`)
      .send({ databaseName: "mydb" });
    expect(res.status).toBe(400);
  });

  it("upserts and returns the row", async () => {
    const mockRow = [{ id: 1, name: "mydb", database_uuid: "uuid-1" }];
    const queryDBParams = jest.fn().mockResolvedValue(mockRow);
    const app = makeApp({ queryDBParams, queryDB: jest.fn() });
    const res = await request(app)
      .post("/api/tables")
      .set("Cookie", `token=${makeToken()}`)
      .send({ databaseName: "mydb", globalStateString: "{}", databaseUuid: "uuid-1" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockRow);
  });
});

describe("DELETE /api/tables", () => {
  it("returns 401 without auth cookie", async () => {
    const app = makeApp({ queryDBParams: jest.fn(), queryDB: jest.fn() });
    const res = await request(app).delete("/api/tables");
    expect(res.status).toBe(401);
  });

  it("returns 400 when databaseUuid query param is missing", async () => {
    const app = makeApp({ queryDBParams: jest.fn(), queryDB: jest.fn() });
    const res = await request(app)
      .delete("/api/tables")
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it("returns 404 when record is not found", async () => {
    const queryDBParams = jest.fn().mockResolvedValue([]);
    const app = makeApp({ queryDBParams, queryDB: jest.fn() });
    const res = await request(app)
      .delete("/api/tables")
      .query({ databaseUuid: "no-such-uuid" })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it("deletes and returns the deleted row", async () => {
    const mockRow = [{ id: 1, database_uuid: "uuid-1" }];
    const queryDBParams = jest.fn().mockResolvedValue(mockRow);
    const app = makeApp({ queryDBParams, queryDB: jest.fn() });
    const res = await request(app)
      .delete("/api/tables")
      .query({ databaseUuid: "uuid-1" })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockRow);
  });
});
