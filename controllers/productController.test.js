import fs from "fs";
import slugify from "slugify";
import productModel from "../models/productModel.js";
import {
    validateProductFields,
    attachPhotoIfPresent,
    saveProductService,
    createProductController,
    deleteProductController,
    updateProductController,
    getProductController,
    getSingleProductController,
    productPhotoController
} from "./productController.js";

//Chen Zhiruo A0256855N
jest.mock("fs", () => ({
    readFileSync: jest.fn(),
}));
jest.mock('slugify');
jest.mock("../models/productModel.js");

function makeThenableQuery(value) {
    const chain = {
        populate: jest.fn(() => chain),
        select: jest.fn(() => chain),
        limit: jest.fn(() => chain),
        sort: jest.fn(() => chain),
        skip: jest.fn(() => chain),
        then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
        catch: (reject) => Promise.resolve(value).catch(reject),
    };
    return chain;
}

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

function makeReq({
                     fields = {},
                     files = {},
                 } = {}) {
    return { fields, files };
}


beforeEach(() => {
    jest.clearAllMocks();
});

describe("validateProductFields", () => {
    test("returns 400 when name missing", () => {
        expect(validateProductFields({}, {})).toEqual({
            status: 400,
            error: "Name is Required",
        });
    });
    test("returns 400 when description missing", () => {
        expect(
            validateProductFields({ name: "mockName" }, {})
        ).toEqual({ status: 400, error: "Description is Required" });
    });

    test("returns 400 when price missing", () => {
        expect(
            validateProductFields({ name: "mockName", description: "mockDesc" }, {})
        ).toEqual({ status: 400, error: "Price is Required" });
    });
    test("returns 400 when category missing", () => {
        expect(
            validateProductFields({ name: "mockName", description: "mockDesc", price: 1 }, {})
        ).toEqual({ status: 400, error: "Category is Required" });
    });
    test("returns 400 when quantity missing", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory" },
                {}
            )
        ).toEqual({ status: 400, error: "Quantity is Required" });
    });
    test("returns 400 when photo too large (> 1000000)", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                { photo: { size: 1_000_001 } }
            )
        ).toEqual({ status: 400, error: "Photo should be less then 1mb" });
    });
    test("returns null when photo is 1mb", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                { photo: { size: 1_000_000 } }
            )
        ).toBeNull();
    });
    test("returns null when everything without a photo is valid", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                {}
            )
        ).toBeNull();
    });
    test("returns null when everything with a photo is valid", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                { photo: { size: 1_000_000 } }
            )
        ).toBeNull();
    });
});

describe("attachPhotoIfPresent", () => {
    describe("when no photo is provided", () => {
        let productDoc;
        let readFile;
        beforeEach(() => {
            //arrange
            productDoc = { photo: { data: null, contentType: null } };
            readFile = jest.fn();
            //act
            attachPhotoIfPresent(productDoc, null, readFile);
        });

        test("readFile won't be called", () => {
            expect(readFile).not.toHaveBeenCalled();
        });

        test("product's photo data stays null", () => {
            expect(productDoc.photo.data).toBeNull();
        });

        test("product's photo contentType stays null", () => {
            expect(productDoc.photo.contentType).toBeNull();
        });
    });
    describe("when photo is provided", () => {
        let productDoc;
        let readFile;
        let buf;
        //arrange
        beforeEach(() => {
            //arrange
            productDoc = { photo: {} };
            readFile = jest.fn(() => buf);
            buf = Buffer.from("abc");
            //act
            attachPhotoIfPresent(productDoc, { path: "/tmp/x", type: "image/png" }, readFile);
        });
        test("readFile to be called with path", () => {
            expect(readFile).toHaveBeenCalledWith("/tmp/x");
        });
        test("product photo data to be buf", () => {
            expect(productDoc.photo.data).toBe(buf);
        });
        test("product photo content type to be image", () => {
            expect(productDoc.photo.contentType).toBe("image/png");
        });
    });
});

