import { Router } from "express";
import multer from 'multer';
import { Types } from 'mongoose';
import { CandidateProfile } from "../models/CandidateProfile";
import { Job } from "../../../job/models/Job";

const router = Router();
const upload = multer();

function normalizeTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function normalizeSkillsArray(values: unknown): string[] {
  if (!values) return [];
  if (typeof values === 'string') {
    try {
      const parsed = JSON.parse(values);
      if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.toLowerCase().trim());
    } catch (e) {
      // if not JSON, treat as comma separated
      return values.split(',').map((s) => String(s).toLowerCase().trim()).filter(Boolean as any);
    }
  }
  if (Array.isArray(values)) return values.map(String).map((s) => s.toLowerCase().trim());
  return [];
}

// POST /gap
// Mode 1: Manual mode - Accepts either JSON or form-data (fields only).
//   Body: { jobDescription?: string, jobSkills?: string[] , candidateSkills: string[] }
// Mode 2: Auto-fetch mode - Fetch candidate skills and job skills from DB
//   Body: { userId: string, jobId: string }
// Returns: { success: true, missingSkills: string[] }
router.post('/gap', upload.none(), async (req, res) => {
  try {
    let body: any = req.body ?? {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Request body must be valid JSON' });
      }
    }

    const { jobDescription, jobSkills, candidateSkills, userId, jobId } = body;

    // Mode 2: Auto-fetch mode - userId and jobId provided
    if (userId && jobId) {
      try {
        // Fetch candidate profile
        const candidateProfile = await CandidateProfile.findOne({ user: new Types.ObjectId(userId) }).lean().exec();
        if (!candidateProfile || !candidateProfile.skills) {
          return res.status(400).json({ success: false, message: "Candidate profile or skills not found" });
        }

        // Fetch job
        const job = await (Job as any).findById(new Types.ObjectId(jobId)).lean().exec();
        if (!job) {
          return res.status(400).json({ success: false, message: "Job not found" });
        }

        // Extract candidate skills
        const candidate = normalizeSkillsArray(candidateProfile.skills);
        if (!candidate.length) {
          return res.status(400).json({ success: false, message: "Candidate has no skills" });
        }

        // Extract required skills from job
        let required: string[] = [];
        if (job.skills && Array.isArray(job.skills) && job.skills.length) {
          required = normalizeSkillsArray(job.skills);
        } else if (typeof job.description === 'string' && job.description.trim()) {
          required = normalizeTokens(job.description);
        }

        if (!required.length) {
          return res.status(400).json({ success: false, message: "Job has no skills or description" });
        }

        const candidateSet = new Set(candidate.map((s) => s.toLowerCase()));
        const missing = required.filter((r) => !candidateSet.has(r)).map((s) => s.toLowerCase());
        const missingUnique = Array.from(new Set(missing));

        return res.json({ success: true, missingSkills: missingUnique });
      } catch (err: any) {
        console.error("Skill gap auto-fetch error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to compute skill gap: " + (err.message || err) });
      }
    }

    // Mode 1: Manual mode - candidateSkills must be provided
    const candidate = normalizeSkillsArray(candidateSkills);
    if (!candidate.length) return res.status(400).json({ success: false, message: "Provide 'candidateSkills' as an array or JSON string" });

    let required: string[] = [];
    if (jobSkills && Array.isArray(jobSkills) && jobSkills.length) {
      required = normalizeSkillsArray(jobSkills);
    } else if (typeof jobDescription === 'string' && jobDescription.trim()) {
      // extract tokens from jobDescription and use as required skills heuristically
      required = normalizeTokens(jobDescription);
    }

    if (!required.length) return res.status(400).json({ success: false, message: "Provide 'jobSkills' array or a non-empty 'jobDescription'" });

    const candidateSet = new Set(candidate.map((s) => s.toLowerCase()));
    const missing = required.filter((r) => !candidateSet.has(r)).map((s) => s.toLowerCase());

    // unique and preserve order
    const missingUnique = Array.from(new Set(missing));

    return res.json({ success: true, missingSkills: missingUnique });
  } catch (err: any) {
    console.error("Skill gap error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
