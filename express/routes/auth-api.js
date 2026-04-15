const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const SALT_ROUNDS = 12;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const DEMO_SCHEMA_SQL = `
CREATE TABLE departments (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(50) NOT NULL UNIQUE,
  budget NUMERIC,
  location VARCHAR(50)
);
CREATE TABLE employees (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  salary NUMERIC,
  hire_date DATE
);
`;

const DEMO_SEED_SQL = `
INSERT INTO departments (name, budget, location) VALUES
  ('Engineering', 500000, 'San Francisco'),
  ('Marketing', 200000, 'New York'),
  ('Sales', 350000, 'Chicago'),
  ('HR', 150000, 'Austin');
INSERT INTO employees (name, department, salary, hire_date) VALUES
  ('Alice Johnson', 'Engineering', 95000, '2021-03-15'),
  ('Bob Smith', 'Marketing', 72000, '2020-08-01'),
  ('Carol Davis', 'Engineering', 105000, '2019-06-10'),
  ('David Wilson', 'Sales', 68000, '2022-01-20'),
  ('Eve Martinez', 'HR', 58000, '2021-11-05'),
  ('Frank Brown', 'Engineering', 88000, '2020-04-12'),
  ('Grace Lee', 'Marketing', 76000, '2023-02-28'),
  ('Henry Clark', 'Sales', 71000, '2022-09-15');
`;

const buildDemoState = (databaseName, databaseUuid) => ({
  databaseName,
  databaseUuid,
  schemaState: [
    {
      id: null,
      table: "departments",
      fields: [
        { fieldName: "name", dataType: "VARCHAR", varcharSize: "50", mod1: "NOT NULL", mod2: "UNIQUE", default: "", reference: "" },
        { fieldName: "budget", dataType: "NUMERIC", varcharSize: "", mod1: "", mod2: "", default: "", reference: "" },
        { fieldName: "location", dataType: "VARCHAR", varcharSize: "50", mod1: "", mod2: "", default: "", reference: "" },
      ],
    },
    {
      id: null,
      table: "employees",
      fields: [
        { fieldName: "name", dataType: "VARCHAR", varcharSize: "100", mod1: "NOT NULL", mod2: "", default: "", reference: "" },
        { fieldName: "department", dataType: "VARCHAR", varcharSize: "50", mod1: "", mod2: "", default: "", reference: "" },
        { fieldName: "salary", dataType: "NUMERIC", varcharSize: "", mod1: "", mod2: "", default: "", reference: "" },
        { fieldName: "hire_date", dataType: "DATE", varcharSize: "", mod1: "", mod2: "", default: "", reference: "" },
      ],
    },
  ],
  queryState: [
    {
      schemas: [{ id: null, table: "", fields: [{ fieldName: "", dataType: "", mod1: "", mod2: "", default: "", reference: "" }] }],
      queries: [
        {
          table: "employees",
          columns: ["name", "department", "salary"],
          whereCondition: [],
          distinct: false,
          limit: 1000,
          aggregate: [],
          aggregateAs: [],
          having: [],
          groupBy: [],
          orderBy: ["salary"],
        },
      ],
    },
  ],
  seedState: [{}],
});

module.exports = ({ queryDBParams, createDB, createTable, seedTable }) => {
  const router = express.Router();

  // POST /api/auth/register
  router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }
    try {
      const existing = await queryDBParams(
        `SELECT id FROM users WHERE email = $1;`,
        [email.toLowerCase()]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await queryDBParams(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email;`,
        [email.toLowerCase(), passwordHash]
      );
      const user = result[0];
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, COOKIE_OPTIONS);

      // Create demo database (best-effort — don't block registration on failure)
      let demoState = null;
      try {
        const demoName = `demo_u${user.id}`;
        const demoUuid = crypto.randomUUID();
        await createDB(demoName);
        await createTable(demoName, user.id, DEMO_SCHEMA_SQL);
        await seedTable(demoName, DEMO_SEED_SQL);
        demoState = buildDemoState(demoName, demoUuid);
        await queryDBParams(
          `INSERT INTO databases (user_id, name, global_state, database_uuid) VALUES ($1, $2, $3, $4);`,
          [user.id, demoName, JSON.stringify(demoState), demoUuid]
        );
      } catch (demoErr) {
        console.error("Demo DB setup failed (non-fatal):", demoErr.message);
      }

      res.status(201).json({ user: { id: user.id, email: user.email }, demoState });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/login
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    try {
      const result = await queryDBParams(
        `SELECT id, email, password_hash FROM users WHERE email = $1;`,
        [email.toLowerCase()]
      );
      if (result.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const user = result[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, COOKIE_OPTIONS);
      res.json({ user: { id: user.id, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/logout
  router.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    res.json({ message: "Logged out." });
  });

  // GET /api/auth/me — check current session
  router.get("/me", (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Not authenticated." });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ user: { id: payload.id, email: payload.email } });
    } catch {
      res.status(401).json({ error: "Invalid or expired token." });
    }
  });

  return router;
};
