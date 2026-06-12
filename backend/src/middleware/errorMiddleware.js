import { env } from "../config/env.js";

export const notFound = (req, _res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Server error";

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id provided.";
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(" ");
  }

  if (error.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(error.keyValue || {})[0] || "field";
    message = `A record with this ${duplicateField} already exists.`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.nodeEnv === "production" ? undefined : error.stack
  });
};
