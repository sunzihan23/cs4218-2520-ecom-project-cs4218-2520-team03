import fs from "fs";
import slugify from "slugify";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import {
    validateProductFields,
    attachPhoto,
    saveProductService,
    createProductController,
    deleteProductController,
    updateProductController,
    getProductController,
    getSingleProductController,
    productPhotoController,
    productFiltersController,
    productCountController,
    productListController,
    searchProductController,
    relatedProductController,
    productCategoryController,
} from "./productController.js";

//Chen Zhiruo A0256855N
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));
jest.mock("slugify");
jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("validateProductFields", () => {
    test("returns 400 with undefined fields", () => {
        expect(validateProductFields(undefined, {}, true)).toEqual({
            status: 400,
            error: "Name is Required",
        });
    });
    test("returns 400 when photo is required but there are no photos", () => {
        expect(    validateProductFields(
            { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true },
            undefined, true
        )).toEqual({
            status: 400,
            error: "Photo is Required",
        });
    });
    test("returns null when photo is not required but is provided", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true},
                { photo: { size: 999_999 }}, false
            )
        ).toBeNull();
    });
    test("returns null when photo is not required and not provided", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true},
                { photo: { size: 999_999 }}, false
            )
        ).toBeNull();
    });
    test("returns 400 when name missing", () => {
        expect(validateProductFields({}, {}, true)).toEqual({
            status: 400,
            error: "Name is Required",
        });
    });
    test("returns 400 when description missing", () => {
        expect(
            validateProductFields({ name: "mockName" }, {}, true)
        ).toEqual({ status: 400, error: "Description is Required" });
    });
    test("returns 400 when price missing", () => {
        expect(
            validateProductFields({ name: "mockName", description: "mockDesc" }, {}, true)
        ).toEqual({ status: 400, error: "Price is Required" });
    });
    test("returns 400 when category missing", () => {
        expect(
            validateProductFields({ name: "mockName", description: "mockDesc", price: 1 }, {}, true)
        ).toEqual({ status: 400, error: "Category is Required" });
    });
    test("returns 400 when quantity missing", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory" },
                {}, true
            )
        ).toEqual({ status: 400, error: "Quantity is Required" });
    });
    test("returns 400 when shipping missing", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                {}, true
            )
        ).toEqual({ status: 400, error: "Shipping is Required" });
    });
    test("returns null when shipping is falsy", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: false},
                {photo: { size: 999_999 }}, true
            )
        ).toBeNull();
    });
    test("returns null when shipping is true", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true},
                {photo: { size: 999_999 }}, true
            )
        ).toBeNull();
    });
    test("returns 400 when photo too large (> 1000000)", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true},
                { photo: { size: 1_000_001 }}, true
            )
        ).toEqual({ status: 400, error: "Photo should be less then 1mb" });
    });
    test("returns null when photo is 1mb", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true},
                { photo: { size: 1_000_000 }}, true
            )
        ).toBeNull();
    });
    test("returns null on successful call", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1, shipping: true},
                { photo: { size: 1_000_000 }}, true
            )
        ).toBeNull();
    });
});

