import { Request, Response } from "express";
import { getJobRecommendations } from "../../../../integrations/openai/jobRecommender";

/**
 * GET /api/v1/candidate/profile/recommendations
 * Returns AI-powered job recommendations for the authenticated candidate.
 * Query param: ?limit=10 (default 10, max 20)
 */
export async function getRecommendationsController(
  req: Request,
  res: Response
): Promise<void> {
  const user = req.user as any;
  const candidateUserId = user?.id || user?._id;
  if (!candidateUserId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const rawLimit = Number(req.query.limit) || 10;
  const limit = Math.min(rawLimit, 20);

  const jobs = await getJobRecommendations(String(candidateUserId), limit);

  res.status(200).json({
    success: true,
    message: "Job recommendations generated successfully",
    count: jobs.length,
    data: jobs,
  });
}
