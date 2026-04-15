const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 12;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

module.exports = ({ queryDBParams }) => {
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
      res.status(201).json({ user: { id: user.id, email: user.email } });
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
