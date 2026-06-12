import express from "express";
import {
  createProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getProductById,
  getProducts,
  updateProduct,
  updateProductStock
} from "../controllers/productController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getProducts).post(adminOnly, createProduct);
router.get("/low-stock", getLowStockProducts);
router.get("/out-of-stock", getOutOfStockProducts);
router
  .route("/:id")
  .get(getProductById)
  .put(adminOnly, updateProduct)
  .delete(adminOnly, deleteProduct);
router.patch("/:id/stock", adminOnly, updateProductStock);

export default router;
