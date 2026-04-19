import { getEmbedding } from "./index";
import { Job } from "../../modules/job/models/Job";
import { CandidateProfile } from "../../modules/profile/candidate/models/CandidateProfile";
import { Experience } from "../../modules/profile/candidate/models/Experience";
import { Education } from "../../modules/profile/candidate/models/Education";

interface CandidateContext {
  profile: {
    _id: unknown;
    name?: string;
    bio?: string;
    skills?: string[];
    address?: string;
    experience?: Array<{
      role: string;
      company: string;
      description?: string;
    }>;
    education?: Array<{
      degree: string;
      fieldOfStudy?: string;
      institution: string;
    }>;
  };
  experiences: { role: string; company: string; description?: string }[];
  educations: { degree: string; fieldOfStudy?: string; institution: string }[];
}

interface CacheEntry {
  vector: number[];
  cachedAt: number;
}

const jobEmbeddingCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

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

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
}

function normalizeExperienceItems(
  values: unknown
): { role: string; company: string; description?: string }[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => {
      const experience = item as {
        role?: unknown;
        company?: unknown;
        description?: unknown;
      };

      return {
        role: String(experience.role ?? "").trim(),
        company: String(experience.company ?? "").trim(),
        description: String(experience.description ?? "").trim() || undefined,
      };
    })
    .filter((item) => item.role.length > 0 || item.company.length > 0);
}

function normalizeEducationItems(
  values: unknown
): { degree: string; fieldOfStudy?: string; institution: string }[] {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => {
      const education = item as {
        degree?: unknown;
        fieldOfStudy?: unknown;
        institution?: unknown;
      };

      return {
        degree: String(education.degree ?? "").trim(),
        fieldOfStudy: String(education.fieldOfStudy ?? "").trim() || undefined,
        institution: String(education.institution ?? "").trim(),
      };
    })
    .filter((item) => item.degree.length > 0 || item.institution.length > 0);
}

