process.env.JWT_SECRET = "test-secret";

const express = require("express");
const request = require("supertest");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const authApiRoutes = require("../../routes/auth-api");

const makeApp = (dbHelpers) => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authApiRoutes(dbHelpers));
  return app;
};

describe("POST /api/auth/register", () => {
  it("returns 400 when email is missing", async () => {
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("returns 409 when email already exists", async () => {
    const queryDBParams = jest.fn().mockResolvedValue([{ id: 1 }]);
    const app = makeApp({ queryDBParams });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "existing@test.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("registers a new user and sets a token cookie", async () => {
    const queryDBParams = jest.fn()
      .mockResolvedValueOnce([]) // SELECT: no existing user
      .mockResolvedValueOnce([{ id: 5, email: "new@test.com" }]); // INSERT result
    const app = makeApp({ queryDBParams });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@test.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ id: 5, email: "new@test.com" });
    expect(res.headers["set-cookie"]).toBeDefined();
  });
});

describe("POST /api/auth/login", () => {
  it("returns 400 when fields are missing", async () => {
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("returns 401 for unknown email", async () => {
    const queryDBParams = jest.fn().mockResolvedValue([]);
    const app = makeApp({ queryDBParams });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@test.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("responds 200 and clears the cookie", async () => {
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out.");
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when no cookie is present", async () => {
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid token", async () => {
    const token = jwt.sign({ id: 7, email: "me@test.com" }, "test-secret");
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 7, email: "me@test.com" });
  });

  it("returns 401 for an expired token", async () => {
    const token = jwt.sign({ id: 1, email: "old@test.com" }, "test-secret", { expiresIn: "-1s" });
    const app = makeApp({ queryDBParams: jest.fn() });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(401);
  });
});