describe("saveProductService", () => {
    const makeProductDoc = (overrides = {}) => ({
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        photo: { data: null, contentType: null },
        ...overrides,
    });
    const validFields = {
        name: "mockName",
        description: "mockDesc",
        price: 1,
        category: "mockCat",
        quantity: 1,
    };
    beforeEach(() => {
        jest.clearAllMocks();
        slugify.mockReturnValue("mock-name");
    });
    describe("when validation fails", () => {
        let res, productDoc, readFile, fields, files;

        beforeEach(async () => {
            productDoc = makeProductDoc();
            readFile = jest.fn();

            fields = { ...validFields, name: "" };
            files = {};

            res = await saveProductService({ productDoc, fields, files, readFile });
        });

        test("returns ok:false", () => {
            expect(res.ok).toBe(false);
        });

        test("returns status 400", () => {
            expect(res.status).toBe(400);
        });

        test("does not call slugify", () => {
            expect(slugify).not.toHaveBeenCalled();
        });

        test("does not call productDoc.set", () => {
            expect(productDoc.set).not.toHaveBeenCalled();
        });

        test("does not call productDoc.save", () => {
            expect(productDoc.save).not.toHaveBeenCalled();
        });

        test("does not call readFile", () => {
            expect(readFile).not.toHaveBeenCalled();
        });
    });
    describe("when validation passes with photo", () => {
        let productDoc, readFile, files;
        beforeEach(async () => {
            productDoc = {
                set: jest.fn(),
                save: jest.fn().mockResolvedValue(undefined),
                photo: { data: null, contentType: null },
            };

            readFile = jest.fn().mockReturnValue(Buffer.from("img"));
            files = { photo: { size: 10, path: "/tmp/p.png", type: "image/png" } };
            await saveProductService({ productDoc, fields: validFields, files, readFile });
        });

        test("calls productDoc.set", () => {
            expect(productDoc.set).toHaveBeenCalledTimes(1);
        });

        test("calls readFile", () => {
            expect(readFile).toHaveBeenCalledTimes(1);
        });

        test("calls readFile with photo.path", () => {
            expect(readFile).toHaveBeenCalledWith("/tmp/p.png");
        });

        test("calls productDoc.save", () => {
            expect(productDoc.save).toHaveBeenCalledTimes(1);
        });
    });
    describe("when validation passes without photo", () => {
        let productDoc, readFile, files;

        beforeEach(async () => {
            productDoc = makeProductDoc();
            readFile = jest.fn();
            files = {};

            await saveProductService({ productDoc, fields: validFields, files, readFile });
        });

        test("calls productDoc.set", () => {
            expect(productDoc.set).toHaveBeenCalledTimes(1);
        });

        test("does not call readFile", () => {
            expect(readFile).not.toHaveBeenCalled();
        });

        test("calls productDoc.save", () => {
            expect(productDoc.save).toHaveBeenCalledTimes(1);
        });
    });
});

describe("createProductController", () => {
    describe("when creating invalid product", () => {
        let res, req;
        beforeEach(async () => {
            res = makeRes();
            req = { fields: {}, files: {} };
            await createProductController(req, res);
        });
        test("return 400 status code", async () => {
            expect(res.status).toHaveBeenCalledWith(400);
        });
        test("error response sent", async () => {
            expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
        });
    });
    describe("upon successful product creation", () => {
        let res, req, productDoc;
        beforeEach(async () => {
            res = makeRes();
            req = {
                fields: { name: "A", description: "D", price: 1, category: "C", quantity: 1 },
                files: { photo: { path: "/tmp/p", type: "image/png", size: 100 } },
            };

            fs.readFileSync.mockReturnValue(Buffer.from("img"));

            productDoc = { set: jest.fn(), save: jest.fn(), photo: {} };
            productModel.mockImplementation(() => productDoc);

            await createProductController(req, res);
        });
        test("return 201 status code", async () => {
            expect(res.status).toHaveBeenCalledWith(201);
        });
        test("success response sent with object containing product created", async () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Product Created Successfully",
                    products: productDoc,
                })
            );
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => (statusCode = code, res));
            res.send = jest.fn((body) => (sentBody = body, res));

            const req = { fields: { name: "mockName" }, files: {} };

            productModel.mockImplementation(() => {
                throw new Error("create fail");
            });

            await createProductController(req, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });

        test("sends error response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Error in creating product",
                })
            );
        });
    });
});

