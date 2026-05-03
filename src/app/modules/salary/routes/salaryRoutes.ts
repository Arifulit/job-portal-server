import { Router } from "express";
import { predictSalary, estimateCandidateSalary } from "../controllers/salaryController";
import { authMiddleware } from "../../../middleware/auth";

const router = Router();

// Public prediction endpoint - for anyone to estimate salary
router.post("/predict", predictSalary);
router.get("/predict", predictSalary);

// Authenticated endpoint - candidate can estimate their own salary based on profile
router.get(
	"/estimate/my-salary",
	authMiddleware(["candidate", "recruiter", "admin"]),
	estimateCandidateSalary,
);

// Estimate salary for a specific candidate (recruiter/admin only)
router.post(
	"/estimate",
	authMiddleware(["recruiter", "admin"]),
	predictSalary,
);

export default router;
