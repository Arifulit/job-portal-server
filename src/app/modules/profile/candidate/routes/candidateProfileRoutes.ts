
import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
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
import { avatarUpload } from "../../../../middleware/upload";

const router = Router();

const avatarUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  avatarUpload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (error: any) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Profile picture upload failed",
    });
  });
};

// GET /api/v1/candidate/profile - Get current user's candidate profile (if authenticated)
router.get("/", optionalAuth, asyncHandler(getCurrentCandidateProfileController));

// GET /api/v1/candidate/profile/recommendations - AI job recommendations (authenticated candidate)
router.get("/recommendations", authMiddleware(["candidate"]), asyncHandler(getRecommendationsController));

// GET /api/v1/candidate/profile/:userId - Public access (optional auth for additional info)
router.get("/:userId", optionalAuth, asyncHandler(getCandidateProfileController));

// POST /api/v1/candidate/profile
router.post("/", authMiddleware(["Candidate"]), avatarUploadMiddleware, asyncHandler(createCandidateProfileController));

// PUT /api/v1/candidate/profile - Update current authenticated candidate profile
router.put("/", authMiddleware(["Candidate"]), avatarUploadMiddleware, asyncHandler(updateCurrentCandidateProfileController));

// PUT /api/v1/candidate/profile/:userId
router.put("/:userId", authMiddleware(["Candidate"]), avatarUploadMiddleware, asyncHandler(updateCandidateProfileController));

export default router;
