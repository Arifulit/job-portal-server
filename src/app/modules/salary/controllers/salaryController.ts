import { Request, Response } from "express";
import salaryService from "../services/salaryService";

export const predictSalary = async (req: Request, res: Response) => {
  try {
    const payload = {
      skills: req.body?.skills || req.query?.skills && String(req.query.skills).split(","),
      experience: req.body?.experience ?? req.query?.experience ?? 0,
      location: req.body?.location ?? req.query?.location ?? "",
      currency: req.body?.currency ?? req.query?.currency ?? "BDT",
    };

    const result = await salaryService.predictSalaryRange(payload as any);
    return res.status(200).json({ success: true, data: result });
  } catch (error: Error | unknown) {
    return res.status(400).json({ 
      success: false, 
      message: (error as Error).message || "Failed to predict salary" 
    });
  }
};

// Estimate salary for candidate based on their profile
export const estimateCandidateSalary = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as Record<string, unknown>)?._id || (req.user as Record<string, unknown>)?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const { CandidateProfile } = await import("../../profile/candidate/models/CandidateProfile");
    
    // Get candidate profile
    const candidate = await CandidateProfile.findOne({ user: userId }).lean();
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    // Calculate total experience
    const totalExperience = (candidate.experience || []).reduce((sum: number, exp: any) => {
      return sum + (exp.yearsOfExperience || 0);
    }, 0);

    const payload = {
      skills: candidate.skills || [],
      experience: totalExperience,
      location: candidate.address || "",
      currency: "BDT",
    };

    const result = await salaryService.predictSalaryRange(payload as any);
    
    return res.status(200).json({
      success: true,
      message: "Estimated salary based on your profile",
      data: {
        ...result,
        profile: {
          skills: candidate.skills || [],
          experience: totalExperience,
          location: candidate.address || "Not specified",
        },
      },
    });
  } catch (error: Error | unknown) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Failed to estimate salary",
    });
  }
};

export default { predictSalary, estimateCandidateSalary };
