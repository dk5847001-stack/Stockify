import express from "express";
import {
  getDashboardSummary,
  getSalesChart,
  getStockAlerts,
  getTopProducts
} from "../controllers/dashboardController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/summary", getDashboardSummary);
router.get("/sales-chart", getSalesChart);
router.get("/top-products", getTopProducts);
router.get("/stock-alerts", getStockAlerts);

export default router;
