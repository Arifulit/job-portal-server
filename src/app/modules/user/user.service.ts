import mongoose from 'mongoose';
import UserModel from './user.model';

const getUserById = async (id: string): Promise<any> => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid user id');
  }

  const user = await UserModel.findById(id).lean().exec();
  if (!user) throw new Error('User not found');

  // remove sensitive fields
  if ('password' in user) delete (user as any).password;
  if ('password_hash' in user) delete (user as any).password_hash;

  return user;
};

const updateProfile = async (id: string, payload: Partial<Record<string, any>>): Promise<any> => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid user id');
  }

  // allow only safe updatable fields
  const allowed: Record<string, any> = {};
  if (payload.full_name) allowed.full_name = payload.full_name;
  if (payload.phone) allowed.phone = payload.phone;
  if (payload.company_name) allowed.company_name = payload.company_name;
  if (payload.role) allowed.role = payload.role; // consider restricting role changes in production

  const updated = await UserModel.findByIdAndUpdate(id, { $set: allowed }, { new: true }).lean().exec();
  if (!updated) throw new Error('User not found or update failed');

  if ('password' in updated) delete (updated as any).password;
  if ('password_hash' in updated) delete (updated as any).password_hash;

  return updated;
};

const deleteAccount = async (id: string): Promise<any> => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid user id');
  }

  const res = await UserModel.findByIdAndDelete(id).lean().exec();
  if (!res) throw new Error('User not found');
  return { message: 'Account deleted' };
};

export const UserService = {
  getUserById,
  updateProfile,
  deleteAccount,
};