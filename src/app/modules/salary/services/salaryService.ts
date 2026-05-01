type PredictInput = {
  skills?: string[];
  experience?: number; // years
  location?: string;
  currency?: string;
};

export const predictSalaryRange = async (input: PredictInput) => {
  const skills = (input.skills || []).map(s => String(s).toLowerCase().trim()).filter(Boolean);
  const experience = Math.max(0, Number(input.experience || 0));
  const location = (input.location || "").toLowerCase().trim();
  const currency = input.currency || "BDT";

  // Base salary (BDT) for 0 years experience
  let base = 20000;

  // Experience factor: each year adds a fixed amount with diminishing returns
  base += Math.min(20, experience) * 5000; // first 20 years ramp

  // Skills factor: more skills -> higher
  const uniqueSkills = Array.from(new Set(skills));
  base += uniqueSkills.length * 2000;

  // Skill premium for specific in-demand skills
  const premiumSkills = ["react", "node", "typescript", "python", "aws", "docker"]; 
  const premiumCount = uniqueSkills.filter(s => premiumSkills.includes(s)).length;
  base += premiumCount * 5000;

  // Location multiplier
  const locationMultipliers: Record<string, number> = {
    dhaka: 1.10,
    chittagong: 1.05,
    sylhet: 1.02,
    remote: 1.15,
  };
  const foundKey = Object.keys(locationMultipliers).find(k => location.includes(k));
  const multiplier = foundKey ? locationMultipliers[foundKey] : 1.0;

  let median = Math.round(base * multiplier);

  // Adjust for seniority beyond 10 years (bonus)
  if (experience > 10) {
    median = Math.round(median * (1 + Math.min(0.25, (experience - 10) * 0.01)));
  }

  // Range +/- 15% (wider for junior roles)
  const spread = experience < 2 ? 0.25 : 0.15;
  const min = Math.round(median * (1 - spread));
  const max = Math.round(median * (1 + spread));

  return {
    currency,
    median,
    range: {
      min,
      max,
    },
    breakdown: {
      base: Math.round(base),
      multiplier,
      experience,
      skills: uniqueSkills,
      premiumCount,
    },
  };
};

export default { predictSalaryRange };
