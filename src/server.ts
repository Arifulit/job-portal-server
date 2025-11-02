
import dotenv from "dotenv";
dotenv.config(); // load .env first

// import { validateEnv } from "./app/config/validateEnv";
import { initializeDatabase } from "./app/config/database";
// import { connectRedis } from "./app/config/redis.config";
import app from "./app";
import { validateEnv } from "./app/config/validateEnv";

validateEnv(); // throws and exits if required env vars are missing

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await initializeDatabase();

    // Optional Redis (will skip if REDIS_HOST not set)
    // await connectRedis();

    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "production"} mode`
      );
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // Graceful handling for unhandled promise rejections
    process.on("unhandledRejection", (reason: any) => {
      console.error("❌ Unhandled Promise Rejection:", reason?.message || reason);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err: any) => {
      console.error("❌ Uncaught Exception:", err?.message || err);
      process.exit(1);
    });
  } catch (error: any) {
    console.error("❌ Failed to start server:", error?.message || error);
    process.exit(1);
  }
};

startServer();
// ...existing code...