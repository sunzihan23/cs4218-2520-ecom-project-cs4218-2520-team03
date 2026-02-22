// Chen Peiran, A0257826R
import mongoose from "mongoose";
import categoryModel from "./categoryModel.js";

describe("Category model schema", () => {
    let validDoc;

    beforeEach(() => {
        validDoc = {
            name: "Test Category",
            slug: "test-category",
        };
    });

    it("should require name", () => {
        const invalidDoc = new categoryModel({ ...validDoc, name: undefined });
        expect(invalidDoc.validateSync().errors.name).toBeDefined();
    });

    it("should define name as a String", () => {
        expect(categoryModel.schema.paths.name.instance).toBe("String");
    })

    it("should have unique constraint on name", () => {
        expect(categoryModel.schema.paths.name.options.unique).toBe(true);
    });

    it("should define slug as a String", () => {
        expect(categoryModel.schema.paths.slug.instance).toBe("String");
    });

    it("should have lowercase transform on slug", () => {
        expect(categoryModel.schema.paths.slug.options.lowercase).toBe(true);
    });

    it("should transform slug to lowercase", () => {
        const invalidDoc = new categoryModel({ ...validDoc, slug: "TEST" });
        expect(invalidDoc.slug).toBe("test");
    });

    it("valid document has no validation error", () => {
        const doc = new categoryModel(validDoc);
        expect(doc.validateSync()).toBeUndefined();
    });

    it("should create a category document successfully with a valid name and slug", () => {
        const category = new categoryModel(validDoc);
        expect(category.name).toBe(validDoc.name);
        expect(category.slug).toBe(validDoc.slug);
    });

    it("should not create a category document without a name", () => {
        const category = new categoryModel({ slug: "test-category" });
        expect(category.validateSync().errors.name).toBeDefined();
    });

    it("should still create a category document without a slug", () => {
        const category = new categoryModel({ name: "Test Category" });
        expect(category.name).toBe("Test Category");
        expect(category.slug).toBeUndefined();
    });
});