// import { Router } from "express";
// import multer from 'multer';
// import { scoreCandidateWithAI } from '../../../../integrations/openai/aiRanker';

// /**
//  * Smart Candidate Ranking API
//  * POST /api/candidates/rank
//  * Body: { jobDescription: string, candidates: [{ name, skills, experience }] }
//  * Returns: rankedCandidates: [{ name, score }]
//  */
// const router = Router();

// // Simple skill match + experience scoring
// function calculateScore(jobDescription: string, candidate: any): number {
//   // Example: match skills in jobDescription
//   const requiredSkills = jobDescription
//     .toLowerCase()
//     .match(/\b[a-zA-Z0-9\-\.\+\#]+\b/g) || [];
//   const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
//   let skillMatches = 0;
//   for (const skill of requiredSkills) {
//     if (candidateSkills.includes(skill)) skillMatches++;
//   }
//   // Score: 70% skill match + 30% experience (max 10 years)
//   const skillScore = requiredSkills.length ? (skillMatches / requiredSkills.length) * 70 : 0;
//   const expScore = Math.min(candidate.experience || 0, 10) * 3;
//   return Math.round(skillScore + expScore);
// }

// const upload = multer();

// // Accept JSON body or multipart/form-data (fields only)
// router.post("/rank", upload.none(), (req, res) => {
//   // Be defensive: allow missing or string body from some clients
//   let body: any = req.body ?? {};
//   if (typeof body === "string") {
//     try {
//       body = JSON.parse(body);
//     } catch (e) {
//       return res.status(400).json({ success: false, message: "Request body must be valid JSON" });
//     }
//   }
//   let { jobDescription, candidates } = body;
//   // candidates may be sent as a JSON string in form-data; parse if needed
//   if (typeof candidates === 'string') {
//     try {
//       candidates = JSON.parse(candidates);
//     } catch (e) {
//       // allow simple comma-separated skills? but we require array of objects
//       return res.status(400).json({ success: false, message: "Invalid 'candidates' field: must be a JSON array" });
//     }
//   }
//   if (!jobDescription || !Array.isArray(candidates)) {
//     return res.status(400).json({ success: false, message: "Invalid input: provide 'jobDescription' and 'candidates' array in request body or form fields" });
//   }
//   (async () => {
//     try {
//       const useAI = !!body.ai;
//       let scored: Array<any>;
//       if (useAI) {
//         // Use OpenAI to score each candidate
//         const results = await Promise.all(
//           candidates.map(async (c: any) => {
//             try {
//               const { score, reasons } = await scoreCandidateWithAI(jobDescription, c);
//               return { ...c, score, reasons };
//             } catch (e) {
//               // on error, fallback to simple score
//               return { ...c, score: calculateScore(jobDescription, c), reasons: [(e as Error).message] };
//             }
//           })
//         );
//         scored = results;
//       } else {
//         scored = candidates.map((c: any) => ({ ...c, score: calculateScore(jobDescription, c) }));
//       }

//       const rankedCandidates = scored.sort((a, b) => b.score - a.score).map(({ name, score, reasons }) => ({ name, score, reasons }));
//       return res.json({ success: true, rankedCandidates });
//     } catch (err) {
//       return res.status(500).json({ success: false, message: 'Ranking failed', error: (err as Error).message });
//     }
//   })();
// });

// export default router;


// routes/candidate/candidateRankRoutes.ts
import { Router, json } from "express";
import multer from "multer";
import { scoreCandidateWithAI } from "../../../../integrations/openai/aiRanker";
import authMiddleware from "../../../../middleware/auth";
import { Application } from "../../../application/models/Application";
import { CandidateProfile } from "../models/CandidateProfile";
import { Job } from "../../../job/models/Job";
// import { scoreCandidateWithAI } from "../../../../integrations/gemini/aiRanker";

const router = Router();
const upload = multer();

