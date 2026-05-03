
import { Router, Request, Response, NextFunction } from "express";
import candidateProfileRoutes from "./candidateProfileRoutes";
import candidateRankingRoutes from "./candidateRankingRoutes";
import authMiddleware from "../../../../middleware/auth";
import asyncHandler from "../../../../utils/asyncHandler";
import { getCandidateDashboardStatsController } from "../../../analytics/controllers/dashboardStatsController";
import { getApprovedJobs } from "../../../job/controllers/jobController";

const router = Router();

// Debug middleware to log all requests
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 Candidate Routes - ${req.method} ${req.path} | Original: ${req.originalUrl} | Base: ${req.baseUrl}`);
  next();
});

// Mount candidate ranking API
router.use("/candidates", candidateRankingRoutes);

// Mount profile sub-routes at /profile path
// This makes: GET /api/v1/candidate/profile, POST /api/v1/candidate/profile, GET /api/v1/candidate/profile/:userId, etc.
router.use("/profile", candidateProfileRoutes);

// Resume upload depends on Cloudinary and is disabled on Vercel serverless.
const isVercelDeployment = process.env.VERCEL === "1" || process.env.VERCEL === "true";
if (!isVercelDeployment) {
  try {
    // Lazy-load to keep the Cloudinary dependency out of the startup path.
    // Note: This require() is intentional for dynamic lazy-loading on Vercel
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: resumeRoutes } = require("./resumeRoutes") as { default: Router };
    router.use("/resume", resumeRoutes);
  } catch (err) {
    console.warn("Resume routes could not be loaded:", err);
  }
}

// Candidate job list: GET /api/v1/candidate/jobs

router.get(
  "/jobs",
  authMiddleware(["candidate", "admin"]),
  asyncHandler(getApprovedJobs as unknown as (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>)
);

// Candidate dashboard stats
router.get(
  "/dashboard/stats",
  authMiddleware(["candidate"]),
  asyncHandler(getCandidateDashboardStatsController)
);

export default router;
