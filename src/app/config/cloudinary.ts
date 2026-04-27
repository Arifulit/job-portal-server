import { env } from "./env";

const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = env.CLOUDINARY_API_KEY?.trim();
const apiSecret = env.CLOUDINARY_API_SECRET?.trim();

let cloudinaryModule: any;
let cloudinaryLoadError: Error | null = null;

try {
  // Load lazily and safely so app boot does not crash on non-cloudinary routes.
  cloudinaryModule = require("cloudinary").v2;
} catch (error: any) {
  cloudinaryLoadError = error instanceof Error ? error : new Error(String(error));
  console.error("Cloudinary module failed to load:", cloudinaryLoadError.message);
}

if (cloudinaryModule && cloudName && apiKey && apiSecret) {
  cloudinaryModule.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

const cloudinary = cloudinaryModule ?? {
  config: () => ({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    isFallback: true,
  }),
  url: () => {
    throw new Error(
      cloudinaryLoadError?.message ||
        "Cloudinary is not available. Verify deployment dependencies and environment variables.",
    );
  },
  uploader: {
    upload: async () => {
      throw new Error(
        cloudinaryLoadError?.message ||
          "Cloudinary is not available. Verify deployment dependencies and environment variables.",
      );
    },
  },
};

export default cloudinary;
