// এই ফাইলটি MongoDB connection retry/reuse logic পরিচালনা করে।
import mongoose from "mongoose";
import { env } from "./env";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let connectPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
  const maxAttempts = 3;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await mongoose.connect(env.DB_URI, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          family: 4,
        } as mongoose.ConnectOptions);
        break;
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }
        console.warn(
          `MongoDB connection attempt ${attempt}/${maxAttempts} failed. Retrying in 2s...`
        );
        await wait(2000);
      }
    }
    console.log("✅ MongoDB connected");
    return mongoose;
  } catch (error) {
    const err = error as NodeJS.ErrnoException & Record<string, unknown>;
    const isAtlasSrvLookupError =
      (err?.code === "ETIMEOUT" || err?.code === "ECONNREFUSED") &&
      (err?.syscall === "queryTxt" || err?.syscall === "querySrv") &&
      typeof err?.hostname === "string";

    if (isAtlasSrvLookupError && env.DB_URI.startsWith("mongodb+srv://")) {
      console.error("MongoDB Atlas SRV lookup failed.");
      console.error("Fix options:");
      console.error("1) Use local MongoDB URL: mongodb://localhost:27017/job-portal-api");
      console.error("2) Switch DNS to 8.8.8.8 or 1.1.1.1");
      console.error("3) Use Atlas non-SRV MongoDB URI");
    }

    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
  })().catch((error) => {
    connectPromise = null;
    throw error;
  });

  return connectPromise;
};
