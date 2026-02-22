// Chen Peiran, A0257826R
import mongoose from "mongoose";
import userModel from "./userModel.js";

describe("User model schema", () => {
    let validDoc;

    beforeEach(() => {
        validDoc = {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: { street: "123 Main St", city: "Test City" },
            answer: "test answer",
            role: 0,
        };
    });

    it("name is required", () => {
        const doc = new userModel({ ...validDoc, name: undefined });
        expect(doc.validateSync().errors.name).toBeDefined();
    });

    it("name has trim option", () => {
        expect(userModel.schema.paths.name.options.trim).toBe(true);
    });

    it("email is required", () => {
        const doc = new userModel({ ...validDoc, email: undefined });
        expect(doc.validateSync().errors.email).toBeDefined();
    });

    it("email has unique constraint", () => {
        expect(userModel.schema.paths.email.options.unique).toBe(true);
    });

    it("password is required", () => {
        const doc = new userModel({ ...validDoc, password: undefined });
        expect(doc.validateSync().errors.password).toBeDefined();
    });

    it("phone is required", () => {
        const doc = new userModel({ ...validDoc, phone: undefined });
        expect(doc.validateSync().errors.phone).toBeDefined();
    });

    it("address is required", () => {
        const doc = new userModel({ ...validDoc, address: undefined });
        expect(doc.validateSync().errors.address).toBeDefined();
    });

    it("answer is required", () => {
        const doc = new userModel({ ...validDoc, answer: undefined });
        expect(doc.validateSync().errors.answer).toBeDefined();
    });

    it("role has default value of 0", () => {
        expect(userModel.schema.paths.role.defaultValue).toBe(0);
    });

    it("valid document has no validation error", () => {
        const doc = new userModel(validDoc);
        expect(doc.validateSync()).toBeUndefined();
    });

    it("timestamps is enabled", () => {
        expect(userModel.schema.options.timestamps).toBe(true);
    });


    it("should define name as a String", () => {
        expect(userModel.schema.paths.name.instance).toBe("String");
    })

    it("should define email as a String", () => {
        expect(userModel.schema.paths.email.instance).toBe("String");
    })

    it("should define password as a String", () => {
        expect(userModel.schema.paths.password.instance).toBe("String");
    })

    it("should define phone as a String", () => {
        expect(userModel.schema.paths.phone.instance).toBe("String");
    })

    it("should define address as a Mixed type", () => {
        expect(userModel.schema.paths.address.instance).toBe("Mixed");
    })

    it("should define answer as a String", () => {
        expect(userModel.schema.paths.answer.instance).toBe("String");
    })

    it("should define role as a Number", () => {
        expect(userModel.schema.paths.role.instance).toBe("Number");
    })


    it("should not create a user document without a name", () => {
        const user = new userModel({
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: { street: "123 Main St", city: "Test City" },
            answer: "test answer"
        });

        expect(user.validateSync().errors.name).toBeDefined();
    });

    it("should not create a user document without an email", () => {
        const user = new userModel({
            name: "Test User",
            password: "password123",
            phone: "1234567890",
            address: { street: "123 Main St", city: "Test City" },
            answer: "test answer"
        });

        expect(user.validateSync().errors.email).toBeDefined();
    });

    it("should not create a user document without a password", () => {
        const user = new userModel({
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            address: { street: "123 Main St", city: "Test City" },
            answer: "test answer"
        });

        expect(user.validateSync().errors.password).toBeDefined();
    });

    it("should not create a user document without phone", () => {
        const user = new userModel({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            address: { street: "123 Main St", city: "Test City" },
            answer: "test answer"
        });

        expect(user.validateSync().errors.phone).toBeDefined();
    });

    it("should not create a user document without address", () => {
        const user = new userModel({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            answer: "test answer"
        });

        expect(user.validateSync().errors.address).toBeDefined();
    });

    it("should not create a user document without answer", () => {
        const user = new userModel({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: { street: "123 Main St", city: "Test City" },
        });

        expect(user.validateSync().errors.answer).toBeDefined();
    });

});