
import { Router, Request, Response, NextFunction } from "express";
import candidateProfileRoutes from "./candidateProfileRoutes";
import resumeRoutes from "./resumeRoutes";
import { 
  createCandidateProfileController, 
  getCurrentCandidateProfileController,
  updateCurrentCandidateProfileController
} from "../controllers/candidateProfileController";
import authMiddleware, { optionalAuth } from "../../../../middleware/auth";
import asyncHandler from "../../../../utils/asyncHandler";

const router = Router();

console.log("✅ Candidate Routes Loaded");

// Debug middleware to log all requests
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 Candidate Routes - ${req.method} ${req.path} | Original: ${req.originalUrl} | Base: ${req.baseUrl}`);
  next();
});

// Mount profile sub-routes at /profile path
// This makes: GET /api/v1/candidate/profile, POST /api/v1/candidate/profile, GET /api/v1/candidate/profile/:userId, etc.
router.use("/profile", candidateProfileRoutes);

// Mount sub-routes
router.use("/resume", resumeRoutes);

export default router;
