/* eslint-disable no-console */
import "dotenv/config";
import { createServer, Server } from "http";
import mongoose from "mongoose";
import { env } from "./app/config/env";
import app from "./app";
import { initSocketServer } from "./app/integrations/socket";

let server: Server | undefined;

const startServer = async () => {
  try {
    const dbUrl = env.DB_URL;
    if (!dbUrl) {
      throw new Error("Database URL not provided. Set DB_URL, DB_URI, or MONGODB_URI in environment or .env");
    }

    await mongoose.connect(dbUrl, {
      // recommended options if needed (depends on mongoose version)
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    } as mongoose.ConnectOptions);

    console.log("Connected to MongoDB successfully");

    // Create a raw HTTP server so Socket.IO can share the same port
    const httpServer = createServer(app);
    initSocketServer(httpServer);

    const port = env.PORT;
    server = httpServer.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
      console.log(`Socket.IO is ready on ws://localhost:${port}`);
    });
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