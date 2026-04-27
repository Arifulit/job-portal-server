


import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../../middleware/auth";
import { AuthenticatedRequest } from "../../../../../types/express/index";
import {
  getAllUsersController,
  getAllCandidatesController,
  getAllRecruitersController,
  getAllUsersFromDBController,
  suspendUserController,
  impersonateUserController,
  updateUserRoleController,
  setRecruiterApprovalController,
  rejectRecruiterController,
  getModerationOverviewController,
  deleteUserController
} from "../controllers/userController";

const router = Router();

// Get all users (including admins, recruiters, and candidates)
router.get("/", authMiddleware(["admin"]), getAllUsersController as any);

// Get all users from database (all roles)
router.get("/all", authMiddleware(["admin"]), getAllUsersFromDBController as any);

// Get all candidates
router.get("/candidates", authMiddleware(["admin"]), getAllCandidatesController as any);

// Get all recruiters
router.get("/recruiters", authMiddleware(["admin"]), getAllRecruitersController as any);

// Moderation overview for admin dashboard
router.get("/moderation-overview", authMiddleware(["admin"]), getModerationOverviewController as any);

// Suspend/Unsuspend a user
router.put("/:userId/suspend", authMiddleware(["admin"]), suspendUserController as any);

// Impersonate a user
router.post("/:userId/impersonate", authMiddleware(["admin"]), impersonateUserController as any);

// Update user role - This allows admin to change a user's role
router.put(
  "/:userId/role",
  // Debug middleware
  (req: Request, res: Response, next: NextFunction) => {
    console.log('Role update route hit', {
      params: req.params,
      body: req.body,
      method: req.method,
      url: req.originalUrl,
      headers: req.headers
    });
    next();
  },
  // Authentication and authorization - only admin can change roles
  authMiddleware(["admin"]),
  // Role update controller
  updateUserRoleController
);

// Approve or revoke recruiter approval status
router.put(
  "/:userId/recruiter-approval",
  authMiddleware(["admin"]),
  setRecruiterApprovalController as any
);

// Reject recruiter
router.put(
  "/:userId/reject",
  authMiddleware(["admin"]),
  rejectRecruiterController as any
);

// Delete a user (delete user and related data)
router.delete(
  "/:userId",
  authMiddleware(["admin"]),
  deleteUserController as any
);

export default router;