describe("attachPhoto", () => {
    let productDoc;
    let readFile;
    let buf;
    beforeEach(() => {
      productDoc = { photo: {} };
      readFile = jest.fn(() => buf);
      buf = Buffer.from("abc");
      //act
      attachPhoto(
        productDoc,
        { path: "/tmp/x", type: "image/png" },
        readFile,
      );
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
    test("does nothing when photo is missing", () => {
        const productDoc = { photo: {} };
        const readFile = jest.fn();

        attachPhoto(productDoc, undefined, readFile);

        expect(readFile).not.toHaveBeenCalled();
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
        shipping: true
    };
    let requirePhoto;
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
          requirePhoto = false;

          res = await saveProductService({ productDoc, fields, files, readFile, requirePhoto });
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
    describe("when validation passes", () => {
    let productDoc, readFile, files;
    beforeEach(async () => {
      productDoc = {
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        photo: { data: null, contentType: null },
      };

      readFile = jest.fn().mockReturnValue(Buffer.from("img"));
      files = { photo: { size: 10, path: "/tmp/p.png", type: "image/png" } };
        requirePhoto = false;
      await saveProductService({
        productDoc,
        fields: validFields,
        files,
        readFile, requirePhoto
      });
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
                fields: { name: "A", description: "D", price: 1, category: "C", quantity: 1, shipping: true },
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
    beforeEach(() => {
        jest.clearAllMocks();
    });
  describe("upon successful call with no pagination params", () => {
    let res;
    let chain;
    const products = [{ _id: 1 }, { _id: 2 }];
    const total = 50;

    beforeEach(async () => {
      res = makeRes();
      chain = makeThenableQuery(products);
      productModel.find.mockReturnValue(chain);
      productModel.countDocuments.mockResolvedValue(total);
      const req = { query: {} };
      await getProductController(req, res);
    });

    test("calls find with nothing", () => {
      expect(productModel.find).toHaveBeenCalledWith({});
    });

    test("populates category", () => {
      expect(chain.populate).toHaveBeenCalledWith("category");
    });

    test("selects -photo", () => {
      expect(chain.select).toHaveBeenCalledWith("-photo");
    });

    test("sorts by createdAt descending", () => {
      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    test("skips 0 for page=1", () => {
      expect(chain.skip).toHaveBeenCalledWith(0);
    });

    test("limits to 12", () => {
      expect(chain.limit).toHaveBeenCalledWith(12);
    });

    test("counts total documents", () => {
        expect(productModel.countDocuments).toHaveBeenCalledWith({});
    });

    test("returns 200", () => {
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("sends payload containing pagination metadata", () => {
        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                total,
                countTotal: products.length,
                page: 1,
                perPage: 12,
            }),
        );
    });
  });
  describe("upon successful call with pagination params", () => {
        let res;
        let chain;
        const products = [{ _id: 1 }, { _id: 2 }];
        const total = 10;

        beforeEach(async () => {
            res = makeRes();
            chain = makeThenableQuery(products);
            productModel.find.mockReturnValue(chain);
            productModel.countDocuments.mockResolvedValue(total);
            const req = { query: { page: "3", perPage: "6" } };
            await getProductController(req, res);
        });
        test("computes skip correctly", () => {
            expect(chain.skip).toHaveBeenCalledWith(12);
        });
        test("limits perPage from query", () => {
            expect(chain.limit).toHaveBeenCalledWith(6);
        });
        test("sends payload containing parsed page params", () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 3,
                    perPage: 6,
                }),
            );
        });
    });
  describe("when unexpected error happens", () => {
    let statusCode, sentBody;
    beforeAll(async () => {
      const res = {};
      const req = { query: {} };
      res.status = jest.fn((code) => ((statusCode = code), res));
      res.send = jest.fn((body) => ((sentBody = body), res));
      productModel.find.mockImplementation(() => {
        throw new Error("get product fail");
      });
      await getProductController(req, res);
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
        }),
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

    test("selects photo", () => {
      expect(chain.select).toHaveBeenCalledWith("-photo");
    });

    test("populates category", () => {
      expect(chain.populate).toHaveBeenCalledWith("category");
    });

    test("returns 200", () => {
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("sends payload containing product", () => {
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ product }),
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
        }),
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
        }),
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
        }),
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
        }),
      );
    });
  });
});

