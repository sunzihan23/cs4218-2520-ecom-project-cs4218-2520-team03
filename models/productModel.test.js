import mongoose from "mongoose";
import productModel from "./productModel.js"; // adjust path if needed

//Chen Zhiruo A0256855N

describe("Products model schema", () => {
    let validDoc;

    beforeEach(() => {
        validDoc = {
            name: "Test Product",
            slug: "test-product",
            description: "desc",
            price: 10,
            category: new mongoose.Types.ObjectId(),
            quantity: 5,
            photo: {
                data: Buffer.from("abc"),
                contentType: "image/png",
            },
            shipping: false,
        };
    });
    test("timestamps is enabled", () => {
        expect(productModel.schema.options.timestamps).toBe(true);
    });
    test("name is required", () => {
        const doc = new productModel({ ...validDoc, name: undefined });
        expect(doc.validateSync().errors.name).toBeDefined();
    });
    test("slug is required", () => {
        const doc = new productModel({ ...validDoc, slug: undefined });
        expect(doc.validateSync().errors.slug).toBeDefined();
    });
    test("description is required", () => {
        const doc = new productModel({ ...validDoc, description: undefined });
        expect(doc.validateSync().errors.description).toBeDefined();
    });
    test("price is required", () => {
        const doc = new productModel({ ...validDoc, price: undefined });
        expect(doc.validateSync().errors.price).toBeDefined();
    });
    test("category is required", () => {
        const doc = new productModel({ ...validDoc, category: undefined });
        expect(doc.validateSync().errors.category).toBeDefined();
    });
    test("quantity is required", () => {
        const doc = new productModel({ ...validDoc, quantity: undefined });
        expect(doc.validateSync().errors.quantity).toBeDefined();
    });
    test("shipping is required", () => {
        const doc = new productModel({ ...validDoc, shipping: undefined });
        expect(doc.validateSync().errors.shipping).toBeDefined();
    });
    test("photo.data is required", () => {
        const doc = new productModel({
            ...validDoc,
            photo: { ...validDoc.photo, data: undefined },
        });
        expect(doc.validateSync().errors["photo.data"]).toBeDefined();
    });
    test("photo.contentType is required", () => {
        const doc = new productModel({
            ...validDoc,
            photo: { ...validDoc.photo, contentType: undefined },
        });
        expect(doc.validateSync().errors["photo.contentType"]).toBeDefined();
    });
    test("category must be a valid ObjectId", () => {
        const doc = new productModel({ ...validDoc, category: "not-an-objectid" });
        expect(doc.validateSync().errors.category).toBeDefined();
    });
    test("valid document has no validation error", () => {
        const doc = new productModel(validDoc);
        expect(doc.validateSync()).toBeUndefined();
    });
    test("photo.data accepts Buffer", () => {
        const doc = new productModel({
            ...validDoc,
            photo: { ...validDoc.photo, data: Buffer.from([1, 2, 3]) },
        });
        expect(doc.validateSync()).toBeUndefined();
    });
});