describe("getProductController", () => {
    describe("upon successful call", () => {
        let res;
        let chain;
        const products = [{ _id: 1 }, { _id: 2 }];

        beforeEach(async () => {
            res = makeRes();
            chain = makeThenableQuery(products);
            productModel.find.mockReturnValue(chain);
            await getProductController({}, res);
        });

        test("calls find", () => {
            expect(productModel.find).toHaveBeenCalledWith({});
        });

        test('populates category', () => {
            expect(chain.populate).toHaveBeenCalledWith("category");
        });

        test('selects photo', () => {
            expect(chain.select).toHaveBeenCalledWith("-photo");
        });

        test("limits to 12", () => {
            expect(chain.limit).toHaveBeenCalledWith(12);
        });

        test("sorts by createdAt descending", () => {
            expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
        });

        test("returns 200", () => {
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("sends payload with countTotal==2", () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ countTotal: 2 })
            );
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));
            productModel.find.mockImplementation(() => {
                throw new Error("get product fail");
            });
            await getProductController({}, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });

        test("sends error response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Error in getting products",
                    error: "get product fail",
                })
            );
        });
    });
});

describe("getSingleProductController", () => {
    describe("upon successful call", () => {
        let res;
        let chain;
        const product = { _id: 10, slug: "abc" };

        beforeEach(async () => {
            res = makeRes();
            chain = makeThenableQuery(product);
            productModel.findOne.mockReturnValue(chain);
            const req = { params: { slug: "abc" } };
            await getSingleProductController(req, res);
        });

        test("calls findOne with slug filter", () => {
            expect(productModel.findOne).toHaveBeenCalledWith({ slug: "abc" });
        });

        test('selects photo', () => {
            expect(chain.select).toHaveBeenCalledWith("-photo");
        });

        test('populates category', () => {
            expect(chain.populate).toHaveBeenCalledWith("category");
        });

        test("returns 200", () => {
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("sends payload containing product", () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ product })
            );
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));
            const req = { params: { slug: "bad-slug" } };
            productModel.findOne.mockImplementation(() => {
                throw new Error("get single product fail");
            });
            await getSingleProductController(req, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Error while getting single product",
                    error: "get single product fail",
                })
            );
        });
    });
});

describe("productPhotoController", () => {
    describe("when product is not found", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {
                status: jest.fn((code) => ((statusCode = code), res)),
                send: jest.fn((body) => ((sentBody = body), res)),
                set: jest.fn(() => res),
            };

            productModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            const req = { params: { pid: "p1" } };

            await productPhotoController(req, res);
        });
        test("returns 404 status code", () => {
            expect(statusCode).toBe(404);
        });
        test("sends product not found response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Product not found",
                })
            );
        });
    });
    describe("when product exists but product photo is missing", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {
                status: jest.fn((code) => ((statusCode = code), res)),
                send: jest.fn((body) => ((sentBody = body), res)),
                set: jest.fn(() => res),
            };

            const product = {};
            productModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(product),
            });

            const req = { params: { pid: "p1" } };
            await productPhotoController(req, res);
        });
        test("returns 404 status code", () => {
            expect(statusCode).toBe(404);
        });
        test("sends product photo not found response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Product Photo not found",
                })
            );
        });
    });
    describe("upon successful call", () => {
        let statusCode, sentData;
        let setCalls;
        beforeAll(async () => {
            setCalls = [];
            const res = {
                status: jest.fn((code) => ((statusCode = code), res)),
                send: jest.fn((body) => ((sentData = body), res)),
                set: jest.fn((k, v) => (setCalls.push([k, v]), res)),
            };
            const buf = Buffer.from("img");
            const product = {
                photo: { data: buf, contentType: "image/png" },
            };
            productModel.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(product),
            });
            const req = { params: { pid: "p1" } };
            await productPhotoController(req, res);
        });
        test("set call params", () => {
            expect(setCalls).toContainEqual(["Content-type", "image/png"]);
        });

        test("returns 200 status code", () => {
            expect(statusCode).toBe(200);
        });

        test("sends photo buffer", () => {
            expect(Buffer.isBuffer(sentData)).toBe(true);
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {
                status: jest.fn((code) => ((statusCode = code), res)),
                send: jest.fn((body) => ((sentBody = body), res)),
                set: jest.fn(() => res),
            };
            productModel.findById.mockImplementation(() => {
                throw new Error("get product photo fail");
            });
            const req = { params: { pid: "p1" } };
            await productPhotoController(req, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Error while getting photo",
                    error: "get product photo fail",
                })
            );
        });
    });
});

