import cors from "cors";

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, "");

const isAllowedOrigin = (origin: string) => {
  const normalizedOrigin = normalizeOrigin(origin);

  const exactAllowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://job-portal-client-jade-one.vercel.app",
  ];

  if (exactAllowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const parsedOrigin = new URL(normalizedOrigin);
    if (/^(localhost|127\.0\.0\.1)$/.test(parsedOrigin.hostname)) {
      return true;
    }

    if (/\.vercel\.app$/i.test(parsedOrigin.hostname)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
