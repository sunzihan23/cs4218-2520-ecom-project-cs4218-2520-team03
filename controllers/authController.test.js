// Sun Zihan, A0259581R
import {registerController, loginController, forgotPasswordController, testController} from "./authController";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("Auth Controller Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("registerController", () => {
    it("should return 400 and specific error if any required field is missing", async () => {
      const requiredFields = [
        { field: "name", error: "Name is required" },
        { field: "email", error: "Email is required" },
        { field: "password", error: "Password is required and should be at least 6 characters long" },
        { field: "phone", error: "Phone number is required" },
        { field: "address", error: "Address is required" },
        { field: "answer", error: "Answer is required" },
      ];

      for (const item of requiredFields) {
        req.body = { 
          name: "John", email: "test@test.com", password: "password123", 
          phone: "98765432", address: "Singapore", answer: "Soccer" 
        };
        delete req.body[item.field];

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: item.error,
        });
        jest.clearAllMocks();
      }
    });

    it("should block duplicate registration with 200 status", async () => {
      req.body = { 
        name: "n", email: "existing@test.com", password: "password123", 
        phone: "ph", address: "a", answer: "ans" 
      };
      userModel.findOne.mockResolvedValue({ email: "existing@test.com" });
    
      await registerController(req, res);
    
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ 
        success: false, 
        message: "Already registered, please login"
      }));
    });

    it("should hash password and save new user successfully with 201 status", async () => {
      const userData = { name: "John", email: "new@test.com", password: "password123", phone: "123", address: "addr", answer: "blue" };
      req.body = userData;
      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue("hashed_password");
      
      const saveMock = jest.fn().mockResolvedValue({ ...userData, password: "hashed_password" });
      userModel.mockImplementation(() => ({
        save: saveMock
      }));

      await registerController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("password123");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Registered successfully, please login"
      }));
    });

    it("should handle save failure in catch block with 500 status", async () => {
      req.body = { 
        name: "n", email: "e@t.com", password: "password123", 
        phone: "1", address: "a", answer: "s" 
      };
      userModel.findOne.mockRejectedValue(new Error("Database Error"));

      await registerController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: "Failed to register user"
      }));
    });
  });

  describe("loginController", () => {
    it("should reject missing credentials with 404 status", async () => {
      req.body = { email: "" }; 
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);

      req.body = { password: "p" }; 
      await loginController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 404 if email is not registered", async () => {
      req.body = { email: "no@test.com", password: "p" };
      userModel.findOne.mockResolvedValue(null);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Email is not registerd" }));
    });

    it("should deny access with 401 if password comparison fails", async () => {
      req.body = { email: "user@test.com", password: "wrong" };
      userModel.findOne.mockResolvedValue({ email: "user@test.com", password: "hashed" });
      comparePassword.mockResolvedValue(false);

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(401); 
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid password" }));
    });

    it("should login successfully, generate JWT, and return 200 status", async () => {
      const mockUser = { _id: "1", name: "John", email: "e@t.com", password: "h", phone: "1", address: "a", role: 0 };
      req.body = { email: "e@t.com", password: "p" };
      userModel.findOne.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      JWT.sign.mockReturnValue("mock_token");

      await loginController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Login successful",
        token: "mock_token"
      }));
    });
  });

  describe("forgotPasswordController", () => {
    it("should return 400 if required fields for reset are missing", async () => {
      const fields = [
        { key: "email", msg: "Email is required" },
        { key: "answer", msg: "Answer is required" },
        { key: "newPassword", msg: "New password is required" }
      ];

      for (const field of fields) {
        req.body = { email: "e", answer: "a", newPassword: "p" };
        delete req.body[field.key];

        await forgotPasswordController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: field.msg
        });
        jest.clearAllMocks();
      }
    });

    it("should return 404 if email or answer is incorrect", async () => {
      req.body = { email: "e@t.com", answer: "wrong", newPassword: "np" };
      userModel.findOne.mockResolvedValue(null);

      await forgotPasswordController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Wrong email or answer" }));
    });
  
    it("should reset password successfully with 200 status", async () => {
      req.body = { email: "e@t.com", answer: "Soccer", newPassword: "newp" };
      userModel.findOne.mockResolvedValue({ _id: "123" });
      hashPassword.mockResolvedValue("hashed_newp");

      await forgotPasswordController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("newp");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("123", { password: "hashed_newp" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Password has been reset successfully"
      }));
    });
  });

  describe("testController", () => {
    it("should return Protected Routes message on success", () => {
      testController(req, res);
      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should handle unexpected errors in catch block", () => {
      const mockError = new Error("Unexpected Failure");
      res.send.mockImplementationOnce(() => { throw mockError; });
      
      testController(req, res);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: mockError }));
    });
  });
});