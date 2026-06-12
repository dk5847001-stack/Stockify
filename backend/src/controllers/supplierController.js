import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const emailRegex = /^$|^\S+@\S+\.\S+$/;

const validateSupplier = ({ name, phone, email, companyName, suppliedProducts, totalPurchaseValue }, { partial = false } = {}) => {
  if (!partial && (!name || !phone || !companyName)) {
    throw createError("Please provide supplier name, phone and company name.");
  }

  if (email !== undefined && !emailRegex.test(email)) {
    throw createError("Please provide a valid supplier email address.");
  }

  if (suppliedProducts !== undefined && !Array.isArray(suppliedProducts)) {
    throw createError("suppliedProducts must be an array.");
  }

  if (totalPurchaseValue !== undefined && Number(totalPurchaseValue) < 0) {
    throw createError("totalPurchaseValue cannot be negative.");
  }
};

const buildSearchQuery = (query) => {
  if (!query.search) return {};

  const searchRegex = new RegExp(String(query.search).trim(), "i");
  return {
    $or: [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }, { companyName: searchRegex }]
  };
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMappedProducts = async (supplier) => {
  const names = [supplier.name, supplier.companyName].filter(Boolean);

  return Product.find({
    supplierName: { $in: names.map((name) => new RegExp(`^${escapeRegex(name)}$`, "i")) }
  }).select("name sku category brand purchasePrice sellingPrice stock supplierName");
};

const buildSupplierResponse = async (supplier) => {
  const mappedProducts = await getMappedProducts(supplier);
  const mappedValue = mappedProducts.reduce(
    (sum, product) => sum + product.purchasePrice * product.stock,
    0
  );

  return {
    supplier,
    productMapping: {
      suppliedProducts: supplier.suppliedProducts,
      productsFromInventory: mappedProducts,
      inventoryPurchaseValue: mappedValue
    }
  };
};

export const createSupplier = asyncHandler(async (req, res) => {
  validateSupplier(req.body);

  const existingSupplier = await Supplier.findOne({ phone: req.body.phone });

  if (existingSupplier) {
    throw createError("A supplier with this phone number already exists.", 409);
  }

  const supplier = await Supplier.create(req.body);
  const response = await buildSupplierResponse(supplier);

  res.status(201).json({
    message: "Supplier created successfully.",
    ...response
  });
});

export const getSuppliers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const filters = buildSearchQuery(req.query);

  const [suppliers, total] = await Promise.all([
    Supplier.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Supplier.countDocuments(filters)
  ]);

  res.status(200).json({
    suppliers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id).populate("suppliedProducts.productId", "name sku stock");

  if (!supplier) {
    throw createError("Supplier not found.", 404);
  }

  const response = await buildSupplierResponse(supplier);

  res.status(200).json(response);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  validateSupplier(req.body, { partial: true });

  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw createError("Supplier not found.", 404);
  }

  if (req.body.phone && req.body.phone !== supplier.phone) {
    const existingSupplier = await Supplier.findOne({
      phone: req.body.phone,
      _id: { $ne: supplier._id }
    });

    if (existingSupplier) {
      throw createError("Another supplier already uses this phone number.", 409);
    }
  }

  [
    "name",
    "phone",
    "email",
    "companyName",
    "address",
    "gstNumber",
    "suppliedProducts",
    "totalPurchaseValue"
  ].forEach((field) => {
    if (req.body[field] !== undefined) {
      supplier[field] = req.body[field];
    }
  });

  await supplier.save();
  const response = await buildSupplierResponse(supplier);

  res.status(200).json({
    message: "Supplier updated successfully.",
    ...response
  });
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw createError("Supplier not found.", 404);
  }

  await supplier.deleteOne();

  res.status(200).json({ message: "Supplier deleted successfully." });
});
