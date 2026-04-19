import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, optionalAuth, requireAuth } from "../../../../middleware/auth";
import {
  createAdminController,
  getAdminController,
  updateAdminController,
  getAllAdminsController
} from "../controllers/adminProfileController";
import { AuthenticatedRequest } from "../../../../../types/express";

const router = Router();

// Helper type for request handlers that can be either authenticated or unauthenticated
type RequestHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void | Response>;

// Protected routes (require admin role for create/update/delete)
router.post("/", authMiddleware(["admin"]), createAdminController as RequestHandler);
router.put("/", authMiddleware(["admin"]), updateAdminController as RequestHandler);

// Get current admin's profile
router.get("/", 
  authMiddleware(["admin"]), 
  requireAuth, 
  getAdminController as RequestHandler
);

// Get all admins (admin only)
router.get("/all", 
  authMiddleware(["admin"]), 
  getAllAdminsController as RequestHandler
);

// Get admin profile by ID (public route with optional auth)
router.get("/:id", 
  optionalAuth, 
  (req: Request, res: Response, next: NextFunction) => {
    // This wrapper ensures the request type matches what the controller expects
    return (getAdminController as RequestHandler)(req, res, next);
  }
);

export default router;
