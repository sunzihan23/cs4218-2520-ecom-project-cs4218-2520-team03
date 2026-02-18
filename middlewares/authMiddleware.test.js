// Sun Zihan, A0259581R
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth Middleware (Refactored)", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: "mock-token",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("requireSignIn Middleware", () => {
    it("should decode valid JWT and attach user to req.user", async () => {
      const mockDecoded = { _id: "user123" };
      JWT.verify.mockReturnValue(mockDecoded);

      await requireSignIn(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });

    it("should return 401 if no authorization header is present", async () => {
      req.headers.authorization = undefined;

      await requireSignIn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      // Use toHaveBeenCalledWith to inspect the object sent
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "No token provided"
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 and error message on invalid token", async () => {
      JWT.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      await requireSignIn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired token",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin Middleware", () => {
    it("should allow access if user role is 1 (Admin)", async () => {
      req.user = { _id: "admin123" };
      userModel.findById.mockResolvedValue({ _id: "admin123", role: 1 });

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 404 if user is not found in database", async () => {
      req.user = { _id: "missing123" };
      userModel.findById.mockResolvedValue(null);

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "User not found"
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not an admin", async () => {
      req.user = { _id: "user123" };
      userModel.findById.mockResolvedValue({ _id: "user123", role: 0 });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "UnAuthorized Access"
      }));
    });

    it("should return 500 on database internal error", async () => {
      const mockError = new Error("DB Crash");
      req.user = { _id: "user123" };
      userModel.findById.mockRejectedValue(mockError);

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: "Error in admin middleware"
      }));
    });
  });
});