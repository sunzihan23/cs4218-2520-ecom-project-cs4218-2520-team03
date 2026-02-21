//Chen Zhiruo A0256855N
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

import fs from "fs";
import slugify from "slugify";

//helper to validate product info
export function validateProductFields(fields, files, requirePhoto) {
  const { name, description, price, category, quantity, shipping } = fields || {};
  const { photo } = files || {};

  if (!name) return { status: 400, error: "Name is Required" };
  if (!description) return { status: 400, error: "Description is Required" };
  if (!price) return { status: 400, error: "Price is Required" };
  if (!category) return { status: 400, error: "Category is Required" };
  if (!quantity) return { status: 400, error: "Quantity is Required" };
  if (shipping === undefined) return { status: 400, error: "Shipping is Required" };
  if (requirePhoto && !photo) {
    return { status: 400, error: "Photo is Required" };
  }
  if (photo && photo.size > 1_000_000)
    return { status: 400, error: "Photo should be less then 1mb" };
  return null;
}

//helper to attach photo
export function attachPhoto(productDoc, photo, readFile) {
  if (!photo) return;
  productDoc.photo.data = readFile(photo.path);
  productDoc.photo.contentType = photo.type;
}

//helper to save product
export async function saveProductService({
  productDoc,
  fields,
  files,
  readFile,
  requirePhoto }) {
  const validation = validateProductFields(fields, files, requirePhoto);
  if (validation) return { ok: false, ...validation };

  productDoc.set({ ...fields, slug: slugify(fields.name) });
  attachPhoto(productDoc, files?.photo, readFile);
  await productDoc.save();

  return { ok: true, status: 200, product: productDoc };
}

export const createProductController = async (req, res) => {
  try {
    const productDoc = new productModel();
    const result = await saveProductService({
      productDoc,
      fields: req.fields,
      files: req.files,
      readFile: fs.readFileSync,
      requirePhoto: true
    });

    if (!result.ok)
      return res.status(result.status).send({ error: result.error });
    return res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products: result.product,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const perPage = Math.max(1, Number(req.query.perPage) || 12);
    const page = Math.max(1, Number(req.query.page) || 1);
    const products = await productModel
        .find({})
        .populate("category")
        .select("-photo")
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage);

    const total = await productModel.countDocuments({});
    res.status(200).send({
      success: true,
      page,
      perPage,
      total,
      countTotal: products.length,
      message: "All Products ",
      products,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    if (!product.photo) {
      return res.status(404).send({
        success: false,
        message: "Product Photo not found",
      });
    }
    res.set("Content-type", product.photo.contentType);
    return res.status(200).send(product.photo.data);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error: error.message,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error: error.message,
    });
  }
};

//update product
export const updateProductController = async (req, res) => {
  try {
    const productDoc = await productModel.findById(req.params.pid);
    if (!productDoc)
      return res.status(404).send({ error: "Product not found" });

    const result = await saveProductService({
      productDoc,
      fields: req.fields,
      files: req.files,
      readFile: fs.readFileSync,
      requirePhoto: false
    });

    if (!result.ok)
      return res.status(result.status).send({ error: result.error });

    return res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      products: result.product,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error While Filtering Products",
      error: error.message,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      message: "Error in product count",
      error: error.message,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "error in per page ctrl",
      error: error.message,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
        .find({
          $or: [
            { name: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
          ],
        })
        .select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error In Search Product API",
      error: error.message,
    });
  }
};

// similar products
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      message: "Error while getting related product",
      error: error.message,
    });
  }
};

// get products by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }
    const products = await productModel.find({ category: category._id }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error In Getting Products in a Category",
    });
  }
};
