
import dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "./app/config/validateEnv";
import { initMongoose, closeMongoose } from "./app/config/mongoose";
import type { Server } from "http";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
let server: Server | null = null;

async function startServer() {
  try {
    // ✅ 1️⃣ Validate environment variables
    validateEnv();

    // ✅ 2️⃣ MongoDB Connection
    console.log("⏳ Connecting to MongoDB...");
    await initMongoose(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected successfully");

    // ✅ 3️⃣ Import app after DB connection (to ensure DB-dependent modules load correctly)
    const app = (await import("./app")).default;

    // ✅ 4️⃣ Start the HTTP server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // ✅ 5️⃣ Graceful Shutdown
    const gracefulShutdown = async (signal?: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      if (server) {
        server.close(() => console.log("🧩 HTTP server closed."));
      }
      await closeMongoose();
      console.log("🗄️ MongoDB connection closed.");
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error: any) {
    console.error("❌ Failed to start server:", error.message || error);
    await closeMongoose();
    process.exit(1);
  }
}

startServer();
