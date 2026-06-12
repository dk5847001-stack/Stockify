import express from "express";
import {
  createBill,
  deleteBill,
  getBillById,
  getBillByInvoiceNo,
  getBills
} from "../controllers/billController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createBill).get(getBills);
router.get("/invoice/:invoiceNo", getBillByInvoiceNo);
router.route("/:id").get(getBillById).delete(adminOnly, deleteBill);

export default router;
