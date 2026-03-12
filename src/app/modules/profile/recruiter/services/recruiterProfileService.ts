import { RecruiterProfile } from "../models/RecruiterProfile";
import { User } from "../../../auth/models/User";

// dto/index.ts does not export a module; use simple local types until the dto barrel file is fixed
type CreateRecruiterProfileDTO = any;
type UpdateRecruiterProfileDTO = any;

export const createRecruiterProfile = async (data: CreateRecruiterProfileDTO) => {
  return await RecruiterProfile.create(data);
};

export const getRecruiterProfile = async (userId: string) => {
  return await RecruiterProfile.findOne({ user: userId })
    .populate("user", "name email role")
    .populate("agency", "name");
};

export const updateRecruiterProfile = async (userId: string, data: any) => {
  const { name, ...rest } = data || {};

  // Name is stored in User model, so update it separately.
  if (typeof name === "string" && name.trim()) {
    await User.findByIdAndUpdate(userId, { $set: { name: name.trim() } }, { new: false });
  }

  const allowedProfileFields = ["phone", "designation", "agency", "bio"];
  const profileUpdates = Object.fromEntries(
    Object.entries(rest).filter(([key, value]) => allowedProfileFields.includes(key) && value !== undefined)
  );

  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: userId },
    { $set: profileUpdates },
    { new: true, runValidators: true }
  )
  .populate('user', 'name email role')
  .populate('agency', 'name')
  .lean();
  
  if (!profile) {
    throw new Error('Recruiter profile not found');
  }
  
  return profile;
};
