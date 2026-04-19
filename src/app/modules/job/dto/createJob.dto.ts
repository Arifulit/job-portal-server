export interface CreateJobDTO {
  title: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  education?: string[];
  additionalRequirements?: string[];
  businessAreas?: string[];
  jobContext?: string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: "any" | "male" | "female" | "other";
  preferredIndustryExperience?: string;
  preferredExperienceYears?: number;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance";
  salary?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  experience?: string;
  experienceLevel?: "entry" | "mid-level" | "senior" | "lead" | "executive";
  deadline?: Date | string;
  vacancies?: number;
  skills?: string[];
  company: string;
}
