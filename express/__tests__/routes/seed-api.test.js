process.env.JWT_SECRET = "test-secret";

const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const seedApiRoutes = require("../../routes/seed-api");
const { authenticate } = require("../../middleware/auth");

const makeApp = (helpers) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/seed", authenticate, seedApiRoutes(helpers));
  return app;
};

const makeToken = (id = 1) =>
  jwt.sign({ id, email: "test@example.com" }, "test-secret");

describe("PUT /api/seed", () => {
  it("returns 401 without auth cookie", async () => {
    const app = makeApp({ seedTable: jest.fn() });
    const res = await request(app).put("/api/seed").send({});
    expect(res.status).toBe(401);
  });

  it("seeds the table and returns result on success", async () => {
    const seedTable = jest.fn().mockResolvedValue({ rowCount: 5 });
    const app = makeApp({ seedTable });
    const res = await request(app)
      .put("/api/seed")
      .send({ databaseName: "testdb", seedString: "INSERT INTO users..." })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rowCount: 5 });
  });

  it("passes databaseName and seedString to seedTable", async () => {
    const seedTable = jest.fn().mockResolvedValue({});
    const app = makeApp({ seedTable });
    await request(app)
      .put("/api/seed")
      .send({ databaseName: "mydb", seedString: "INSERT INTO t VALUES (1)" })
      .set("Cookie", `token=${makeToken()}`);
    expect(seedTable).toHaveBeenCalledWith(
      "mydb",
      "INSERT INTO t VALUES (1)"
    );
  });

  it("returns 500 when seedTable rejects", async () => {
    const seedTable = jest.fn().mockRejectedValue(new Error("relation does not exist"));
    const app = makeApp({ seedTable });
    const res = await request(app)
      .put("/api/seed")
      .send({ databaseName: "testdb", seedString: "INSERT INTO missing..." })
      .set("Cookie", `token=${makeToken()}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("relation does not exist");
  });
});
