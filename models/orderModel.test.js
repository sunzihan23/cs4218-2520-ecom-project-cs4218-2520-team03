import mongoose from "mongoose";
import orderModel from "./orderModel.js";
//Seah Yi Xun Ryo A0252602R, tests for orderModel.js
const validOrderId = () => new mongoose.Types.ObjectId();
const validProductId = () => new mongoose.Types.ObjectId();

describe("Order model schema", () => {
  let validDoc;

  beforeEach(() => {
    validDoc = {
      products: [validProductId(), validProductId()],
      payment: {},
      buyer: validOrderId(),
      status: "Processing",
    };
  });

  describe("Schema structure", () => {
    test("should define products as array of ObjectIds referencing Products", () => {
      // Arrange & Act
      const path = orderModel.schema.path("products");
      // Assert
      expect(path).toBeDefined();
      expect(path.instance).toBe("Array");
      expect(path.caster?.instance).toBe("ObjectId");
      expect(path.caster?.options?.ref).toBe("Products");
    });

    test("should define payment as object (no strict validation)", () => {
      const path = orderModel.schema.path("payment");
      expect(path).toBeDefined();
    });

    test("should define buyer as ObjectId referencing users", () => {
      const path = orderModel.schema.path("buyer");
      expect(path).toBeDefined();
      expect(path.instance).toBe("ObjectId");
      expect(path.options.ref).toBe("users");
    });

    test("should define status as String", () => {
      const path = orderModel.schema.path("status");
      expect(path).toBeDefined();
      expect(path.instance).toBe("String");
    });
  });

  describe("Default status", () => {
    test('should default status to "Not Process" when status is not provided', () => {
      // Arrange & Act
      const doc = new orderModel({
        products: [],
        payment: {},
        buyer: validOrderId(),
      });
      // Assert
      expect(doc.status).toBe("Not Process");
    });
  });

  describe("Status enum validation", () => {
    const validStatuses = ["Not Process", "Processing", "Shipped", "deliverd", "cancel"];

    validStatuses.forEach((status) => {
      test(`should accept valid status "${status}"`, () => {
        const doc = new orderModel({ ...validDoc, status });
        const err = doc.validateSync();
        expect(err).toBeUndefined();
      });
    });

    test("should reject invalid status with validation error", () => {
      // Arrange & Act
      const doc = new orderModel({ ...validDoc, status: "InvalidStatus" });
      const err = doc.validateSync();
      // Assert
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    test("should reject empty string status", () => {
      const doc = new orderModel({ ...validDoc, status: "" });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });
  });

  describe("Timestamps", () => {
    test("should have timestamps option enabled", () => {
      expect(orderModel.schema.options.timestamps).toBe(true);
    });

    test("should have createdAt and updatedAt paths", () => {
      expect(orderModel.schema.path("createdAt")).toBeDefined();
      expect(orderModel.schema.path("updatedAt")).toBeDefined();
    });
  });

  describe("Product references", () => {
    test("should accept multiple ObjectIds in products array", () => {
      const productIds = [validProductId(), validProductId(), validProductId()];
      const doc = new orderModel({ ...validDoc, products: productIds });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.products).toHaveLength(3);
    });

    test("should allow empty products array", () => {
      const doc = new orderModel({ ...validDoc, products: [] });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.products).toHaveLength(0);
    });

    test("should reject non-ObjectId values in products array", () => {
      const doc = new orderModel({ ...validDoc, products: ["not-an-objectid", 123] });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors["products.0"] || err.errors.products).toBeDefined();
    });
  });

  describe("Buyer reference", () => {
    test("should accept valid ObjectId for buyer", () => {
      const doc = new orderModel(validDoc);
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.buyer).toBeDefined();
    });

    test("should reject invalid ObjectId for buyer", () => {
      const doc = new orderModel({ ...validDoc, buyer: "not-an-objectid" });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.buyer).toBeDefined();
    });
  });

  describe("Payment field", () => {
    test("should accept empty object for payment", () => {
      const doc = new orderModel({ ...validDoc, payment: {} });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.payment).toEqual({});
    });

    test("should accept arbitrary object structure for payment", () => {
      const doc = new orderModel({
        ...validDoc,
        payment: { method: "card", id: "pay_123", amount: 99 },
      });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.payment).toEqual({ method: "card", id: "pay_123", amount: 99 });
    });
  });

  describe("Minimal required fields", () => {
    test("should create order with products array, payment object, and buyer ObjectId", () => {
      const doc = new orderModel({
        products: [],
        payment: {},
        buyer: validOrderId(),
      });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.status).toBe("Not Process");
      expect(doc.products).toEqual([]);
      expect(doc.payment).toEqual({});
      expect(doc.buyer).toBeDefined();
    });

    test("should pass validation for valid full document", () => {
      const doc = new orderModel(validDoc);
      expect(doc.validateSync()).toBeUndefined();
    });
  });
});