describe("deleteProductController", () => {
    describe("upon successful deletion", () => {
        let res, req, chain;
        beforeEach(async () => {
            req = {params: {pid: "p1"}};
            res = makeRes();
            chain = {select: jest.fn().mockResolvedValue({ok: 1})};
            productModel.findByIdAndDelete.mockReturnValue(chain);

            await deleteProductController(req, res);
        });
        test("calls findByIdAndDelete with pid", () => {
            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("p1");
        });
        test("returns 200 status code", () => {
            expect(res.status).toHaveBeenCalledWith(200);
        });
        test("sends success response", () => {
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Product Deleted successfully",
                }),
            );
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));

            const req = {params: {pid: "p1"}};

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
                }),
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
            await updateProductController({params: {pid: "p1"}, fields: {}, files: {}}, res);
        });
        test("return status 404", async () => {
            expect(res.status).toHaveBeenCalledWith(404);
        });
        test("error response sent", async () => {
            expect(res.send).toHaveBeenCalledWith({error: "Product not found"});
        });
    });
    describe("when updating invalid product", () => {
        let res;
        beforeEach(async () => {
            res = makeRes();
            const productDoc = {set: jest.fn(), save: jest.fn(), photo: {}};
            productModel.findById.mockResolvedValue(productDoc);

            await updateProductController({params: {pid: "p1"}, fields: {}, files: {}}, res);
        });
        test("return status 400", async () => {
            expect(res.status).toHaveBeenCalledWith(400);
        });
        test("error response", async () => {
            expect(res.send).toHaveBeenCalledWith({error: "Name is Required"});
        });
    });
    describe("upon successful product update", () => {
        let res, req, productDoc;
        beforeEach(async () => {
            res = makeRes();
            productDoc = {set: jest.fn(), save: jest.fn(), photo: {}};
            productModel.findById.mockResolvedValue(productDoc);

            req = {
                params: {pid: "p1"},
                fields: {
                    name: "mockName",
                    description: "mockDesc",
                    price: 1,
                    category: "mockCategory",
                    quantity: 1,
                    shipping: true
                },
                files: { photo: { path: "/tmp/p", type: "image/png", size: 100 } },
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
                {params: {pid: "p1"}, fields: {}, files: {}},
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

describe("productFiltersController", () => {
    describe("filters by category when checked is non-empty", () => {
        let res, req;
        const products = [{ _id: 1 }, { _id: 2 }];
        beforeEach(async () => {
            res = makeRes();
            req = { body: { checked: ["c1", "c2"], radio: [] } };
            productModel.find.mockResolvedValue(products);
            await productFiltersController(req, res);
        });
        test("calls find with category filter", () => {
            expect(productModel.find).toHaveBeenCalledWith({ category: ["c1", "c2"] });
        });
        test("returns 200 with products", () => {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, products }));
        });
    });
    describe("filters by price range when radio is provided", () => {
        let res, req;
        const products = [{ _id: 3 }];
        beforeEach(async () => {
            res = makeRes();
            req = { body: { checked: [], radio: [10, 50] } };
            productModel.find.mockResolvedValue(products);
            await productFiltersController(req, res);
        });
        test("calls find with price range filter", () => {
            expect(productModel.find).toHaveBeenCalledWith({ price: { $gte: 10, $lte: 50 } });
        });
        test("returns 200 with products", () => {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, products }));
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));
            productModel.find.mockImplementation(() => { throw new Error("filter fail"); });
            await productFiltersController({ body: { checked: [], radio: [] } }, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(expect.objectContaining({ success: false, message: "Error While Filtering Products" }));
        });
    });
});

describe("productCountController", () => {
    describe("returns total count", () => {
        let res;
        beforeEach(async () => {
            res = makeRes();
            const chain = { estimatedDocumentCount: jest.fn().mockResolvedValue(42) };
            productModel.find.mockReturnValue(chain);
            await productCountController({}, res);
        });
        test("calls find with empty filter and then estimatedDocumentCount", () => {
            expect(productModel.find).toHaveBeenCalledWith({});
        });
        test("returns 200 with total count", () => {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, total: 42 }));
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));
            const chain = { estimatedDocumentCount: jest.fn(() => { throw new Error("count fail"); }) };
            productModel.find.mockReturnValue(chain);
            await productCountController({}, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(expect.objectContaining({ success: false, message: "Error in product count" }));
        });
    });
});

describe("productListController", () => {
    describe("when page param is missing", () => {
        test("defaults page to 1", async () => {
            const res = makeRes();
            const products = [{}, {}];
            const chain = makeThenableQuery(products);

            productModel.find.mockReturnValue(chain);

            await productListController({ params: {} }, res);

            expect(chain.skip).toHaveBeenCalledWith(0);
        });
    });
    describe("paginates results based on page param", () => {
        let res, chain;
        const products = [{}, {}, {}];
        beforeEach(async () => {
            res = makeRes();
            chain = makeThenableQuery(products);
            productModel.find.mockReturnValue(chain);
            await productListController({ params: { page: 2 } }, res);
        });
        test("selects photo", () => {
            expect(chain.select).toHaveBeenCalledWith("-photo");
        });
        test("skips correct number of documents for page 2 (6)", () => {
            expect(chain.skip).toHaveBeenCalledWith(6);
        });
        test("limits to 6 per page", () => {
            expect(chain.limit).toHaveBeenCalledWith(6);
        });
        test("sorts by createdAt desc", () => {
            expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
        });
        test("returns 200 with products", () => {
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, products }));
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));
            productModel.find.mockImplementation(() => { throw new Error("list fail"); });
            await productListController({ params: { page: 1 } }, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(expect.objectContaining({ success: false, message: "error in per page ctrl" }));
        });
    });
});

