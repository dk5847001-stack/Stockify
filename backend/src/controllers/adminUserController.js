import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBlocked: user.isBlocked,
  avatar: user.avatar,
  phone: user.phone,
  createdAt: user.createdAt
});

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const filters = {};

  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search).trim(), "i");
    filters.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
  }

  if (req.query.role) {
    filters.role = req.query.role;
  }

  const [users, total] = await Promise.all([
    User.find(filters).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filters)
  ]);

  res.status(200).json({
    success: true,
    users: users.map(sanitizeUser),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    throw createError("Role must be either user or admin.");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw createError("User not found.", 404);
  }

  if (String(user._id) === String(req.user._id) && role !== "admin") {
    throw createError("Admins cannot remove their own admin access.");
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User role updated successfully.",
    user: sanitizeUser(user)
  });
});

export const toggleUserBlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw createError("User not found.", 404);
  }

  if (String(user._id) === String(req.user._id)) {
    throw createError("Admins cannot block or unblock their own account.");
  }

  if (req.body.isBlocked !== undefined && typeof req.body.isBlocked !== "boolean") {
    throw createError("isBlocked must be true or false.");
  }

  user.isBlocked = req.body.isBlocked ?? !user.isBlocked;
  await user.save();

  res.status(200).json({
    success: true,
    message: user.isBlocked ? "User blocked successfully." : "User unblocked successfully.",
    user: sanitizeUser(user)
  });
});
