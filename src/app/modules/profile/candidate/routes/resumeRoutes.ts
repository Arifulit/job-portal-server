
import { Router, Request, Response, NextFunction } from "express";
import {
  uploadResumeController,
  getResumeController,
  getCurrentResumeController,
  previewCurrentResumeController,
  downloadCurrentResumeController,
} from "../controllers/resumeController";
import authMiddleware, { optionalAuth } from "../../../../middleware/auth";
import multer from "multer";
import { resumeUpload } from "../../../../middleware/upload";
import asyncHandler from "../../../../utils/asyncHandler";

const router = Router();

const injectBearerTokenFromQuery = (req: Request, _res: Response, next: NextFunction) => {
  const hasAuthHeader = Boolean((req.headers.authorization || "").toString().trim());
  if (hasAuthHeader) {
    next();
    return;
  }

  const rawToken = req.query.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  if (typeof token === "string" && token.trim()) {
    req.headers.authorization = `Bearer ${token.trim()}`;
  }

  next();
};

// Debug middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 Resume Routes - ${req.method} ${req.path} | Original: ${req.originalUrl}`);
  next();
});

// GET /api/v1/candidate/resume - Get current user's resume (if authenticated)
router.get("/", optionalAuth, asyncHandler(getCurrentResumeController));

// GET /api/v1/candidate/resume/preview - Stream current user's resume inline
router.get(
  "/preview",
  injectBearerTokenFromQuery,
  authMiddleware(["candidate"]),
  asyncHandler(previewCurrentResumeController),
);

// GET /api/v1/candidate/resume/download - Stream current user's resume as attachment
router.get(
  "/download",
  injectBearerTokenFromQuery,
  authMiddleware(["candidate"]),
  asyncHandler(downloadCurrentResumeController),
);

const resumeUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  resumeUpload.fields([
    { name: "resume", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (error: any) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Resume file must be within 5MB",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Resume upload failed",
    });
  });
};

// POST /api/v1/candidate/resume - Supports both file upload (form-data) and JSON
router.post(
  "/",
  authMiddleware(["candidate"]),
  resumeUploadMiddleware,
  uploadResumeController,
);

// GET /api/v1/candidate/resume/:candidateId - Get resume by candidate ID
router.get("/:candidateId", optionalAuth, asyncHandler(getResumeController));

export default router;
