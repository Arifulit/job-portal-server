import recruiterProfileRoutes from "./recruiterProfileRoutes";
import { Router } from "express";
import { authMiddleware } from "../../../../middleware/auth";
import { getRecruiterDashboardStatsController } from "../../../analytics/controllers/dashboardStatsController";
import { getAllJobs } from "../../../job/controllers/jobController";
import { json } from "express";
import multer from "multer";
import { rankCandidatesForRecruiter } from "../../../analytics/services/candidateRankingService";

const router = Router();
const upload = multer();

router.use("/", recruiterProfileRoutes);
router.get("/dashboard/stats", authMiddleware(["recruiter", "admin"]), getRecruiterDashboardStatsController);
router.get("/jobs", authMiddleware(["recruiter"]), getAllJobs as any);
router.post(
	"/jobs/:jobId/rank-candidates",
	authMiddleware(["recruiter", "admin"]),
	json({ limit: "10mb", strict: false }),
	upload.none(),
	async (req, res) => {
		try {
			const result = await rankCandidatesForRecruiter({
				jobId: String(req.params.jobId),
				candidates: req.body?.candidates,
				jobDescription: req.body?.jobDescription,
				useAI: Boolean(req.body?.ai),
				requesterId: String((req.user as any)?.id || (req.user as any)?._id || ""),
				requesterRole: String((req.user as any)?.role || ""),
			});

			return res.json(result);
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: "Ranking failed",
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

export default router;
