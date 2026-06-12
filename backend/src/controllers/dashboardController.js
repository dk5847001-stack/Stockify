import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Supplier from "../models/Supplier.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getDateRanges = () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);

  return { todayStart, todayEnd, monthStart, nextMonthStart, yearStart, nextYearStart };
};

const getRevenueStats = async (match = {}) => {
  const [result] = await Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$grandTotal" },
        invoices: { $sum: 1 },
        discount: { $sum: "$discountAmount" },
        tax: { $sum: "$taxAmount" }
      }
    }
  ]);

  return {
    revenue: roundMoney(result?.revenue || 0),
    invoices: result?.invoices || 0,
    discount: roundMoney(result?.discount || 0),
    tax: roundMoney(result?.tax || 0)
  };
};

const getProfitStats = async (match = {}) => {
  const [result] = await Bill.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        salesValue: { $sum: "$items.total" },
        purchaseValue: {
          $sum: {
            $multiply: ["$items.quantity", { $ifNull: ["$product.purchasePrice", 0] }]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        salesValue: 1,
        purchaseValue: 1,
        profit: { $subtract: ["$salesValue", "$purchaseValue"] }
      }
    }
  ]);

  return {
    salesValue: roundMoney(result?.salesValue || 0),
    purchaseValue: roundMoney(result?.purchaseValue || 0),
    profit: roundMoney(result?.profit || 0)
  };
};

const getPaymentModeSales = async (match = {}) => {
  return Bill.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$paymentMode",
        sales: { $sum: "$grandTotal" },
        invoices: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        paymentMode: "$_id",
        sales: { $round: ["$sales", 2] },
        invoices: 1
      }
    },
    { $sort: { sales: -1 } }
  ]);
};

const getCategoryWiseStock = async () => {
  return Product.aggregate([
    {
      $group: {
        _id: "$category",
        products: { $sum: 1 },
        totalStock: { $sum: "$stock" },
        stockValue: { $sum: { $multiply: ["$stock", "$purchasePrice"] } }
      }
    },
    {
      $project: {
        _id: 0,
        category: { $ifNull: ["$_id", "Uncategorized"] },
        products: 1,
        totalStock: 1,
        stockValue: { $round: ["$stockValue", 2] }
      }
    },
    { $sort: { totalStock: -1 } }
  ]);
};

