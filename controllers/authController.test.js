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
      it("should return error if any required field is missing", async () => {
        const requiredFields = ["name", "email", "password", "phone", "address", "answer"];
        
        for (const field of requiredFields) {
          req.body = { name: "n", email: "e", password: "p", phone: "ph", address: "a", answer: "ans" };
          delete req.body[field];
          
          await registerController(req, res);
          
          if (field === "name") {
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Name is required") }));
          } else {
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Email is required") }));
          }
        }
      });
  
      it("should block duplicate registration with 200 status", async () => {
        req.body = { 
          name: "n", 
          email: "existing@test.com", 
          password: "p", 
          phone: "ph", 
          address: "a", 
          answer: "ans" 
        };
        
        userModel.findOne.mockResolvedValue({ email: "existing@test.com" });
      
        await registerController(req, res);
      
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "existing@test.com" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ 
          success: false, 
          message: "Already registered, please login"
        }));
      });
  
      it("should hash password and save new user successfully", async () => {
        req.body = { name: "John", email: "new@test.com", password: "p123", phone: "123", address: "addr", answer: "blue" };
        userModel.findOne.mockResolvedValue(null);
        hashPassword.mockResolvedValue("hashed_p123");
        
        const saveMock = jest.fn().mockResolvedValue(req.body);
        userModel.prototype.save = saveMock;
  
        await registerController(req, res);
  
        expect(hashPassword).toHaveBeenCalledWith("p123");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "User registered successfully" }));
      });
  
      it("should handle save failure in catch block with 500 status", async () => {
        req.body = { name: "John", email: "new@test.com", password: "p", phone: "ph", address: "a", answer: "ans" };
        userModel.findOne.mockRejectedValue(new Error("Database Error"));
  
        await registerController(req, res);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Failed to register user" }));
      });
    });
  
    describe("loginController", () => {
      it("should reject if email or password is missing with 404", async () => {
        req.body = { email: "" }; // missing password
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
  
        req.body = { password: "p" }; // missing email
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
  
      it("should deny access if password comparison fails", async () => {
        req.body = { email: "user@test.com", password: "wrong" };
        userModel.findOne.mockResolvedValue({ email: "user@test.com", password: "hashed" });
        comparePassword.mockResolvedValue(false);
  
        await loginController(req, res);
  
        expect(res.status).toHaveBeenCalledWith(401); 
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid password" }));
      });
  
      it("should login successfully and return JWT", async () => {
        const mockUser = { _id: "1", name: "J", email: "e", password: "h", role: 0 };
        req.body = { email: "e", password: "p" };
        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockReturnValue("mock_token");
  
        await loginController(req, res);
  
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: "mock_token" }));
      });
    });
  
    describe("forgotPasswordController", () => {
      it("should return 404 if email or answer is incorrect", async () => {
        req.body = { email: "e", answer: "a", newPassword: "np" };
        userModel.findOne.mockResolvedValue(null);
  
        await forgotPasswordController(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Wrong email or answer" }));
      });

      it("should return 400 if email, answer, or newPassword is missing", async () => {
        const fields = ["email", "answer", "newPassword"];
        for (const field of fields) {
          req.body = { email: "e", answer: "a", newPassword: "p" };
          delete req.body[field];
          await forgotPasswordController(req, res);
          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        }
      });
  
      it("should reset password successfully with valid credentials", async () => {
        req.body = { email: "e", answer: "a", newPassword: "newp" };
        userModel.findOne.mockResolvedValue({ _id: "123" });
        hashPassword.mockResolvedValue("hashed_newp");
  
        await forgotPasswordController(req, res);
  
        expect(hashPassword).toHaveBeenCalledWith("newp");
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("123", { password: "hashed_newp" });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });
  
    describe("testController", () => {
      it("should return Protected Routes message", () => {
        testController(req, res);
        expect(res.send).toHaveBeenCalledWith("Protected Routes");
      });
  
      it("should handle errors in catch block", () => {
        res.send.mockImplementationOnce(() => { throw new Error("Fail"); });
        
        testController(req, res);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(Error) }));
      });
    });
  });