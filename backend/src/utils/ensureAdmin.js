import User from "../models/User.js";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export const ensureAdmin = async () => {
  if (!env.adminName || !env.adminEmail || !env.adminPassword) {
    logger.warn("Admin bootstrap skipped because ADMIN_NAME, ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
    return;
  }

  const email = env.adminEmail.toLowerCase().trim();
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    let changed = false;

    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      changed = true;
    }

    if (existingAdmin.isBlocked) {
      existingAdmin.isBlocked = false;
      changed = true;
    }

    if (changed) {
      await existingAdmin.save();
      logger.info(`Admin access restored for ${email}.`);
    }

    return;
  }

  await User.create({
    name: env.adminName,
    email,
    password: env.adminPassword,
    phone: env.adminPhone,
    role: "admin"
  });

  logger.info(`Admin account created for ${email}.`);
};