const normalizeTokens = (value: string): string[] => {
  return value
    .toLowerCase()
    .match(/\b[a-zA-Z0-9\-\.\+\#]+\b/g)
    ?.map((token) => token.trim())
    .filter((token) => token.length > 1) || [];
};

const getCandidateSkills = (candidate: any): string[] => {
  if (!Array.isArray(candidate?.skills)) {
    return [];
  }

  return candidate.skills
    .map((skill: unknown) => String(skill || "").toLowerCase().trim())
    .filter(Boolean);
};

const getCandidateExperienceYears = (candidate: any): number => {
  const experience = candidate?.experience;

  if (typeof experience === "number" && Number.isFinite(experience)) {
    return Math.max(0, experience);
  }

  if (typeof experience === "string") {
    const matchedNumber = experience.match(/\d+(?:\.\d+)?/);
    return matchedNumber ? Math.max(0, Number(matchedNumber[0])) : 0;
  }

  if (Array.isArray(experience)) {
    let totalMonths = 0;

    for (const item of experience) {
      const startDate = item?.startDate ? new Date(item.startDate) : null;
      const endDate = item?.endDate ? new Date(item.endDate) : new Date();

      if (startDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate >= startDate) {
        const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, diffMonths);
      }
    }

    return Math.round((totalMonths / 12) * 10) / 10;
  }

  return 0;
};

const buildJobDescription = (job: any): string => {
  const parts = [
    job?.title,
    job?.description,
    Array.isArray(job?.skills) ? job.skills.join(" ") : "",
    Array.isArray(job?.requirements) ? job.requirements.join(" ") : "",
    Array.isArray(job?.responsibilities) ? job.responsibilities.join(" ") : "",
    Array.isArray(job?.education) ? job.education.join(" ") : "",
    Array.isArray(job?.additionalRequirements) ? job.additionalRequirements.join(" ") : "",
    job?.experience,
    job?.experienceLevel,
    job?.preferredIndustryExperience,
  ];

  return parts.filter(Boolean).join(" ").trim();
};

const getApplicantsForJob = async (jobId: string) => {
  const job = await Job.findById(jobId)
    .select("title description skills requirements responsibilities education additionalRequirements experience experienceLevel preferredIndustryExperience")
    .lean();

  if (!job) {
    throw new Error("Job not found");
  }

  const applications = await Application.find({ job: jobId })
    .populate("candidate", "name email")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const applicants = await Promise.all(
    applications.map(async (application: any) => {
      const candidateUserId = String(application?.candidate?._id || application?.candidate || "").trim();
      const profile = candidateUserId
        ? await CandidateProfile.findOne({ user: candidateUserId }).lean().exec()
        : null;

      const skills = Array.isArray(profile?.skills) && profile?.skills.length
        ? profile.skills
        : [];

      const experience = Array.isArray(profile?.experience) && profile?.experience.length
        ? profile.experience
        : 0;

      return {
        applicationId: String(application?._id || ""),
        candidateId: candidateUserId,
        name: application?.candidate?.name || profile?.name || "Unknown",
        email: application?.candidate?.email || profile?.email || "",
        skills,
        experience,
        profile,
        application,
      };
    })
  );

  return {
    job,
    jobDescription: buildJobDescription(job),
    applicants,
  };
};

// Auto-fetch all logged-in candidates (active candidates from database)
const getAllCandidates = async () => {
  const profiles = await CandidateProfile.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const candidates = profiles.map((profile: any) => {
    const skills = Array.isArray(profile?.skills) && profile?.skills.length
      ? profile.skills
      : [];

    const experience = Array.isArray(profile?.experience) && profile?.experience.length
      ? profile.experience
      : 0;

    return {
      candidateId: String(profile?.user?._id || profile?._id || ""),
      name: profile?.user?.name || profile?.name || "Unknown",
      email: profile?.user?.email || profile?.email || "",
      skills,
      experience,
      profile,
    };
  });

  return candidates;
};

// Skill-based scoring only (no AI, no experience factor)
function calculateScore(jobDescription: string, candidate: any): number {
  const requiredSkills = normalizeTokens(jobDescription);
  const candidateSkills = getCandidateSkills(candidate);

  const requiredSkillSet = new Set(requiredSkills);
  const candidateSkillSet = new Set(candidateSkills);

  let skillMatches = 0;
  for (const skill of requiredSkillSet) {
    if (candidateSkillSet.has(skill)) skillMatches++;
  }

  // Pure skill match score: (matched skills / required skills) * 100
  const skillScore = requiredSkillSet.size
    ? Math.round((skillMatches / requiredSkillSet.size) * 100)
    : 0;

  return skillScore;
}

// POST /candidate/candidates/rank
// Skill-based ranking - auto-fetches all candidates if no body provided
// Modes:
//  1. No body → rank all candidates in database
//  2. {"jobId": "xxx"} → rank applicants for a specific job
//  3. {"jobDescription": "...", "candidates": [...]} → rank provided candidates
// Score: 0-100 based on skill match percentage only
router.post(
  "/rank",
  authMiddleware(["recruiter"]),
  json({ limit: "10mb", strict: false }),
  upload.none(),
  (req, res) => {
  let body: any = req.body ?? {};

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Request body must be valid JSON" });
    }
  }

  let { jobDescription, candidates, jobId } = body;

  (async () => {
    try {
      let rankingContext = "all_candidates";

      // Mode 1: Rank all candidates (no jobId, no jobDescription)
      if (!jobId && !jobDescription) {
        candidates = await getAllCandidates();
        jobDescription = "General Candidate Ranking";
        rankingContext = "all_candidates";
      }
      // Mode 2: Rank applicants for a specific job
      else if (jobId && !Array.isArray(candidates)) {
        const jobData = await getApplicantsForJob(String(jobId));
        jobDescription = jobDescription || jobData.jobDescription;
        candidates = jobData.applicants;
        rankingContext = `job:${jobId}`;
      }
      // Mode 3: Manual ranking (client provides jobDescription + candidates)
      else if (jobDescription && Array.isArray(candidates)) {
        rankingContext = "manual";
      }
      // Mode 4: Candidates array without description - use generic description
      else if (Array.isArray(candidates) && !jobDescription) {
        jobDescription = "Candidate Ranking";
        rankingContext = "candidates_only";
      }

      if (!jobDescription || !Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No candidates found. Provide jobId to rank job applicants, or send jobDescription + candidates array.",
        });
      }

      // Skill-based scoring for all candidates
      const scored = candidates.map((c: any) => ({
        ...c,
        score: calculateScore(jobDescription, c),
      }));

      const rankedCandidates = scored
        .sort((a, b) => {
          // Sort by skill match score (highest first)
          if (b.score !== a.score) return b.score - a.score;

          // Tie-breaker: by number of skills candidate has
          const aSkills = getCandidateSkills(a).length;
          const bSkills = getCandidateSkills(b).length;
          return bSkills - aSkills;
        })
        .map(({ name, score }) => ({
          name,
          score, // 0-100 skill match percentage
        }));

      return res.json({
        success: true,
        rankingContext,
        ...(jobId ? { jobId: String(jobId) } : {}),
        candidateCount: candidates.length,
        rankedCandidates,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Ranking failed",
        error: (err as Error).message,
      });
    }
  })();
  }
);

export default router;