// ...existing code...
import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "@/app/utils/logger";

let connected = false;

/**
 * Initialize MongoDB connection using MONGODB_URI from env.
 * Returns mongoose.Connection and is safe to call multiple times.
 */
export const initializeDatabase = async (): Promise<mongoose.Connection> => {
  if (connected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error("MONGODB_URI is not defined in environment");
    logger.error("❌ MongoDB URI missing");
    throw err;
  }

  try {
    // mongoose v6+ default options are fine
    await mongoose.connect(uri);
    connected = true;
    logger.info("✅ MongoDB connected successfully");
    return mongoose.connection;
  } catch (error) {
    logger.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
};

/**
 * Get the active mongoose connection.
 * Throws if not connected yet.
 */
export const getDatabase = (): mongoose.Connection => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected. Call initializeDatabase() first.");
  }
  return mongoose.connection;
};

export default mongoose;
// ...existing code...