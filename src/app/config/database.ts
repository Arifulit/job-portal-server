import mongoose from "mongoose";
import { env } from "./env";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
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
  } catch (error) {
    const err = error as NodeJS.ErrnoException & Record<string, unknown>;
    const isDnsTxtTimeout =
      err?.code === "ETIMEOUT" && err?.syscall === "queryTxt" && typeof err?.hostname === "string";

    if (isDnsTxtTimeout && env.DB_URI.startsWith("mongodb+srv://")) {
      console.error("MongoDB Atlas DNS TXT lookup timed out.");
      console.error("Try switching DNS to 8.8.8.8/1.1.1.1 or using a non-SRV MongoDB URI.");
    }

    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
