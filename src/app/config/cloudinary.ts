import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = env.CLOUDINARY_API_KEY?.trim();
const apiSecret = env.CLOUDINARY_API_SECRET?.trim();

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Missing Cloudinary environment variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env",
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
