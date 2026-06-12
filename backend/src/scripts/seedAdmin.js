import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { env, validateEnv } from "../config/env.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

const seedAdmin = async () => {
  try {
    validateEnv();

    if (!env.adminName || !env.adminEmail || !env.adminPassword) {
      throw new Error("ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required to seed admin.");
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email: env.adminEmail });

    if (existingAdmin) {
      existingAdmin.name = env.adminName;
      existingAdmin.role = "admin";
      existingAdmin.isBlocked = false;
      existingAdmin.phone = env.adminPhone;
      await existingAdmin.save();
    } else {
      await User.create({
        name: env.adminName,
        email: env.adminEmail,
        password: env.adminPassword,
        phone: env.adminPhone,
        role: "admin"
      });
    }
  } catch (error) {
    logger.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedAdmin();
