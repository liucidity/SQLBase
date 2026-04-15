process.env.JWT_SECRET = "test-secret";

const jwt = require("jsonwebtoken");
const { authenticate } = require("../../middleware/auth");

describe("authenticate middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("returns 401 when no token cookie is present", () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", () => {
    req.cookies.token = "not-a-valid-jwt";
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a token signed with wrong secret", () => {
    req.cookies.token = jwt.sign({ id: 1, email: "a@b.com" }, "wrong-secret");
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next and sets req.user for a valid token", () => {
    const token = jwt.sign({ id: 42, email: "user@example.com" }, "test-secret");
    req.cookies.token = token;
    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 42, email: "user@example.com" });
  });
});
