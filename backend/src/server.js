import app from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";
import { ensureAdmin } from "./utils/ensureAdmin.js";
import { logger } from "./utils/logger.js";

await connectDB();
await ensureAdmin();

const server = app.listen(env.port, () => {
  logger.info(`Stockify API running on port ${env.port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${env.port} is already in use. Stop the existing server or change PORT in .env.`);
    process.exit(1);
  }

  throw error;
});
