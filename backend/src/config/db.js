import mongoose from "mongoose";
import { env, validateEnv } from "./env.js";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  try {
    validateEnv();

    await mongoose.connect(env.mongoUri);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
