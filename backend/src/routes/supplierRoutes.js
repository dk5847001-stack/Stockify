import express from "express";
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier
} from "../controllers/supplierController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(adminOnly, createSupplier).get(getSuppliers);
router
  .route("/:id")
  .get(getSupplierById)
  .put(adminOnly, updateSupplier)
  .delete(adminOnly, deleteSupplier);

export default router;