function uniqueBy<T>(items: T[], keySelector: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = keySelector(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function buildExperienceKey(item: {
  role: string;
  company: string;
  description?: string;
}): string {
  return [item.role, item.company, item.description ?? ""].join("|").toLowerCase();
}

function buildEducationKey(item: {
  degree: string;
  fieldOfStudy?: string;
  institution: string;
}): string {
  return [item.degree, item.fieldOfStudy ?? "", item.institution]
    .join("|")
    .toLowerCase();
}

function buildCandidateText(
  profile: { name?: string; bio?: string; skills?: string[]; address?: string },
  experiences: { role: string; company: string; description?: string }[],
  educations: { degree: string; fieldOfStudy?: string; institution: string }[]
): string {
  const parts: string[] = [];

  if (profile.name) parts.push(`Candidate Name: ${profile.name}`);
  if (profile.bio) parts.push(`Profile Summary: ${profile.bio}`);
  if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(", ")}`);
  if (profile.address) parts.push(`Location: ${profile.address}`);

  for (const exp of experiences) {
    parts.push(
      `Work Experience: ${exp.role} at ${exp.company}${exp.description ? " — " + exp.description : ""}`
    );
  }

  for (const edu of educations) {
    parts.push(
      `Education: ${edu.degree}${edu.fieldOfStudy ? " in " + edu.fieldOfStudy : ""} at ${edu.institution}`
    );
  }

  return parts.join("\n").trim();
}

function buildJobText(job: {
  title: string;
  description: string;
  location: string;
  jobType: string;
  experienceLevel?: string;
  skills?: string[];
  requirements?: string[];
  responsibilities?: string[];
}): string {
  const parts: string[] = [
    `Job Title: ${job.title}`,
    `Description: ${job.description}`,
    `Location: ${job.location}`,
    `Type: ${job.jobType}`,
  ];

  if (job.experienceLevel) parts.push(`Experience Level: ${job.experienceLevel}`);
  if (job.skills?.length) parts.push(`Required Skills: ${job.skills.join(", ")}`);
  if (job.requirements?.length) parts.push(`Requirements: ${job.requirements.join(", ")}`);
  if (job.responsibilities?.length) {
    parts.push(`Responsibilities: ${job.responsibilities.join(", ")}`);
  }

  return parts.join("\n");
}

function normalizeTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
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

function filterJobsByCandidateSkills(
  jobs: any[],
  candidateSkillsTokens: Set<string>
): any[] {
  if (!candidateSkillsTokens.size) return [];

  return jobs.filter((job) => {
    const jobSkillTokens = uniqueTokens(
      normalizeStringArray(job.skills).flatMap(normalizeTokens)
    );
    return overlapScore(candidateSkillsTokens, jobSkillTokens) > 0;
  });
}

function getMatchedSkillTokens(
  candidateSkillsTokens: Set<string>,
  jobSkills: unknown
): string[] {
  const jobSkillTokens = uniqueTokens(
    normalizeStringArray(jobSkills).flatMap(normalizeTokens)
  );

  const matched: string[] = [];
  for (const token of candidateSkillsTokens) {
    if (jobSkillTokens.has(token)) matched.push(token);
  }

  return matched;
}

function isEmbeddingProviderError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { message?: string; status?: number; code?: string | number };
  if (e.status === 429 || e.code === 429) return true;
  const msg = (e.message || "").toLowerCase();
  return (
    msg.includes("api key is missing") ||
    msg.includes("invalid api key") ||
    msg.includes("authentication") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("embedding") ||
    msg.includes("openai")
  );
}

async function fetchCandidateContext(candidateUserId: string): Promise<CandidateContext> {
  const profile = await CandidateProfile.findOne({ user: candidateUserId }).lean();
  if (!profile) throw new Error("Candidate profile not found");

  const [storedExperiences, storedEducations] = await Promise.all([
    Experience.find({ candidate: profile._id }).lean(),
    Education.find({ candidate: profile._id }).lean(),
  ]);

  const embeddedExperiences = normalizeExperienceItems((profile as any).experience);
  const embeddedEducations = normalizeEducationItems((profile as any).education);

  const experiences = uniqueBy(
    [...normalizeExperienceItems(storedExperiences), ...embeddedExperiences],
    buildExperienceKey
  );

  const educations = uniqueBy(
    [...normalizeEducationItems(storedEducations), ...embeddedEducations],
    buildEducationKey
  );

  return {
    profile: {
      ...profile,
      name: String((profile as any).name ?? "").trim(),
      bio: String((profile as any).bio ?? (profile as any).biodata ?? "").trim(),
      address: String((profile as any).address ?? (profile as any).location ?? "").trim(),
      skills: normalizeStringArray((profile as any).skills),
      experience: embeddedExperiences,
      education: embeddedEducations,
    },
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
  scored: Array<{ job: any; score: number; matchedSkills: string[] }>,
  topN: number
): JobRecommendation[] {
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ job, score, matchedSkills }) => ({
      _id: String(job._id),
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      skills: job.skills,
      matchedSkills,
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
      "Your profile has no skills, bio, experience, or education yet. Please complete your profile to get recommendations."
    );
  }

  const candidateTokens = uniqueTokens(normalizeTokens(candidateText));
  const candidateSkills = uniqueTokens(
    normalizeStringArray(candidate.profile.skills).flatMap(normalizeTokens)
  );
  if (!candidateSkills.size) {
    throw new Error(
      "Candidate profile skills are required for recommendations. Please add your skills."
    );
  }

  const skillMatchedJobs = filterJobsByCandidateSkills(jobs, candidateSkills);
  if (skillMatchedJobs.length === 0) return [];

  const candidateLocationTokens = uniqueTokens(normalizeTokens(candidate.profile.address || ""));

  const scored = skillMatchedJobs.map((job) => {
    const jobText = buildJobText(job);
    const jobTokens = uniqueTokens(normalizeTokens(jobText));
    const jobSkills = uniqueTokens(normalizeStringArray(job.skills).flatMap(normalizeTokens));
    const jobLocationTokens = uniqueTokens(normalizeTokens(job.location || ""));
    const matchedSkills = getMatchedSkillTokens(candidateSkills, job.skills);

    const textScore = overlapScore(candidateTokens, jobTokens);
    const skillScore = overlapScore(candidateSkills, jobSkills);
    const locationScore = overlapScore(candidateLocationTokens, jobLocationTokens);
    const score = Math.min(1, textScore * 0.45 + skillScore * 0.45 + locationScore * 0.1);

    return { job, score, matchedSkills };
  });

  return mapRecommendations(scored, topN);
}

export interface JobRecommendation {
  _id: string;
  title: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skills: string[];
  matchedSkills: string[];
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

  const [candidate, jobs] = await Promise.all([
    fetchCandidateContext(candidateUserId),
    fetchActiveJobs(),
  ]);

  if (jobs.length === 0) return [];

  const candidateText = buildCandidateText(
    candidate.profile,
    candidate.experiences,
    candidate.educations
  );

  if (!candidateText) {
    throw new Error(
      "Your profile has no skills, bio, experience, or education yet. Please complete your profile to get recommendations."
    );
  }

  try {
    const candidateVector = await getEmbedding(candidateText);
    const candidateTokens = uniqueTokens(normalizeTokens(candidateText));
    const candidateSkills = uniqueTokens(
      normalizeStringArray(candidate.profile.skills).flatMap(normalizeTokens)
    );
    if (!candidateSkills.size) {
      throw new Error(
        "Candidate profile skills are required for recommendations. Please add your skills."
      );
    }

    const skillMatchedJobs = filterJobsByCandidateSkills(jobs, candidateSkills);
    if (skillMatchedJobs.length === 0) return [];

    const candidateLocationTokens = uniqueTokens(normalizeTokens(candidate.profile.address || ""));

    const now = Date.now();
    const scored = await Promise.all(
      skillMatchedJobs.map(async (job) => {
        const jobId = String(job._id);
        const cached = jobEmbeddingCache.get(jobId);

        let jobVector: number[];
        let jobText = buildJobText(job);

        if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
          jobVector = cached.vector;
        } else {
          jobVector = await getEmbedding(jobText);
          jobEmbeddingCache.set(jobId, { vector: jobVector, cachedAt: now });
        }

        const jobTokens = uniqueTokens(normalizeTokens(jobText));
        const jobSkills = uniqueTokens(normalizeStringArray(job.skills).flatMap(normalizeTokens));
        const jobLocationTokens = uniqueTokens(normalizeTokens(job.location || ""));
        const matchedSkills = getMatchedSkillTokens(candidateSkills, job.skills);

        const embeddingScore = cosineSimilarity(candidateVector, jobVector);
        const textScore = overlapScore(candidateTokens, jobTokens);
        const skillScore = overlapScore(candidateSkills, jobSkills);
        const locationScore = overlapScore(candidateLocationTokens, jobLocationTokens);

        return {
          job,
          matchedSkills,
          score: Math.min(
            1,
            embeddingScore * 0.45 + textScore * 0.25 + skillScore * 0.25 + locationScore * 0.05
          ),
        };
      })
    );

    return mapRecommendations(scored, limit);
  } catch (error) {
    if (!isEmbeddingProviderError(error)) {
      throw error;
    }

    return getFallbackRecommendations(candidate, jobs, limit);
  }
}
