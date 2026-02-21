// Sun Zihan, A0259581R
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
} from "./authController";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("registerController", () => {
    it("should return 400 if any required field is missing", async () => {
      req.body = { name: "John", email: "john@test.com" }; 
      await registerController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "Missing required registration details"
      }));
    });

    it("should return 409 if the email is already registered", async () => {
      req.body = { 
        name: "John", email: "exists@test.com", password: "password123", 
        phone: "12345678", address: "SG", answer: "Soccer" 
      };
      userModel.findOne.mockResolvedValue({ email: "exists@test.com" });
      
      await registerController(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "Email already registered, please login"
      }));
    });

    it("should hash password and save user with 201 on success", async () => {
      const userData = { 
        name: "John", email: "new@test.com", password: "password123", 
        phone: "12345678", address: "SG", answer: "Soccer" 
      };
      req.body = userData;
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed_pwd");
      
      const saveMock = jest.fn().mockResolvedValue({
        _id: "u123", name: "John", email: "new@test.com"
      });
      userModel.mockImplementation(() => ({ save: saveMock }));

      await registerController(req, res);
      expect(hashPassword).toHaveBeenCalledWith("password123");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Registration successful, please login"
      }));
    });

    it("should return 500 if an error occurs during registration", async () => {
      req.body = { 
        name: "John", email: "error@test.com", password: "p", 
        phone: "1", address: "a", answer: "s" 
      };
      userModel.findOne.mockRejectedValue(new Error("DB Error"));
      await registerController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("loginController", () => {
    it("should return 400 if email or password is missing", async () => {
      req.body = { email: "john@test.com" };
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 if user is not found", async () => {
      req.body = { email: "none@test.com", password: "pwd" };
      userModel.findOne.mockResolvedValue(null);
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 if password does not match", async () => {
      req.body = { email: "john@test.com", password: "wrong" };
      userModel.findOne.mockResolvedValue({ password: "hashed_pwd" });
      comparePassword.mockResolvedValue(false);
      
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 200 and a token on successful login", async () => {
      req.body = { email: "john@test.com", password: "right" };
      const mockUser = { 
        _id: "123", name: "John", email: "john@test.com", 
        password: "h", phone: "123", address: "SG", role: 0 
      };
      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("mock_token");

      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: "mock_token"
      }));
    });

    it("should return 500 on internal login error", async () => {
      req.body = { email: "crash@test.com", password: "p" };
      userModel.findOne.mockRejectedValue(new Error("Crash"));
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("forgotPasswordController", () => {
    it("should return 400 if fields are missing", async () => {
      req.body = { email: "j@t.com" };
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if email or answer combination is wrong", async () => {
      req.body = { email: "j@t.com", answer: "wrong", newPassword: "p" };
      userModel.findOne.mockResolvedValue(null);
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should reset password successfully", async () => {
      req.body = { email: "j@t.com", answer: "sport", newPassword: "newp" };
      userModel.findOne.mockResolvedValue({ _id: "123" });
      hashPassword.mockResolvedValue("hashed_new");

      await forgotPasswordController(req, res);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("123", { password: "hashed_new" });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on reset error", async () => {
      req.body = { email: "f@t.com", answer: "s", newPassword: "p" };
      userModel.findOne.mockRejectedValue(new Error("Fail"));
      await forgotPasswordController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("testController", () => {
    it("should return 200 and success message", () => {
      testController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        message: "Protected route accessed"
      }));
    });

    it("should return 500 if an error occurs", () => {
      res.status.mockImplementationOnce(() => {
        throw new Error("Internal");
      });
      
      testController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});