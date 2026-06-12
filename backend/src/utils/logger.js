import { env } from "../config/env.js";

export const logger = {
  info(message) {
    if (env.nodeEnv !== "production") {
      process.stdout.write(`${message}\n`);
    }
  },
  warn(message) {
    if (env.nodeEnv !== "production") {
      process.stderr.write(`Warning: ${message}\n`);
    }
  },
  error(message) {
    if (env.nodeEnv !== "production") {
      process.stderr.write(`${message}\n`);
    }
  }
};
