
import { Router } from "express";
import asyncHandler from "../../../../utils/asyncHandler";
import {
  createCandidateProfileController,
  getCandidateProfileController,
  updateCandidateProfileController,
  getCurrentCandidateProfileController,
  updateCurrentCandidateProfileController
} from "../controllers/candidateProfileController";
import { getRecommendationsController } from "../controllers/recommendationController";
import authMiddleware, { optionalAuth } from "../../../../middleware/auth";

const router = Router();

// GET /api/v1/candidate/profile - Get current user's candidate profile (if authenticated)
router.get("/", optionalAuth, asyncHandler(getCurrentCandidateProfileController));

// GET /api/v1/candidate/profile/recommendations - AI job recommendations (authenticated candidate)
router.get("/recommendations", authMiddleware(["candidate"]), asyncHandler(getRecommendationsController));

// GET /api/v1/candidate/profile/:userId - Public access (optional auth for additional info)
router.get("/:userId", optionalAuth, asyncHandler(getCandidateProfileController));

// POST /api/v1/candidate/profile
router.post("/", authMiddleware(["Candidate"]), asyncHandler(createCandidateProfileController));

// PUT /api/v1/candidate/profile - Update current authenticated candidate profile
router.put("/", authMiddleware(["Candidate"]), asyncHandler(updateCurrentCandidateProfileController));

// PUT /api/v1/candidate/profile/:userId
router.put("/:userId", authMiddleware(["Candidate"]), asyncHandler(updateCandidateProfileController));

export default router;
