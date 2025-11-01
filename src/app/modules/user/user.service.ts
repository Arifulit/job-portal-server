// import { getDatabase } from '@/app/config/database';
// import { NotFoundError, ValidationError } from '@/app/utils/errors';
// import { logger } from '@/app/utils/logger';

// export class UserService {
//   static async getUserById(userId: string) {
//     const db = getDatabase();

//     const { data: user, error } = await db
//       .from('users')
//       .select('id, email, full_name, role, phone, company_name, profile_image, is_active, is_verified, created_at, updated_at')
//       .eq('id', userId)
//       .maybeSingle();

//     if (error || !user) {
//       throw new NotFoundError('User not found');
//     }

//     return user;
//   }

//   static async updateProfile(userId: string, updates: any) {
//     const db = getDatabase();

//     const allowedUpdates = ['full_name', 'phone', 'company_name', 'profile_image'];
//     const filteredUpdates: any = {};

//     Object.keys(updates).forEach((key) => {
//       if (allowedUpdates.includes(key)) {
//         filteredUpdates[key] = updates[key];
//       }
//     });

//     filteredUpdates.updated_at = new Date().toISOString();

//     const { data: updatedUser, error } = await db
//       .from('users')
//       .update(filteredUpdates)
//       .eq('id', userId)
//       .select('id, email, full_name, role, phone, company_name, profile_image, is_active, is_verified, updated_at')
//       .single();

//     if (error) {
//       logger.error('Failed to update user profile:', error);
//       throw new ValidationError('Failed to update profile');
//     }

//     return updatedUser;
//   }

//   static async deleteAccount(userId: string) {
//     const db = getDatabase();

//     const { error } = await db.from('users').update({ is_active: false }).eq('id', userId);

//     if (error) {
//       logger.error('Failed to deactivate user account:', error);
//       throw new ValidationError('Failed to delete account');
//     }

//     return { message: 'Account deactivated successfully' };
//   }
// }


// ...existing code...
import mongoose from 'mongoose';
import UserModel from './user.model';
// import UserModel from '@/app/models/user.model';

export const UserService = {
  async getUserById(id: string) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid user id');
    }

    const user = await UserModel.findById(id).lean().exec();
    if (!user) throw new Error('User not found');

    // remove sensitive fields
    if ('password' in user) delete (user as any).password;
    if ('password_hash' in user) delete (user as any).password_hash;

    return user;
  },

  async updateProfile(id: string, payload: Partial<Record<string, any>>) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid user id');
    }

    // allow only safe updatable fields
    const allowed: any = {};
    if (payload.full_name) allowed.full_name = payload.full_name;
    if (payload.phone) allowed.phone = payload.phone;
    if (payload.company_name) allowed.company_name = payload.company_name;
    if (payload.role) allowed.role = payload.role; // restrict in production

    const updated = await UserModel.findByIdAndUpdate(id, { $set: allowed }, { new: true }).lean().exec();
    if (!updated) throw new Error('User not found or update failed');

    if ('password' in updated) delete (updated as any).password;
    if ('password_hash' in updated) delete (updated as any).password_hash;

    return updated;
  },

  async deleteAccount(id: string) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid user id');
    }

    const res = await UserModel.findByIdAndDelete(id).lean().exec();
    if (!res) throw new Error('User not found');
    return { message: 'Account deleted' };
  },
};
// ...existing code...