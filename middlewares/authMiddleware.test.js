// Sun Zihan, A0259581R
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "./authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: "valid-mock-token",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("requireSignIn Middleware", () => {
    it("should call next() and attach user data when token is valid", async () => {
      const mockDecoded = { _id: "user123", role: 0 };
      JWT.verify.mockReturnValue(mockDecoded);

      await requireSignIn(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header is missing", async () => {
      req.headers.authorization = undefined;

      await requireSignIn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: "No token provided"
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if token verification fails", async () => {
      JWT.verify.mockImplementation(() => {
        throw new Error("JsonWebTokenError: invalid signature");
      });

      await requireSignIn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "Invalid or expired token"
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("isAdmin Middleware", () => {
    it("should call next() if the user has an admin role (role: 1)", async () => {
      req.user = { _id: "admin_id" };
      userModel.findById.mockResolvedValue({ _id: "admin_id", role: 1 });

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 if the user is not an admin (role: 0)", async () => {
      req.user = { _id: "user_id" };
      userModel.findById.mockResolvedValue({ _id: "user_id", role: 0 });

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "UnAuthorized Access"
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 if the user record does not exist in the database", async () => {
      req.user = { _id: "non_existent_id" };
      userModel.findById.mockResolvedValue(null);

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "User not found"
      }));
    });

    it("should return 500 if there is a database error during the check", async () => {
      req.user = { _id: "user_id" };
      const dbError = new Error("Connection Timeout");
      userModel.findById.mockRejectedValue(dbError);

      await isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: "Error in admin middleware"
      }));
    });
  });
});