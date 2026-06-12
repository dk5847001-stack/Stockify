import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requiredProductFields = ["name", "sku", "purchasePrice", "sellingPrice", "mrp"];

const numberFields = ["purchasePrice", "sellingPrice", "mrp", "stock", "lowStockLimit"];

const validateProductPayload = (payload, { partial = false } = {}) => {
  if (!partial) {
    const missing = requiredProductFields.filter(
      (field) => payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === ""
    );

    if (missing.length) {
      throw createError(`Please provide ${missing.join(", ")}.`);
    }
  }

  numberFields.forEach((field) => {
    if (payload[field] !== undefined && Number(payload[field]) < 0) {
      throw createError(`${field} cannot be negative.`);
    }
  });

  if (
    payload.purchasePrice !== undefined &&
    payload.sellingPrice !== undefined &&
    Number(payload.sellingPrice) < Number(payload.purchasePrice)
  ) {
    throw createError("Selling price should not be lower than purchase price.");
  }

  if (
    payload.sellingPrice !== undefined &&
    payload.mrp !== undefined &&
    Number(payload.sellingPrice) > Number(payload.mrp)
  ) {
    throw createError("Selling price cannot be greater than MRP.");
  }
};

const buildProductQuery = (query) => {
  const filters = {};
  const { search, category, stockStatus, isActive } = query;

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), "i");
    filters.$or = [{ name: searchRegex }, { sku: searchRegex }, { barcode: searchRegex }];
  }

  if (category) {
    filters.category = category;
  }

  if (isActive !== undefined) {
    if (!["true", "false", true, false].includes(isActive)) {
      throw createError("isActive filter must be true or false.");
    }
    filters.isActive = isActive === true || isActive === "true";
  }

  if (stockStatus) {
    if (stockStatus === "out") {
      filters.stock = 0;
    } else if (stockStatus === "low") {
      filters.$expr = { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", "$lowStockLimit"] }] };
    } else if (stockStatus === "available") {
      filters.$expr = { $gt: ["$stock", "$lowStockLimit"] };
    } else {
      throw createError("stockStatus must be one of: available, low, out.");
    }
  }

  return filters;
};

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const filters = buildProductQuery(req.query);

  const [products, total] = await Promise.all([
    Product.find(filters)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters)
  ]);

  res.status(200).json({
    products,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  validateProductPayload(req.body);

  const existingProduct = await Product.findOne({
    $or: [
      { sku: String(req.body.sku).toUpperCase() },
      ...(req.body.barcode ? [{ barcode: req.body.barcode }] : [])
    ]
  });

  if (existingProduct) {
    throw createError("A product with this SKU or barcode already exists.", 409);
  }

  const initialStock = Number(req.body.stock) || 0;
  const product = await Product.create({
    ...req.body,
    sku: String(req.body.sku).toUpperCase(),
    stock: initialStock,
    createdBy: req.user._id,
    stockHistory:
      initialStock > 0
        ? [
            {
              type: "increase",
              quantity: initialStock,
              previousStock: 0,
              newStock: initialStock,
              note: "Initial stock",
              updatedBy: req.user._id
            }
          ]
        : []
  });

  res.status(201).json({
    message: "Product created successfully.",
    product
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("createdBy", "name email role")
    .populate("stockHistory.updatedBy", "name email role");

  if (!product) {
    throw createError("Product not found.", 404);
  }

  res.status(200).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  validateProductPayload(req.body, { partial: true });

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError("Product not found.", 404);
  }

  if (req.body.sku || req.body.barcode) {
    const duplicateProduct = await Product.findOne({
      _id: { $ne: product._id },
      $or: [
        ...(req.body.sku ? [{ sku: String(req.body.sku).toUpperCase() }] : []),
        ...(req.body.barcode ? [{ barcode: req.body.barcode }] : [])
      ]
    });

    if (duplicateProduct) {
      throw createError("Another product already uses this SKU or barcode.", 409);
    }
  }

  const blockedFields = ["stock", "stockHistory", "createdBy"];
  const editableFields = [
    "name",
    "sku",
    "barcode",
    "category",
    "brand",
    "purchasePrice",
    "sellingPrice",
    "mrp",
    "lowStockLimit",
    "unit",
    "expiryDate",
    "supplierName",
    "image",
    "isActive"
  ];

  blockedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      throw createError(`${field} can only be changed through the stock management endpoint.`);
    }
  });

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = field === "sku" ? String(req.body[field]).toUpperCase() : req.body[field];
    }
  });

  if (product.sellingPrice < product.purchasePrice) {
    throw createError("Selling price should not be lower than purchase price.");
  }

  if (product.sellingPrice > product.mrp) {
    throw createError("Selling price cannot be greater than MRP.");
  }

  await product.save();

  res.status(200).json({
    message: "Product updated successfully.",
    product
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError("Product not found.", 404);
  }

  await product.deleteOne();

  res.status(200).json({
    message: "Product deleted successfully."
  });
});

export const updateProductStock = asyncHandler(async (req, res) => {
  const { type, quantity, note } = req.body;
  const parsedQuantity = Number(quantity);

  if (!["increase", "decrease", "adjustment"].includes(type)) {
    throw createError("Stock update type must be increase, decrease, or adjustment.");
  }

  if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
    throw createError("Quantity must be a valid non-negative number.");
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createError("Product not found.", 404);
  }

  const previousStock = product.stock;
  let newStock = previousStock;

  if (type === "increase") {
    newStock = previousStock + parsedQuantity;
  }

  if (type === "decrease") {
    newStock = previousStock - parsedQuantity;
  }

  if (type === "adjustment") {
    newStock = parsedQuantity;
  }

  if (newStock < 0) {
    throw createError("Stock cannot be negative. Please reduce a smaller quantity.");
  }

  product.stock = newStock;
  product.stockHistory.push({
    type,
    quantity: parsedQuantity,
    previousStock,
    newStock,
    note,
    updatedBy: req.user._id
  });

  await product.save();

  res.status(200).json({
    message: "Stock updated successfully.",
    product
  });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    stock: { $gt: 0 },
    $expr: { $lte: ["$stock", "$lowStockLimit"] }
  }).sort({ stock: 1, name: 1 });

  res.status(200).json({ products });
});

export const getOutOfStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    stock: 0
  }).sort({ name: 1 });

  res.status(200).json({ products });
});
