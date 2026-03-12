import { getEmbedding } from "./index";
import { Job } from "../../modules/job/models/Job";
import { CandidateProfile } from "../../modules/profile/candidate/models/CandidateProfile";
import { Experience } from "../../modules/profile/candidate/models/Experience";
import { Education } from "../../modules/profile/candidate/models/Education";

interface CandidateContext {
  profile: {
    _id: unknown;
    skills?: string[];
    address?: string;
  };
  experiences: { role: string; company: string; description?: string }[];
  educations: { degree: string; fieldOfStudy?: string; institution: string }[];
}

// ---------------------------------------------------------------------------
// In-memory embedding cache — avoids re-calling OpenAI for the same job text
// ---------------------------------------------------------------------------
interface CacheEntry {
  vector: number[];
  cachedAt: number;
}
const jobEmbeddingCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Text builders
// ---------------------------------------------------------------------------
function buildCandidateText(
  profile: { skills?: string[]; address?: string },
  experiences: { role: string; company: string; description?: string }[],
  educations: { degree: string; fieldOfStudy?: string; institution: string }[]
): string {
  const parts: string[] = [];

  if (profile.skills?.length)
    parts.push(`Skills: ${profile.skills.join(", ")}`);

  if (profile.address)
    parts.push(`Location: ${profile.address}`);

  for (const exp of experiences)
    parts.push(
      `Work Experience: ${exp.role} at ${exp.company}${
        exp.description ? " — " + exp.description : ""
      }`
    );

  for (const edu of educations)
    parts.push(
      `Education: ${edu.degree}${
        edu.fieldOfStudy ? " in " + edu.fieldOfStudy : ""
      } at ${edu.institution}`
    );

  return parts.join("\n").trim();
}

function buildJobText(job: {
  title: string;
  description: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skills?: string[];
  requirements?: string[];
}): string {
  const parts: string[] = [
    `Job Title: ${job.title}`,
    `Description: ${job.description}`,
    `Location: ${job.location}`,
    `Type: ${job.jobType}`,
    `Experience Level: ${job.experienceLevel}`,
  ];
  if (job.skills?.length)
    parts.push(`Required Skills: ${job.skills.join(", ")}`);
  if (job.requirements?.length)
    parts.push(`Requirements: ${job.requirements.join(", ")}`);
  return parts.join("\n");
}

function normalizeTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function uniqueTokens(values: string[]): Set<string> {
  return new Set(values);
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }
  return hits / Math.max(a.size, 1);
}

function isEmbeddingProviderError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { message?: string; status?: number; code?: string | number };
  if (e.status === 429 || e.code === 429) return true;
  const msg = (e.message || "").toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("embedding") ||
    msg.includes("openai")
  );
}

async function fetchCandidateContext(candidateUserId: string): Promise<CandidateContext> {
  const profile = await CandidateProfile.findOne({ user: candidateUserId }).lean();
  if (!profile) throw new Error("Candidate profile not found");

  const [experiences, educations] = await Promise.all([
    Experience.find({ candidate: profile._id }).lean(),
    Education.find({ candidate: profile._id }).lean(),
  ]);

  return {
    profile,
    experiences,
    educations,
  };
}

async function fetchActiveJobs() {
  return Job.find({ status: "approved", isApproved: true })
    .populate("company", "name industry logo")
    .lean();
}

function mapRecommendations(
  scored: Array<{ job: any; score: number }>,
  topN: number
): JobRecommendation[] {
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ job, score }) => ({
      _id: String(job._id),
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      skills: job.skills,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      deadline: job.deadline,
      company: job.company,
      relevanceScore: Math.round(score * 100) / 100,
    }));
}

function getFallbackRecommendations(
  candidate: CandidateContext,
  jobs: any[],
  topN: number
): JobRecommendation[] {
  const candidateText = buildCandidateText(
    candidate.profile,
    candidate.experiences,
    candidate.educations
  );
  if (!candidateText) {
    throw new Error(
      "Your profile has no skills, experience, or education yet. Please complete your profile to get recommendations."
    );
  }

  const candidateTokens = uniqueTokens(normalizeTokens(candidateText));

  const scored = jobs.map((job) => {
    const jobText = buildJobText(job);
    const jobTokens = uniqueTokens(normalizeTokens(jobText));
    const score = overlapScore(candidateTokens, jobTokens);
    return { job, score };
  });

  return mapRecommendations(scored, topN);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface JobRecommendation {
  _id: string;
  title: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  deadline?: Date;
  company: unknown;
  relevanceScore: number;
}

export async function getJobRecommendations(
  candidateUserId: string,
  topN = 10
): Promise<JobRecommendation[]> {
  const limit = Math.max(1, Math.min(topN, 20));

  // 1. Fetch candidate context + active jobs in parallel
  const [candidate, jobs] = await Promise.all([
    fetchCandidateContext(candidateUserId),
    fetchActiveJobs(),
  ]);

  if (jobs.length === 0) return [];

  // 2. Build candidate text and generate embedding
  const candidateText = buildCandidateText(
    candidate.profile,
    candidate.experiences,
    candidate.educations
  );
  if (!candidateText)
    throw new Error(
      "Your profile has no skills, experience, or education yet. Please complete your profile to get recommendations."
    );

  try {
    const candidateVector = await getEmbedding(candidateText);

    // 3. Generate / retrieve cached embeddings for each job
    const now = Date.now();
    const scored = await Promise.all(
      jobs.map(async (job) => {
        const jobId = String(job._id);
        const cached = jobEmbeddingCache.get(jobId);

        let jobVector: number[];
        if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
          jobVector = cached.vector;
        } else {
          const jobText = buildJobText(job);
          jobVector = await getEmbedding(jobText);
          jobEmbeddingCache.set(jobId, { vector: jobVector, cachedAt: now });
        }

        return {
          job,
          score: cosineSimilarity(candidateVector, jobVector),
        };
      })
    );

    return mapRecommendations(scored, limit);
  } catch (error) {
    if (!isEmbeddingProviderError(error)) {
      throw error;
    }

    // OpenAI unavailable/quota exceeded -> deterministic local fallback.
    return getFallbackRecommendations(candidate, jobs, limit);
  }
}
