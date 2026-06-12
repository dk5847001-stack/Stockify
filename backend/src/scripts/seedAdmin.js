import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { validateEnv } from "../config/env.js";
import { ensureAdmin } from "../utils/ensureAdmin.js";
import { logger } from "../utils/logger.js";

const seedAdmin = async () => {
  try {
    validateEnv();

    await connectDB();
    await ensureAdmin();
  } catch (error) {
    logger.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
