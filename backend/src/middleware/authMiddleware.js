import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    const error = new Error("Authentication required. Please login to continue.");
    error.statusCode = 401;
    throw error;
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      const error = new Error("Your session is invalid. Please login again.");
      error.statusCode = 401;
      throw error;
    }

    if (req.user.isBlocked) {
      const error = new Error("Your account has been blocked. Please contact the administrator.");
      error.statusCode = 403;
      throw error;
    }

    next();
  } catch (error) {
    if (!error.statusCode) {
      error.message = "Your session has expired or is invalid. Please login again.";
      error.statusCode = 401;
    }
    throw error;
  }
});

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    const error = new Error("Admin access required for this action.");
    error.statusCode = 403;
    return next(error);
  }

  next();
};
