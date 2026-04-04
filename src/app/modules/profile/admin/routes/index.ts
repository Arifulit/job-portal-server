import adminProfileRoutes from "./adminProfileRoutes";
import announcementRoutes from "./announcementRoutes";
import userRoutes from "./userRoutes";
import jobAdminRoutes from "../../../../modules/job/routes/adminJobRoutes";
import { Router } from "express";
import { authMiddleware } from "../../../../middleware/auth";
import { getAdminDashboardStatsController } from "../../../analytics/controllers/dashboardStatsController";

const router = Router();

router.use("/profile", adminProfileRoutes);
router.use("/announcement", announcementRoutes);
router.use("/users", userRoutes);
router.use("/jobs", jobAdminRoutes);
router.get("/dashboard/stats", authMiddleware(["admin"]), getAdminDashboardStatsController);
router.get("/stats", authMiddleware(["admin"]), getAdminDashboardStatsController);

export default router;
