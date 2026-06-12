import express from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer
} from "../controllers/customerController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(adminOnly, createCustomer).get(getCustomers);
router
  .route("/:id")
  .get(getCustomerById)
  .put(adminOnly, updateCustomer)
  .delete(adminOnly, deleteCustomer);

export default router;
