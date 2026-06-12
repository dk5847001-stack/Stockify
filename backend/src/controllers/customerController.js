import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const emailRegex = /^$|^\S+@\S+\.\S+$/;

const validateCustomer = ({ name, mobile, email }, { partial = false } = {}) => {
  if (!partial && (!name || !mobile)) {
    throw createError("Please provide customer name and mobile number.");
  }

  if (email !== undefined && !emailRegex.test(email)) {
    throw createError("Please provide a valid customer email address.");
  }
};

const buildSearchQuery = (query) => {
  if (!query.search) return {};

  const searchRegex = new RegExp(String(query.search).trim(), "i");
  return {
    $or: [{ name: searchRegex }, { mobile: searchRegex }, { email: searchRegex }]
  };
};

const getPurchaseHistory = async (customer) => {
  const filters = [];
  if (customer.mobile) filters.push({ "customer.phone": customer.mobile });
  if (customer.email) filters.push({ "customer.email": customer.email });

  if (!filters.length) return [];

  return Bill.find({ $or: filters })
    .sort({ createdAt: -1 })
    .select("invoiceNo items subtotal discountAmount taxAmount grandTotal paymentMode paymentStatus createdAt");
};

const syncCustomerPurchaseStats = async (customer) => {
  const history = await getPurchaseHistory(customer);
  customer.totalPurchases = history.length;
  customer.totalSpent = history.reduce((sum, bill) => sum + bill.grandTotal, 0);
  customer.lastPurchaseDate = history[0]?.createdAt;
  await customer.save();
  return history;
};

export const createCustomer = asyncHandler(async (req, res) => {
  validateCustomer(req.body);

  const existingCustomer = await Customer.findOne({ mobile: req.body.mobile });

  if (existingCustomer) {
    throw createError("A customer with this mobile number already exists.", 409);
  }

  const customer = await Customer.create(req.body);
  const purchaseHistory = await syncCustomerPurchaseStats(customer);

  res.status(201).json({
    message: "Customer created successfully.",
    customer,
    purchaseHistory
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const filters = buildSearchQuery(req.query);

  const [customers, total] = await Promise.all([
    Customer.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Customer.countDocuments(filters)
  ]);

  res.status(200).json({
    customers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw createError("Customer not found.", 404);
  }

  const purchaseHistory = await syncCustomerPurchaseStats(customer);

  res.status(200).json({ customer, purchaseHistory });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  validateCustomer(req.body, { partial: true });

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw createError("Customer not found.", 404);
  }

  if (req.body.mobile && req.body.mobile !== customer.mobile) {
    const existingCustomer = await Customer.findOne({
      mobile: req.body.mobile,
      _id: { $ne: customer._id }
    });

    if (existingCustomer) {
      throw createError("Another customer already uses this mobile number.", 409);
    }
  }

  ["name", "mobile", "email", "address"].forEach((field) => {
    if (req.body[field] !== undefined) {
      customer[field] = req.body[field];
    }
  });

  const purchaseHistory = await syncCustomerPurchaseStats(customer);

  res.status(200).json({
    message: "Customer updated successfully.",
    customer,
    purchaseHistory
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw createError("Customer not found.", 404);
  }

  await customer.deleteOne();

  res.status(200).json({ message: "Customer deleted successfully." });
});