export const getDashboardSummary = asyncHandler(async (_req, res) => {
  const { todayStart, todayEnd, monthStart, nextMonthStart } = getDateRanges();

  const [
    totalProducts,
    totalCustomers,
    totalSuppliers,
    totalInvoices,
    lowStockCount,
    outOfStockCount,
    todaySales,
    monthlyRevenue,
    monthlyProfit,
    recentBills,
    categoryWiseStock,
    paymentModeWiseSales,
    topSellingProducts
  ] = await Promise.all([
    Product.countDocuments(),
    Customer.countDocuments(),
    Supplier.countDocuments(),
    Bill.countDocuments(),
    Product.countDocuments({ isActive: true, stock: { $gt: 0 }, $expr: { $lte: ["$stock", "$lowStockLimit"] } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    getRevenueStats({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
    getRevenueStats({ createdAt: { $gte: monthStart, $lt: nextMonthStart } }),
    getProfitStats({ createdAt: { $gte: monthStart, $lt: nextMonthStart } }),
    Bill.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(8)
      .select("invoiceNo customer grandTotal paymentMode paymentStatus createdAt createdBy"),
    getCategoryWiseStock(),
    getPaymentModeSales({ createdAt: { $gte: monthStart, $lt: nextMonthStart } }),
    getTopSellingProductsData(5)
  ]);

  res.status(200).json({
    summary: {
      totalProducts,
      totalCustomers,
      totalSuppliers,
      todaySales: todaySales.revenue,
      monthlyRevenue: monthlyRevenue.revenue,
      totalInvoices,
      lowStockCount,
      outOfStockCount,
      monthlyProfit: monthlyProfit.profit,
      monthlyPurchaseValue: monthlyProfit.purchaseValue,
      monthlySalesValue: monthlyProfit.salesValue,
      monthlyDiscount: monthlyRevenue.discount,
      monthlyTax: monthlyRevenue.tax
    },
    recentBills,
    topSellingProducts,
    categoryWiseStock,
    paymentModeWiseSales
  });
});

export const getSalesChart = asyncHandler(async (req, res) => {
  const requestedYear = Number(req.query.year) || new Date().getFullYear();
  const yearStart = new Date(requestedYear, 0, 1);
  const nextYearStart = new Date(requestedYear + 1, 0, 1);
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const sales = await Bill.aggregate([
    { $match: { createdAt: { $gte: yearStart, $lt: nextYearStart } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$items.total" },
        purchaseValue: {
          $sum: {
            $multiply: ["$items.quantity", { $ifNull: ["$product.purchasePrice", 0] }]
          }
        },
        quantitySold: { $sum: "$items.quantity" },
        invoices: { $addToSet: "$_id" }
      }
    },
    {
      $project: {
        _id: 0,
        monthNumber: "$_id",
        revenue: { $round: ["$revenue", 2] },
        purchaseValue: { $round: ["$purchaseValue", 2] },
        profit: { $round: [{ $subtract: ["$revenue", "$purchaseValue"] }, 2] },
        quantitySold: 1,
        invoices: { $size: "$invoices" }
      }
    }
  ]);

  const salesMap = new Map(sales.map((item) => [item.monthNumber, item]));
  const chartData = monthLabels.map((month, index) => {
    const monthNumber = index + 1;
    const item = salesMap.get(monthNumber);

    return {
      month,
      monthNumber,
      revenue: item?.revenue || 0,
      purchaseValue: item?.purchaseValue || 0,
      profit: item?.profit || 0,
      quantitySold: item?.quantitySold || 0,
      invoices: item?.invoices || 0
    };
  });

  res.status(200).json({
    year: requestedYear,
    chartData
  });
});

const getTopSellingProductsData = async (limit = 10) => {
  return Bill.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$items.productId",
        name: { $first: "$items.name" },
        sku: { $first: "$items.sku" },
        category: { $first: "$product.category" },
        quantitySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
        purchaseValue: {
          $sum: {
            $multiply: ["$items.quantity", { $ifNull: ["$product.purchasePrice", 0] }]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: 1,
        sku: 1,
        category: { $ifNull: ["$category", "Uncategorized"] },
        quantitySold: 1,
        revenue: { $round: ["$revenue", 2] },
        purchaseValue: { $round: ["$purchaseValue", 2] },
        profit: { $round: [{ $subtract: ["$revenue", "$purchaseValue"] }, 2] }
      }
    },
    { $sort: { quantitySold: -1, revenue: -1 } },
    { $limit: limit }
  ]);
};

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const products = await getTopSellingProductsData(limit);

  res.status(200).json({ products });
});

export const getStockAlerts = asyncHandler(async (_req, res) => {
  const [lowStockProducts, outOfStockProducts, lowStockCount, outOfStockCount] = await Promise.all([
    Product.find({
      isActive: true,
      stock: { $gt: 0 },
      $expr: { $lte: ["$stock", "$lowStockLimit"] }
    })
      .sort({ stock: 1, name: 1 })
      .select("name sku category stock lowStockLimit unit supplierName image"),
    Product.find({ isActive: true, stock: 0 })
      .sort({ name: 1 })
      .select("name sku category stock lowStockLimit unit supplierName image"),
    Product.countDocuments({ isActive: true, stock: { $gt: 0 }, $expr: { $lte: ["$stock", "$lowStockLimit"] } }),
    Product.countDocuments({ isActive: true, stock: 0 })
  ]);

  res.status(200).json({
    counts: {
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalAlerts: lowStockCount + outOfStockCount
    },
    lowStockProducts,
    outOfStockProducts
  });
});
