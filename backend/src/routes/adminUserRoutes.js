import express from "express";
import { getUsers, toggleUserBlock, updateUserRole } from "../controllers/adminUserController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/block", toggleUserBlock);

export default router;