describe("deleteProductController", () => {
    describe("upon successful deletion", () => {
        let res, req, chain;
        beforeEach(async () => {
            req = { params: { pid: "p1" } };
            res = makeRes();
            chain = { select: jest.fn().mockResolvedValue({ ok: 1 }) };
            productModel.findByIdAndDelete.mockReturnValue(chain);

            await deleteProductController(req, res);
        });
        test("calls findByIdAndDelete with pid", () => {
            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("p1");
        });

        test('calls select("-photo") on the delete query', () => {
            expect(chain.select).toHaveBeenCalledWith("-photo");
        });

        test("returns 200 status code", () => {
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("sends success response", () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Product Deleted successfully",
                })
            );
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => (statusCode = code, res));
            res.send = jest.fn((body) => (sentBody = body, res));

            const req = { params: { pid: "p1" } };

            productModel.findByIdAndDelete.mockImplementation(() => {
                throw new Error("delete fail");
            });

            await deleteProductController(req, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });

        test("sends error response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Error while deleting product",
                })
            );
        });
    });
});

describe("updateProductController", () => {
    describe("when product not found", () => {
        let res;
        beforeEach(async () => {
            res = makeRes();
            productModel.findById.mockResolvedValue(null);
            await updateProductController({ params: { pid: "p1" }, fields: {}, files: {} }, res);
        });
        test("return status 404", async () => {
            expect(res.status).toHaveBeenCalledWith(404);
        });
        test("error response sent", async () => {
            expect(res.send).toHaveBeenCalledWith({ error: "Product not found" });
        });
    });
    describe("when updating invalid product", () => {
        let res;
        beforeEach(async () => {
            res = makeRes();
            const productDoc = { set: jest.fn(), save: jest.fn(), photo: {} };
            productModel.findById.mockResolvedValue(productDoc);

            await updateProductController({ params: { pid: "p1" }, fields: {}, files: {} }, res);
        });
        test("return status 400", async () => {
            expect(res.status).toHaveBeenCalledWith(400);
        });
        test("error response", async () => {
            expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
        });
    });
    describe("upon successful product update", () => {
        let res, req, productDoc;
        beforeEach(async () => {
            res = makeRes();
            productDoc = { set: jest.fn(), save: jest.fn(), photo: {} };
            productModel.findById.mockResolvedValue(productDoc);

            req = {
                params: { pid: "p1" },
                fields: { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                files: {},
            };

            await updateProductController(req, res);
        });
        test("return 200 status code", async () => {
            expect(res.status).toHaveBeenCalledWith(200);
        });
        test("success response sent with object containing updated product", async () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Product Updated Successfully",
                    products: productDoc,
                })
            );
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => {
                statusCode = code;
                return res;
            });
            res.send = jest.fn((body) => {
                sentBody = body;
                return res;
            });
            productModel.findById.mockRejectedValue(new Error("update fail"));

            await updateProductController(
                { params: { pid: "p1" }, fields: {}, files: {} },
                res
            );
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Error in updating product",
                })
            );
        });
    });
});

