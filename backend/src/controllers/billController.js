import Bill from "../models/Bill.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateInvoiceNo } from "../utils/generateInvoiceNo.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const validatePayment = ({ paymentMode, paymentStatus }) => {
  const paymentModes = ["Cash", "UPI", "Card", "Credit"];
  const paymentStatuses = ["Paid", "Pending", "Partial", "Failed"];

  if (!paymentModes.includes(paymentMode)) {
    throw createError("Payment mode must be one of: Cash, UPI, Card, Credit.");
  }

  if (paymentStatus && !paymentStatuses.includes(paymentStatus)) {
    throw createError("Payment status must be one of: Paid, Pending, Partial, Failed.");
  }
};

const buildPrintableInvoice = (bill, customerHistory = []) => ({
  invoiceNo: bill.invoiceNo,
  customer: bill.customer,
  items: bill.items,
  subtotal: bill.subtotal,
  discountAmount: bill.discountAmount,
  taxAmount: bill.taxAmount,
  grandTotal: bill.grandTotal,
  paymentMode: bill.paymentMode,
  paymentStatus: bill.paymentStatus,
  createdAt: bill.createdAt,
  cashier: bill.createdBy,
  customerHistory
});

const getCustomerHistory = async (customer) => {
  if (!customer?.phone && !customer?.email) return [];

  const filters = [];
  if (customer.phone) filters.push({ "customer.phone": customer.phone });
  if (customer.email) filters.push({ "customer.email": customer.email });

  return Bill.find({ $or: filters })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("invoiceNo grandTotal paymentMode paymentStatus createdAt");
};

export const createBill = asyncHandler(async (req, res) => {
  const { customer = {}, items, paymentMode, paymentStatus = "Paid" } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw createError("Please add at least one product to create a bill.");
  }

  validatePayment({ paymentMode, paymentStatus });

  const invoiceNo = await generateInvoiceNo();
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true
  });
  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const billItems = [];
  const stockUpdates = new Map();
  let subtotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;

  for (const item of items) {
    if (!item.productId) {
      throw createError("Each bill item must include productId.");
    }

    const product = productMap.get(String(item.productId));

    if (!product) {
      throw createError("One or more products were not found or are inactive.", 404);
    }

    const quantity = Number(item.quantity);
    const price = item.price === undefined ? product.sellingPrice : Number(item.price);
    const discount = Number(item.discount) || 0;
    const tax = Number(item.tax) || 0;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw createError(`Quantity for ${product.name} must be greater than zero.`);
    }

    if (product.stock < quantity) {
      throw createError(`Only ${product.stock} ${product.unit} available for ${product.name}.`, 409);
    }

    if (price < 0 || discount < 0 || tax < 0) {
      throw createError(`Price, discount and tax cannot be negative for ${product.name}.`);
    }

    const lineSubtotal = roundMoney(quantity * price);
    const lineDiscount = roundMoney(discount);
    const taxableAmount = Math.max(lineSubtotal - lineDiscount, 0);
    const lineTax = roundMoney(tax);
    const lineTotal = roundMoney(taxableAmount + lineTax);
    const previousStock = product.stock;
    const newStock = previousStock - quantity;

    product.stock = newStock;
    subtotal = roundMoney(subtotal + lineSubtotal);
    discountAmount = roundMoney(discountAmount + lineDiscount);
    taxAmount = roundMoney(taxAmount + lineTax);

    const productKey = String(product._id);
    const existingUpdate = stockUpdates.get(productKey) || { product, movements: [] };
    existingUpdate.movements.push({
      type: "decrease",
      quantity,
      previousStock,
      newStock,
      note: `Sold via invoice ${invoiceNo}`,
      updatedBy: req.user._id
    });
    stockUpdates.set(productKey, existingUpdate);

    billItems.push({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      quantity,
      price,
      discount: lineDiscount,
      tax: lineTax,
      total: lineTotal
    });
  }

  const grandTotal = roundMoney(subtotal - discountAmount + taxAmount);
  const createdBill = await Bill.create({
    invoiceNo,
    customer,
    items: billItems,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    paymentMode,
    paymentStatus,
    createdBy: req.user._id
  });

  await Promise.all(
    Array.from(stockUpdates.values()).map(({ product, movements }) => {
      product.stockHistory.push(...movements);
      return product.save();
    })
  );

  const bill = await Bill.findById(createdBill._id).populate("createdBy", "name email role");
  const customerHistory = await getCustomerHistory(bill.customer);

  res.status(201).json({
    message: "Bill created successfully.",
    bill,
    invoice: buildPrintableInvoice(bill, customerHistory)
  });
});

export const getBills = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const filters = {};

  if (req.query.paymentMode) filters.paymentMode = req.query.paymentMode;
  if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
  if (req.query.invoiceNo) filters.invoiceNo = new RegExp(String(req.query.invoiceNo), "i");
  if (req.query.customerPhone) filters["customer.phone"] = req.query.customerPhone;

  const [bills, total] = await Promise.all([
    Bill.find(filters).populate("createdBy", "name email role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Bill.countDocuments(filters)
  ]);

  res.status(200).json({
    bills,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate("createdBy", "name email role");

  if (!bill) {
    throw createError("Bill not found.", 404);
  }

  const customerHistory = await getCustomerHistory(bill.customer);

  res.status(200).json({
    bill,
    invoice: buildPrintableInvoice(bill, customerHistory)
  });
});

export const getBillByInvoiceNo = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ invoiceNo: req.params.invoiceNo }).populate("createdBy", "name email role");

  if (!bill) {
    throw createError("Invoice not found.", 404);
  }

  const customerHistory = await getCustomerHistory(bill.customer);

  res.status(200).json({
    bill,
    invoice: buildPrintableInvoice(bill, customerHistory)
  });
});

export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    throw createError("Bill not found.", 404);
  }

  await bill.deleteOne();

  res.status(200).json({
    message: "Bill deleted successfully."
  });
});
