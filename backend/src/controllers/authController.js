import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { generateToken } from "../utils/generateToken.js";

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

const emailRegex = /^\S+@\S+\.\S+$/;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateRequired = (fields) => {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || String(value).trim() === "")
    .map(([key]) => key);

  if (missing.length) {
    throw createError(`Please provide ${missing.join(", ")}.`);
  }
};

const validatePassword = (password) => {
  if (String(password).length < 6) {
    throw createError("Password must be at least 6 characters long.");
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, avatar } = req.body;

  validateRequired({ name, email, password });

  if (!emailRegex.test(email)) {
    throw createError("Please provide a valid email address.");
  }

  validatePassword(password);

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw createError("An account with this email already exists.", 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "user",
    phone,
    avatar
  });

  return sendSuccess(res, 201, {
    message: "Account created successfully.",
    user: sanitizeUser(user),
    token: generateToken(user._id)
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  validateRequired({ email, password });

  if (!emailRegex.test(email)) {
    throw createError("Please provide a valid email address.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw createError("Invalid email or password.", 401);
  }

  if (user.isBlocked) {
    throw createError("Your account has been blocked. Please contact the administrator.", 403);
  }

  return sendSuccess(res, 200, {
    message: "Login successful.",
    user: sanitizeUser(user),
    token: generateToken(user._id)
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, { user: sanitizeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "avatar"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  if (req.body.email !== undefined) {
    const email = String(req.body.email).toLowerCase().trim();

    if (!emailRegex.test(email)) {
      throw createError("Please provide a valid email address.");
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id }
    });

    if (existingUser) {
      throw createError("This email is already used by another account.", 409);
    }

    req.user.email = email;
  }

  await req.user.save();

  return sendSuccess(res, 200, {
    message: "Profile updated successfully.",
    user: sanitizeUser(req.user)
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  validateRequired({ currentPassword, newPassword, confirmPassword });
  validatePassword(newPassword);

  if (newPassword !== confirmPassword) {
    throw createError("New password and confirm password do not match.");
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.matchPassword(currentPassword))) {
    throw createError("Current password is incorrect.", 401);
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, 200, {
    message: "Password changed successfully."
  });
});
