// এই ফাইলটি local/standalone runtime entry point; DB connect করে HTTP + Socket server start করে।
import { Server } from "http";
import mongoose from "mongoose";
import { startHttpServer } from "./app/bootstrap";

let server: Server | undefined;

const startServer = async () => {
  try {
    server = await startHttpServer();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// graceful shutdown
const shutdown = (signal: string, code = 0) => async () => {
  console.log(`${signal} received. Shutting down...`);
  try {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      console.log("HTTP server closed.");
    }
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
    process.exit(code);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown("SIGTERM"));
process.on("SIGINT", shutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection. Exiting...", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception. Exiting...", err);
  process.exit(1);
});