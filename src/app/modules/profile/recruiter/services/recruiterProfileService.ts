import { RecruiterProfile } from "../models/RecruiterProfile";
import { User } from "../../../auth/models/User";
import { Job } from "../../../job/models/Job";
import { Application } from "../../../application/models/Application";
import { Company } from "../../../company/models/Company";
import { Types } from "mongoose";

// dto/index.ts does not export a module; use simple local types until the dto barrel file is fixed
type CreateRecruiterProfileDTO = any;
type UpdateRecruiterProfileDTO = any;

export const createRecruiterProfile = async (data: CreateRecruiterProfileDTO) => {
  return await RecruiterProfile.create(data);
};

export const getRecruiterProfile = async (userId: string) => {
  const profile = await RecruiterProfile.findOne({ user: userId })
    .populate("user", "name email role avatar")
    .populate("company", "name industry size yearOfEstablishment address location website logo email phone description isVerified verifiedAt verifiedBy createdAt updatedAt")
    .lean();

  if (!profile) {
    return null;
  }

  // Calculate stats
  const jobsPosted = await Job.countDocuments({ createdBy: userId });
  
  // Count applications for jobs created by this recruiter
  const recruiterJobIds = await Job.find({ createdBy: userId }).select("_id").lean();
  const jobIdsList = recruiterJobIds.map(job => job._id);
  const applicantsCount = await Application.countDocuments({ job: { $in: jobIdsList } });

  return {
    ...profile,
    jobsPosted,
    applicantsCount,
  };
};

export const updateRecruiterProfile = async (userId: string, data: any) => {
  const { name, email, avatar, ...rest } = data || {};

  // Name/email are stored in User model, so update those separately.
  const userUpdates: Record<string, string> = {};
  if (typeof name === "string" && name.trim()) {
    userUpdates.name = name.trim();
  }
  if (typeof email === "string" && email.trim()) {
    userUpdates.email = email.trim().toLowerCase();
  }
  if (typeof avatar === "string" && avatar.trim()) {
    userUpdates.avatar = avatar.trim();
  }
  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(userId, { $set: userUpdates }, { new: false });
  }

  const normalizedRest = { ...rest } as any;
  if (normalizedRest.biodata !== undefined && normalizedRest.bio === undefined) {
    normalizedRest.bio = normalizedRest.biodata;
  }
  delete normalizedRest.biodata;
  delete normalizedRest.role;
  delete normalizedRest.user;

  // `company` in RecruiterProfile is an ObjectId. If frontend sends a company object,
  // update/create the Company document and keep only ObjectId in profile updates.
  const incomingCompany = normalizedRest.company;
  delete normalizedRest.company;

  const existingRecruiterProfile = await RecruiterProfile.findOne({ user: userId })
    .select("company")
    .lean();

  const profileUpdates: Record<string, unknown> = {};

  if (incomingCompany !== undefined) {
    if (typeof incomingCompany === "string" && Types.ObjectId.isValid(incomingCompany)) {
      profileUpdates.company = incomingCompany;
    } else if (incomingCompany && typeof incomingCompany === "object") {
      const companyPayload = incomingCompany as Record<string, unknown>;
      const companyUpdateData = {
        ...(typeof companyPayload.name === "string" && companyPayload.name.trim()
          ? { name: companyPayload.name.trim() }
          : {}),
        ...(typeof companyPayload.website === "string"
          ? { website: companyPayload.website.trim() }
          : {}),
        ...(typeof companyPayload.description === "string"
          ? { description: companyPayload.description.trim() }
          : {}),
        ...(typeof companyPayload.size === "string" ? { size: companyPayload.size.trim() } : {}),
        ...(typeof companyPayload.industry === "string"
          ? { industry: companyPayload.industry.trim() }
          : {}),
        ...(typeof companyPayload.location === "string"
          ? { location: companyPayload.location.trim() }
          : {}),
        ...(typeof companyPayload.address === "string"
          ? { address: companyPayload.address.trim() }
          : {}),
        ...(typeof companyPayload.phone === "string" ? { phone: companyPayload.phone.trim() } : {}),
        ...(typeof companyPayload.email === "string"
          ? { email: companyPayload.email.trim().toLowerCase() }
          : {}),
        ...(typeof companyPayload.logo === "string" ? { logo: companyPayload.logo.trim() } : {}),
      };

      const incomingCompanyId =
        typeof companyPayload._id === "string" && Types.ObjectId.isValid(companyPayload._id)
          ? companyPayload._id
          : null;

      const existingCompanyId =
        typeof existingRecruiterProfile?.company === "string"
          ? existingRecruiterProfile.company
          : existingRecruiterProfile?.company && typeof existingRecruiterProfile.company === "object"
          ? String(existingRecruiterProfile.company)
          : null;

      const targetCompanyId = incomingCompanyId || existingCompanyId;

      if (targetCompanyId && Types.ObjectId.isValid(targetCompanyId)) {
        if (Object.keys(companyUpdateData).length > 0) {
          await Company.findByIdAndUpdate(targetCompanyId, { $set: companyUpdateData }, { new: false });
        }
        profileUpdates.company = targetCompanyId;
      } else if (Object.keys(companyUpdateData).length > 0 && companyUpdateData.name) {
        const createdCompany = await Company.create(companyUpdateData);
        profileUpdates.company = createdCompany._id;
      }
    }
  }

  const allowedProfileFields = ["phone", "designation", "company", "bio", "location"];
  const directProfileUpdates = Object.fromEntries(
    Object.entries(normalizedRest).filter(([key, value]) => allowedProfileFields.includes(key) && value !== undefined)
  );
  Object.assign(profileUpdates, directProfileUpdates);

  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: userId },
    { $set: profileUpdates },
    { new: true, runValidators: true }
  )
  .populate('user', 'name email role avatar')
  .populate('company', 'name industry size yearOfEstablishment address location website logo email phone description isVerified verifiedAt verifiedBy createdAt updatedAt')
  .lean();
  
  if (!profile) {
    throw new Error('Recruiter profile not found');
  }

  // Calculate stats
  const jobsPosted = await Job.countDocuments({ createdBy: userId });
  
  // Count applications for jobs created by this recruiter
  const recruiterJobIds = await Job.find({ createdBy: userId }).select("_id").lean();
  const jobIdsList = recruiterJobIds.map(job => job._id);
  const applicantsCount = await Application.countDocuments({ job: { $in: jobIdsList } });

  return {
    ...profile,
    jobsPosted,
    applicantsCount,
  };
};
