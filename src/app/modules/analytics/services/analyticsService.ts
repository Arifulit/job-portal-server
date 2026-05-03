import { Job } from "../../job/models/Job";
import { Application } from "../../application/models/Application";
import { Notification } from "../../notification/models/Notification";
import { CandidateProfile } from "../../profile/candidate/models/CandidateProfile";
import { analyzeResumeWithOpenAI } from "../../../integrations/openai/resumeParser";
import OpenAI from "openai";

// Job Stats
export const getJobStats = async () => {
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: "Active" });
  const closedJobs = await Job.countDocuments({ status: "Closed" });
  return { totalJobs, activeJobs, closedJobs };
};

// Application Stats
export const getApplicationStats = async () => {
	const totalApplications = await Application.countDocuments();
	const pendingApplications = await Application.countDocuments({ status: "Applied" });
	const acceptedApplications = await Application.countDocuments({ status: "Accepted" });
	const rejectedApplications = await Application.countDocuments({ status: "Rejected" });

  return { totalApplications, pendingApplications, acceptedApplications, rejectedApplications };
};

// Candidate Engagement: Notification Stats
export const getCandidateEngagement = async () => {
  const totalNotifications = await Notification.countDocuments();
  const unreadNotifications = await Notification.countDocuments({ isRead: false });

  return { totalNotifications, unreadNotifications };
};

// Overall Dashboard Data
export const getDashboardStats = async () => {
  const jobs = await getJobStats();
  const applications = await getApplicationStats();
  const engagement = await getCandidateEngagement();

  return { jobs, applications, engagement };
};


// 1. Smart Candidate Ranking (Recruiter)
export const rankApplicantsForJob = async (jobId: string) => {
  const job = await Job.findById(jobId).lean();
  if (!job) throw new Error("Job not found");
  const applications = await Application.find({ job: jobId }).lean();
  const ranked = [];
  for (const app of applications) {
    let resumeText = "";
    if (app.resume) {
      // Assume resume is stored as text or fetch from file if needed
      resumeText = app.resume;
    } else {
      // Try to get from candidate profile
      const profile = await CandidateProfile.findOne({ user: app.candidate }).lean();
      resumeText = profile?.skills?.join(", ") || "";
    }
    // Use OpenAI or custom logic for scoring
    const analysis = await analyzeResumeWithOpenAI(resumeText);
    // Score: skills match + experience (simple version)
    const jobSkills = job.skills || [];
    const matchedSkills = analysis.extractedSkills?.filter((s: string) => jobSkills.includes(s)) || [];
    const skillScore = matchedSkills.length / (jobSkills.length || 1);
    const totalScore = Math.round((skillScore * 0.7 + (analysis.score || 0) / 100 * 0.3) * 100);
    ranked.push({
      application: app,
      score: totalScore,
      matchedSkills,
      missingSkills: jobSkills.filter((s: string) => !matchedSkills.includes(s)),
      suggestions: analysis.suggestions || [],
    });
  }
  // Sort by score descending
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
};

// 3. AI Resume Builder
export const generateResumeFromProfile = async (userId: string) => {
  const profile = await CandidateProfile.findOne({ user: userId }).lean();
  if (!profile) throw new Error("Profile not found");
  // Use OpenAI to generate resume text
  const openai = new OpenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `Generate a professional resume in markdown format for the following profile.\nName: ${profile.name}\nSkills: ${(profile.skills || []).join(", ")}\nExperience: ${(profile.experience || []).map(e => `${e.role} at ${e.company}`).join("; ")}\nEducation: ${(profile.education || []).map(e => `${e.degree} at ${e.institution}`).join("; ")}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a resume builder." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });
  const resumeMarkdown = completion.choices[0]?.message?.content || "";
  // Optionally convert markdown to PDF (not implemented here)
  return { resumeMarkdown };
};

type SalaryRange = {
  currency: string;
  min: number;
  median: number;
  max: number;
  breakdown: {
    baseSalary: number;
    experienceBonus: number;
    skillsBonus: number;
    premiumSkillBonus: number;
    locationMultiplier: number;
    seniorityBonus: number;
    premiumSkillCount: number;
  };
  salaryText: string;
};

function getTotalExperienceYears(experience: unknown): number {
  if (!Array.isArray(experience)) return 0;

  return experience.reduce((total, item) => {
    const entry = item as Record<string, unknown>;
    const years = typeof entry.yearsOfExperience === "number"
      ? entry.yearsOfExperience
      : typeof entry.years === "number"
        ? entry.years
        : 0;

    return total + years;
  }, 0);
}

function getSalaryLocationMultiplier(location: string): number {
  const normalizedLocation = location.trim().toLowerCase();

  if (!normalizedLocation) return 1;
  if (normalizedLocation.includes("remote")) return 1.15;
  if (normalizedLocation.includes("dhaka")) return 1.1;
  if (normalizedLocation.includes("chittagong") || normalizedLocation.includes("chattogram")) return 1.05;
  if (normalizedLocation.includes("sylhet")) return 1.02;

  return 1;
}

function calculateSalaryRangeFromProfile(profile: Record<string, unknown>, job?: Record<string, unknown> | null): SalaryRange {
  const skills = Array.isArray(profile.skills) ? profile.skills.map((skill) => String(skill).toLowerCase()) : [];
  const experienceYears = getTotalExperienceYears(profile.experience);
  const location = String(job?.location || profile.address || "");

  const baseSalary = 20000;
  const experienceBonus = Math.min(experienceYears, 20) * 5000;

  const premiumSkills = ["react", "node", "node.js", "typescript", "python", "aws", "docker"];
  const premiumSkillCount = skills.filter((skill) => premiumSkills.includes(skill)).length;
  const skillsBonus = skills.length * 2000;
  const premiumSkillBonus = premiumSkillCount * 5000;

  const locationMultiplier = getSalaryLocationMultiplier(location);
  const seniorityBonus = experienceYears > 10 ? Math.round((experienceYears - 10) * 2500) : 0;

  const rawMedian = (baseSalary + experienceBonus + skillsBonus + premiumSkillBonus + seniorityBonus) * locationMultiplier;
  const median = Math.max(0, Math.round(rawMedian));
  const spread = experienceYears < 2 ? 0.25 : 0.15;
  const min = Math.round(median * (1 - spread));
  const max = Math.round(median * (1 + spread));

  const salaryText = `Estimated salary range: ${min.toLocaleString()} - ${max.toLocaleString()} BDT for ${experienceYears} years of experience in ${location || "an unspecified location"}.`;

  return {
    currency: "BDT",
    min,
    median,
    max,
    breakdown: {
      baseSalary,
      experienceBonus,
      skillsBonus,
      premiumSkillBonus,
      locationMultiplier,
      seniorityBonus,
      premiumSkillCount,
    },
    salaryText,
  };
}

// 4. Salary Prediction
export const predictSalary = async (userId: string, jobId?: string) => {
  const profile = await CandidateProfile.findOne({ user: userId }).lean();
  if (!profile) throw new Error("Profile not found");

  const job = jobId ? await Job.findById(jobId).lean() : null;
  const salaryRange = calculateSalaryRangeFromProfile(profile as Record<string, unknown>, job as Record<string, unknown> | null);

  return {
    ...salaryRange,
    job: job
      ? {
          id: String(job._id),
          title: String(job.title || ""),
          location: String(job.location || ""),
        }
      : undefined,
  };
};
