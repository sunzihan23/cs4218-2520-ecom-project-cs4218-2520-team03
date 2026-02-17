import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryCOntroller,
} from "./categoryController.js";

jest.mock("slugify");
jest.mock("../models/categoryModel.js");

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("testcreateCategoryController", () => {
  test("returns status code 400 when name is missing", async () => {
    const req = { body: {} };
    const res = makeRes();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Name is required",
    });
    expect(categoryModel.findOne).not.toHaveBeenCalled();
    expect(slugify).not.toHaveBeenCalled();
  });

  test("returns status code 409 when category already exists", async () => {
    const req = { body: { name: "  Books  " } };
    const res = makeRes();

    categoryModel.findOne.mockResolvedValue({ _id: "c1", name: "Books" });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Books" });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category Already Exisits",
    });
    expect(slugify).not.toHaveBeenCalled();
    expect(categoryModel).not.toHaveBeenCalled();
  });

  test("returns status code 201 on successful category creation", async () => {
    const req = { body: { name: "  Necessities  " } };
    const res = makeRes();

    categoryModel.findOne.mockResolvedValue(null);
    slugify.mockReturnValue("necessities");

    const savedCategory = { _id: "c2", name: "Necessities", slug: "necessities" };
    const save = jest.fn().mockResolvedValue(savedCategory);
    categoryModel.mockImplementation(function (doc) {
      return { ...doc, save };
    });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Necessities" });
    expect(slugify).toHaveBeenCalledWith("Necessities", { lower: true, strict: true });
    expect(categoryModel).toHaveBeenCalledWith({ name: "Necessities", slug: "necessities" });
    expect(save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: savedCategory,
    });
  });

  test("returns status code 500 when unexpected error happens", async () => {
    const req = { body: { name: "Electronics" } };
    const res = makeRes();

    categoryModel.findOne.mockRejectedValue(new Error("db fail"));

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in Category",
      }),
    );
  });
});

describe("test updateCategoryController", () => {
  test("returns status code 400 when name missing", async () => {
    const req = { body: {}, params: { id: "id1" } };
    const res = makeRes();

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Name is required",
    });
    expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("returns status code 200 on successful category update", async () => {
    const req = { body: { name: "  Updated Electronics  " }, params: { id: "id1" } };
    const res = makeRes();

    slugify.mockReturnValue("updated-electronics");
    const updated = { _id: "id1", name: "Updated Electronics", slug: "updated-electronics" };
    categoryModel.findByIdAndUpdate.mockResolvedValue(updated);

    await updateCategoryController(req, res);

    expect(slugify).toHaveBeenCalledWith("Updated Electronics");
    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "id1",
      { name: "Updated Electronics", slug: "updated-electronics" },
      { new: true },
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Updated Successfully",
      category: updated,
    });
  });

  test("returns status code 500 when unexpected error happens", async () => {
    const req = { body: { name: "X" }, params: { id: "id1" } };
    const res = makeRes();

    categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("update fail"));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while updating category",
      }),
    );
  });
});

describe("test categoryController (get all)", () => {
  test("returns status code 200 with categories list on success", async () => {
    const req = {};
    const res = makeRes();

    const cats = [{ _id: 1 }, { _id: 2 }];
    categoryModel.find.mockResolvedValue(cats);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: cats,
    });
  });

  test("returns status code500 when unexpected error happens", async () => {
    const req = {};
    const res = makeRes();

    categoryModel.find.mockRejectedValue(new Error("find fail"));

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting all categories",
      }),
    );
  });
});

describe("test singleCategoryController", () => {
  test("returns status code 200 with single category retrieved on success", async () => {
    const req = { params: { slug: "abc" } };
    const res = makeRes();

    const cat = { _id: "c1", slug: "abc" };
    categoryModel.findOne.mockResolvedValue(cat);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "abc" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get SIngle Category SUccessfully",
      category: cat,
    });
  });

  test("returns status code 500 when unexpected error happens", async () => {
    const req = { params: { slug: "abc" } };
    const res = makeRes();

    categoryModel.findOne.mockRejectedValue(new Error("findOne fail"));

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While getting Single Category",
      }),
    );
  });
});

describe("test deleteCategoryCOntroller", () => {
  test("returns status code 200 on successful category deletion", async () => {
    const req = { params: { id: "id1" } };
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockResolvedValue({ ok: 1 });

    await deleteCategoryCOntroller(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("id1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Categry Deleted Successfully",
    });
  });

  test("returns status code 500 when unexpected error happens", async () => {
    const req = { params: { id: "id1" } };
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockRejectedValue(new Error("delete fail"));

    await deleteCategoryCOntroller(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "error while deleting category",
      }),
    );
  });
});