describe("searchProductController", () => {
    describe("queries by keyword across name and description and returns results", () => {
        let res, chain;
        const results = [{name: "phone"}];
        beforeEach(async () => {
            res = {json: jest.fn(), status: jest.fn().mockReturnValue(this), send: jest.fn()};
            chain = makeThenableQuery(results);
            productModel.find.mockReturnValue(chain);
            await searchProductController({params: {keyword: "phone"}}, res);
        });
        test("calls find with regex on name and description", () => {
            expect(productModel.find).toHaveBeenCalledWith({
                $or: [
                    {name: {$regex: "phone", $options: "i"}},
                    {description: {$regex: "phone", $options: "i"}},
                ],
            });
        });
        test("selects without photo and responds with json results", () => {
            expect(chain.select).toHaveBeenCalledWith("-photo");
            expect(res.json).toHaveBeenCalledWith(results);
        });
    });
    describe("when unexpected error happens", () => {
        let statusCode, sentBody;
        beforeAll(async () => {
            const res = {};
            res.status = jest.fn((code) => ((statusCode = code), res));
            res.send = jest.fn((body) => ((sentBody = body), res));
            productModel.find.mockImplementation(() => {
                throw new Error("search fail");
            });
            await searchProductController({params: {keyword: "x"}}, res);
        });
        test("returns 500 status code", () => {
            expect(statusCode).toBe(500);
        });
        test("sends error response", () => {
            expect(sentBody).toEqual(expect.objectContaining({success: false, message: "Error In Search Product API"}));
        });
    });
});

describe("relatedProductController", () => {
  describe("upon successful call", () => {
    let res, chain;
    const products = [{ _id: 1 }, { _id: 2 }];
    beforeEach(async () => {
      res = makeRes();
      chain = makeThenableQuery(products);
      productModel.find.mockReturnValue(chain);
      const req = { params: { pid: "mockProduct", cid: "mockCategory" } };
      await relatedProductController(req, res);
    });
    test("calls find with category and $ne filter", () => {
      expect(productModel.find).toHaveBeenCalledWith({ category: "mockCategory", _id: { $ne: "mockProduct" } });
    });
    test("selects without photo, limits to 3, populates category", () => {
      expect(chain.select).toHaveBeenCalledWith("-photo");
      expect(chain.limit).toHaveBeenCalledWith(3);
      expect(chain.populate).toHaveBeenCalledWith("category");
    });
    test("returns 200 with products", () => {
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, products }));
    });
  });
  describe("when unexpected error happens", () => {
    let statusCode, sentBody;
    beforeAll(async () => {
      const res = {};
      res.status = jest.fn((code) => ((statusCode = code), res));
      res.send = jest.fn((body) => ((sentBody = body), res));
      productModel.find.mockImplementation(() => { throw new Error("related products fail"); });
      await relatedProductController({ params: { pid: "mockProduct", cid: "mockController" } }, res);
    });
    test("returns 500 status code", () => {
      expect(statusCode).toBe(500);
    });
    test("sends error response", () => {
      expect(sentBody).toEqual(expect.objectContaining({ success: false, message: "Error while getting related product" }));
    });
  });
});

describe("productCategoryController", () => {
  describe("when category not found", () => {
    let res;
    beforeEach(async () => {
      res = makeRes();
      categoryModel.findOne.mockResolvedValue(null);
      await productCategoryController({ params: { slug: "unknown" } }, res);
    });
    test("returns 404 status code", () => {
      expect(res.status).toHaveBeenCalledWith(404);
    });
    test("sends category not found message", () => {
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Category not found" }));
    });
  });
  describe("upon successful call", () => {
    let res, chain;
    const category = { _id: "mockCategory", slug: "cat" };
    const products = [{ _id: 10 }];
    beforeEach(async () => {
      res = makeRes();
      categoryModel.findOne.mockResolvedValue(category);
      chain = makeThenableQuery(products);
      productModel.find.mockReturnValue(chain);
      await productCategoryController({ params: { slug: "cat" } }, res);
    });
    test("finds category by slug", () => {
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "cat" });
    });
    test("fetches products by category id and populates category", () => {
      expect(productModel.find).toHaveBeenCalledWith({ category: "mockCategory" });
      expect(chain.populate).toHaveBeenCalledWith("category");
    });
    test("returns 200 with category and products", () => {
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true, category, products }));
    });
  });
  describe("when unexpected error happens", () => {
    let statusCode, sentBody;
    beforeAll(async () => {
      const res = {};
      res.status = jest.fn((code) => ((statusCode = code), res));
      res.send = jest.fn((body) => ((sentBody = body), res));
      categoryModel.findOne.mockImplementation(() => { throw new Error("category fail"); });
      await productCategoryController({ params: { slug: "cat" } }, res);
    });
    test("returns 500 status code", () => {
      expect(statusCode).toBe(500);
    });
    test("sends error response", () => {
      expect(sentBody).toEqual(expect.objectContaining({ success: false, message: "Error In Getting Products in a Category" }));
    });
  });
});