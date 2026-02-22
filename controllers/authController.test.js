// Sun Zihan, A0259581R
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import orderModel from "../models/orderModel.js";
import { createMockReq, createMockRes } from "../__tests__/helpers/mockHelpers.js";

//Seah Yi Xun Ryo A0252602R, helper for orderModel.find().populate().populate() [and .sort()]
/**
 * chainable mock for orderModel.find().populate().populate() [and .sort()].
 * Assert only res.json/res.send(outcomes  only), no brittle coupling to exact chain structure that can change 
 * @param {Array|Error} result - Resolved value (array of orders) or rejection error
 * @param {{ withSort: boolean }} options - withSort: true for getAllOrdersController (adds .sort() in chain)
 */
function createOrderFindChain(result, options = {}) {
  const { withSort = false } = options;
  const isError = result instanceof Error;
  const thenable = isError
    ? { then: (_, rej) => rej(result), catch: (fn) => { fn(result); return thenable; } }
    : { then: (resolve) => resolve(result), catch: () => thenable };
  const sort = jest.fn().mockReturnValue(thenable);
  const populate2 = jest.fn().mockReturnValue(withSort ? { sort } : thenable);
  const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
  return { populate: populate1 };
}

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");
jest.mock("../models/orderModel.js");

describe("Auth Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
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

    it("should skip sending 500 error if headers are already sent", () => {
      res.headersSent = true; 
      res.status.mockImplementationOnce(() => {
        throw new Error("Caught error after headers sent");
      });

      testController(req, res);
      expect(res.status).not.toHaveBeenCalledWith(500);
    });
  });

  //Seah Yi Xun Ryo A0252602R
  // --- updateProfileController ---
  describe("updateProfileController", () => {
    let consoleLogSpy;

    beforeAll(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });
    afterAll(() => {
      consoleLogSpy.mockRestore();
    });

    it("should fetch current user with userModel.findById(req.user._id)", async () => {
      // Arrange
      const userId = "user123";
      const existingUser = { _id: userId, name: "Old", password: "oldHash", phone: "1", address: "addr" };
      req.user = { _id: userId };
      req.body = { name: "NewName" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...existingUser, name: "NewName" });

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });

    it("should return JSON error when password provided and length < 6 (no status set)", async () => {
      req.user = { _id: "user1" };
      req.body = { password: "12345" };
      const existingUser = { _id: "user1", name: "U", password: "h", phone: "1", address: "a" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);

      await updateProfileController(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/password|6|character/i),
        })
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should call hashPassword when password is provided and valid", async () => {
      req.user = { _id: "user1" };
      req.body = { password: "validpassword" };
      const existingUser = { _id: "user1", name: "U", password: "oldHash", phone: "1", address: "a" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);
      hashPassword.mockResolvedValue("newHashedPassword");
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...existingUser,
        password: "newHashedPassword",
      });

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith("validpassword");
    });

    it("should call findByIdAndUpdate with user id, update object, and { new: true }", async () => {
      const userId = "user456";
      const existingUser = { _id: userId, name: "Jane", password: "hash", phone: "99", address: "Home" };
      req.user = { _id: userId };
      req.body = { name: "Jane Doe", phone: "88" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: userId,
        name: "Jane Doe",
        password: "hash",
        phone: "88",
        address: "Home",
      });

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        {
          name: "Jane Doe",
          password: existingUser.password,
          phone: "88",
          address: "Home",
        },
        { new: true }
      );
    });

    it("should use name || user.name, phone || user.phone, address || user.address in update", async () => {
      const existingUser = { _id: "u1", name: "A", password: "p", phone: "1", address: "Addr" };
      req.user = { _id: "u1" };
      req.body = { address: "NewAddr" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...existingUser, address: "NewAddr" });

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "u1",
        {
          name: "A",
          password: "p",
          phone: "1",
          address: "NewAddr",
        },
        { new: true }
      );
    });

    it("should use hashedPassword || user.password when password is provided", async () => {
      req.user = { _id: "u1" };
      req.body = { password: "newpass6" };
      const existingUser = { _id: "u1", name: "A", password: "oldHash", phone: "1", address: "a" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);
      hashPassword.mockResolvedValue("newHash");
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...existingUser, password: "newHash" });

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({
          password: "newHash",
        }),
        { new: true }
      );
    });

    it("should not include email in findByIdAndUpdate update object", async () => {
      req.user = { _id: "u1" };
      req.body = { name: "X", email: "new@email.com", phone: "1", address: "a" };
      const existingUser = { _id: "u1", name: "Old", password: "p", phone: "1", address: "a" };
      userModel.findById = jest.fn().mockResolvedValue(existingUser);
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...existingUser, name: "X" });

      await updateProfileController(req, res);

      const updateArg = userModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArg).not.toHaveProperty("email");
      expect(updateArg.name).toBe("X");
    });

    it("should return 200 with success true, message and updatedUser on success", async () => {
      const updatedUser = { _id: "u1", name: "Updated", password: "h", phone: "1", address: "a" };
      req.user = { _id: "u1" };
      req.body = { name: "Updated" };
      userModel.findById = jest.fn().mockResolvedValue({ _id: "u1", name: "Old", password: "h", phone: "1", address: "a" });
      userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedUser);

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/profile.*updated|updated.*profile/i),
          updatedUser,
        })
      );
    });

    it("should return 400 with success false and error message when update fails", async () => {
      // Arrange
      req.user = { _id: "u1" };
      req.body = {};
      const dbError = new Error("Database error");
      userModel.findById = jest.fn().mockRejectedValue(dbError);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/updating profile|update.*profile/i),
          error: dbError,
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
    });
  });

  // --- getOrdersController (orders / user orders) ---
  describe("getOrdersController", () => {
    let consoleLogSpy;

    beforeAll(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });
    afterAll(() => {
      consoleLogSpy.mockRestore();
    });

    describe("Success Cases", () => {
      it("should return orders for authenticated user as JSON array", async () => {
        // Arrange
        const mockOrders = [
          { _id: "order1", buyer: "user123", products: [{ _id: "prod1", name: "Product 1" }], status: "Processing" },
          { _id: "order2", buyer: "user123", products: [{ _id: "prod2", name: "Product 2" }], status: "Shipped" },
        ];
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(mockOrders));

        // Act
        await getOrdersController(mockReq, mockRes);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
        expect(mockRes.json).toHaveBeenCalledTimes(1);
        expect(orderModel.find).toHaveBeenCalled();
      });

      it("should return empty array when user has no orders", async () => {
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain([]));

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith([]);
        expect(mockRes.json).toHaveBeenCalledTimes(1);
        expect(orderModel.find).toHaveBeenCalled();
      });

      it("should handle user with single order", async () => {
        const singleOrder = [{ _id: "order1", buyer: "user123", products: [{ _id: "prod1" }] }];
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(singleOrder));

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(singleOrder);
      });
    });

    describe("Failure Cases", () => {
      it("should return 500 error when database query fails", async () => {
        // Arrange
        const dbError = new Error("Database connection failed");
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(dbError));

        // Act
        await getOrdersController(mockReq, mockRes);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
            error: dbError,
          })
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
      });

      it("should return 500 error when find() throws error", async () => {
        const findError = new Error("Find operation failed");
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockImplementation(() => {
          throw findError;
        });

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
          })
        );
      });

      it("should return 500 error when populate() throws error", async () => {
        const populateError = new Error("Populate failed");
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(populateError));

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
            error: populateError,
          })
        );
      });

      it("should handle network timeout error", async () => {
        const timeoutError = new Error("ETIMEDOUT");
        timeoutError.code = "ETIMEDOUT";
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(timeoutError));

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
          })
        );
      });
    });

    describe("Edge Cases", () => {
      it("should handle undefined user object gracefully", async () => {
        const mockReq = createMockReq({ user: undefined });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(
          createOrderFindChain(new Error("Cannot read property _id"))
        );

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
      });

      it("should handle orders with null values in populated fields", async () => {
        const ordersWithNulls = [
          { _id: "order1", buyer: null, products: [null, { _id: "prod1" }] },
        ];
        const mockReq = createMockReq({ user: { _id: "user123" } });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(ordersWithNulls));

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(ordersWithNulls);
      });
    });
  });

  // --- getAllOrdersController (admin: all orders) ---
  describe("getAllOrdersController", () => {
    let consoleLogSpy;

    beforeAll(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });
    afterAll(() => {
      consoleLogSpy.mockRestore();
    });

    describe("Success Cases", () => {
      it("should return all orders as JSON array", async () => {
        // Arrange
        const mockOrders = [
          { _id: "order1", buyer: "user1", products: [{ _id: "prod1" }], status: "Processing", createdAt: "2024-01-01" },
          { _id: "order2", buyer: "user2", products: [{ _id: "prod2" }], status: "Shipped", createdAt: "2024-01-02" },
        ];
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(mockOrders, { withSort: true }));

        // Act
        await getAllOrdersController(mockReq, mockRes);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
        expect(mockRes.json).toHaveBeenCalledTimes(1);
        expect(orderModel.find).toHaveBeenCalledWith({});
      });

      it("should return empty array when there are no orders", async () => {
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain([], { withSort: true }));

        await getAllOrdersController(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith([]);
        expect(mockRes.json).toHaveBeenCalledTimes(1);
        expect(orderModel.find).toHaveBeenCalledWith({});
      });

    });

    describe("Failure Cases", () => {
      it("should return 500 when database query fails", async () => {
        const dbError = new Error("Database connection failed");
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(dbError, { withSort: true }));

        await getAllOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
            error: dbError,
          })
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
      });

      it("should return 500 when find() throws", async () => {
        const findError = new Error("Find operation failed");
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockImplementation(() => {
          throw findError;
        });

        await getAllOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
          })
        );
      });

      it("should return 500 when populate() rejects", async () => {
        const populateError = new Error("Populate failed");
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(populateError, { withSort: true }));

        await getAllOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
            error: populateError,
          })
        );
      });

      it("should return 500 on network timeout error", async () => {
        const timeoutError = new Error("ETIMEDOUT");
        timeoutError.code = "ETIMEDOUT";
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(createOrderFindChain(timeoutError, { withSort: true }));

        await getAllOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while getting orders",
          })
        );
      });
    });

    describe("Edge Cases", () => {
      it("should return orders with null populated fields as-is", async () => {
        const ordersWithNulls = [
          { _id: "order1", buyer: null, products: [null, { _id: "prod1" }] },
        ];
        const mockReq = createMockReq({ user: {} });
        const mockRes = createMockRes();
        orderModel.find = jest.fn().mockReturnValue(
          createOrderFindChain(ordersWithNulls, { withSort: true })
        );

        await getAllOrdersController(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(ordersWithNulls);
      });
    });
  });

  // --- orderStatusController (admin: update order status) ---
  describe("orderStatusController", () => {
    let consoleLogSpy;

    beforeAll(() => {
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });
    afterAll(() => {
      consoleLogSpy.mockRestore();
    });

    describe("Success Cases", () => {
      it("should receive orderId from req.params and status from req.body", async () => {
        // Arrange
        const orderId = "order123";
        const status = "Processing";
        const updatedOrder = { _id: orderId, status, buyer: "user1", products: [] };
        const mockReq = createMockReq({
          params: { orderId },
          body: { status },
          user: {},
        });
        const mockRes = createMockRes();
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);

        // Act
        await orderStatusController(mockReq, mockRes);

        // Assert
        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
          orderId,
          { status },
          { new: true }
        );
      });

      it("should call findByIdAndUpdate with orderId, { status }, { new: true } and return updated order as JSON", async () => {
        const orderId = "ord456";
        const status = "Shipped";
        const updatedOrder = { _id: orderId, status, buyer: "user2", products: [{ _id: "p1" }] };
        const mockReq = createMockReq({
          params: { orderId },
          body: { status },
          user: {},
        });
        const mockRes = createMockRes();
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);

        await orderStatusController(mockReq, mockRes);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
          orderId,
          { status },
          { new: true }
        );
        expect(mockRes.json).toHaveBeenCalledWith(updatedOrder);
        expect(mockRes.json).toHaveBeenCalledTimes(1);
      });

      it("should pass through status value from req.body (validation is in model enum)", async () => {
        const orderId = "ord789";
        const status = "Delivered";
        const updatedOrder = { _id: orderId, status };
        const mockReq = createMockReq({
          params: { orderId },
          body: { status },
          user: {},
        });
        const mockRes = createMockRes();
        orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedOrder);

        await orderStatusController(mockReq, mockRes);

        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
          orderId,
          { status: "Delivered" },
          { new: true }
        );
        expect(mockRes.json).toHaveBeenCalledWith(updatedOrder);
      });
    });

    describe("Failure Cases", () => {
      it("should return 500 and log error when findByIdAndUpdate fails", async () => {
        // Arrange
        const orderId = "order123";
        const status = "Processing";
        const dbError = new Error("Database update failed");
        const mockReq = createMockReq({
          params: { orderId },
          body: { status },
          user: {},
        });
        const mockRes = createMockRes();
        orderModel.findByIdAndUpdate = jest.fn().mockRejectedValue(dbError);

        // Act
        await orderStatusController(mockReq, mockRes);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while updating orders",
            error: dbError,
          })
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
      });

      it("should return 500 when findByIdAndUpdate throws synchronously", async () => {
        const updateError = new Error("Invalid order id");
        const mockReq = createMockReq({
          params: { orderId: "bad-id" },
          body: { status: "Shipped" },
          user: {},
        });
        const mockRes = createMockRes();
        orderModel.findByIdAndUpdate = jest.fn().mockImplementation(() => {
          throw updateError;
        });

        await orderStatusController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error while updating orders",
          })
        );
      });
    });
  });
});