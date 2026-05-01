import { Router } from "express";
import { predictSalary } from "../controllers/salaryController";
import { authMiddleware } from "../../../middleware/auth";

const router = Router();

// Public prediction endpoint
router.post("/predict", predictSalary);
router.get("/predict", predictSalary);

export default router;
