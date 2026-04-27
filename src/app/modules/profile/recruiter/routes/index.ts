import recruiterProfileRoutes from "./recruiterProfileRoutes";
import agencyRoutes from "./agencyRoutes";
import { Router } from "express";
import { authMiddleware } from "../../../../middleware/auth";
import { getRecruiterDashboardStatsController } from "../../../analytics/controllers/dashboardStatsController";
import { getAllJobs } from "../../../job/controllers/jobController";

const router = Router();

router.use("/", recruiterProfileRoutes);
router.use("/agency", agencyRoutes);
router.get("/dashboard/stats", authMiddleware(["recruiter", "admin"]), getRecruiterDashboardStatsController);
router.get("/jobs", authMiddleware(["recruiter"]), getAllJobs as any);

export default router;
