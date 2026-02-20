import mongoose from "mongoose";
import orderModel from "./orderModel.js";

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
    test("products is an array of ObjectIds referencing Products", () => {
      const path = orderModel.schema.path("products");
      expect(path).toBeDefined();
      expect(path.instance).toBe("Array");
      expect(path.caster?.instance).toBe("ObjectId");
      expect(path.caster?.options?.ref).toBe("Products");
    });

    test("payment is an object (no strict validation)", () => {
      const path = orderModel.schema.path("payment");
      expect(path).toBeDefined();
    });

    test("buyer is ObjectId referencing users", () => {
      const path = orderModel.schema.path("buyer");
      expect(path).toBeDefined();
      expect(path.instance).toBe("ObjectId");
      expect(path.options.ref).toBe("users");
    });

    test("status is a String", () => {
      const path = orderModel.schema.path("status");
      expect(path).toBeDefined();
      expect(path.instance).toBe("String");
    });
  });

  describe("Default status", () => {
    test('default status is "Not Process" when status is not provided', () => {
      const doc = new orderModel({
        products: [],
        payment: {},
        buyer: validOrderId(),
      });
      expect(doc.status).toBe("Not Process");
    });
  });

  describe("Status enum validation", () => {
    const validStatuses = ["Not Process", "Processing", "Shipped", "deliverd", "cancel"];

    validStatuses.forEach((status) => {
      test(`accepts valid status "${status}"`, () => {
        const doc = new orderModel({ ...validDoc, status });
        const err = doc.validateSync();
        expect(err).toBeUndefined();
      });
    });

    test("rejects invalid status with validation error", () => {
      const doc = new orderModel({ ...validDoc, status: "InvalidStatus" });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });

    test("rejects empty string status", () => {
      const doc = new orderModel({ ...validDoc, status: "" });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.status).toBeDefined();
    });
  });

  describe("Timestamps", () => {
    test("timestamps option is enabled", () => {
      expect(orderModel.schema.options.timestamps).toBe(true);
    });

    test("schema has createdAt and updatedAt paths", () => {
      expect(orderModel.schema.path("createdAt")).toBeDefined();
      expect(orderModel.schema.path("updatedAt")).toBeDefined();
    });
  });

  describe("Product references", () => {
    test("products array accepts multiple ObjectIds", () => {
      const productIds = [validProductId(), validProductId(), validProductId()];
      const doc = new orderModel({ ...validDoc, products: productIds });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.products).toHaveLength(3);
    });

    test("products array can be empty", () => {
      const doc = new orderModel({ ...validDoc, products: [] });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.products).toHaveLength(0);
    });

    test("products array rejects non-ObjectId values", () => {
      const doc = new orderModel({ ...validDoc, products: ["not-an-objectid", 123] });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors["products.0"] || err.errors.products).toBeDefined();
    });
  });

  describe("Buyer reference", () => {
    test("buyer accepts valid ObjectId", () => {
      const doc = new orderModel(validDoc);
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.buyer).toBeDefined();
    });

    test("buyer rejects invalid ObjectId", () => {
      const doc = new orderModel({ ...validDoc, buyer: "not-an-objectid" });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.buyer).toBeDefined();
    });
  });

  describe("Payment field", () => {
    test("payment accepts empty object", () => {
      const doc = new orderModel({ ...validDoc, payment: {} });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.payment).toEqual({});
    });

    test("payment accepts arbitrary object structure", () => {
      const doc = new orderModel({
        ...validDoc,
        payment: { method: "card", id: "pay_123", amount: 99 },
      });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.payment).toEqual({ method: "card", id: "pay_123", amount: 99 });
    });
  });

  describe("Minimal required fields", () => {
    test("order can be created with products array, payment object, and buyer ObjectId", () => {
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

    test("valid full document has no validation error", () => {
      const doc = new orderModel(validDoc);
      expect(doc.validateSync()).toBeUndefined();
    });
  });
});
