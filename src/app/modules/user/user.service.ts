import { getDatabase } from '@/app/config/database';
import { NotFoundError, ValidationError } from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

export class UserService {
  static async getUserById(userId: string) {
    const db = getDatabase();

    const { data: user, error } = await db
      .from('users')
      .select('id, email, full_name, role, phone, company_name, profile_image, is_active, is_verified, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, updates: any) {
    const db = getDatabase();

    const allowedUpdates = ['full_name', 'phone', 'company_name', 'profile_image'];
    const filteredUpdates: any = {};

    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    filteredUpdates.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await db
      .from('users')
      .update(filteredUpdates)
      .eq('id', userId)
      .select('id, email, full_name, role, phone, company_name, profile_image, is_active, is_verified, updated_at')
      .single();

    if (error) {
      logger.error('Failed to update user profile:', error);
      throw new ValidationError('Failed to update profile');
    }

    return updatedUser;
  }

  static async deleteAccount(userId: string) {
    const db = getDatabase();

    const { error } = await db.from('users').update({ is_active: false }).eq('id', userId);

    if (error) {
      logger.error('Failed to deactivate user account:', error);
      throw new ValidationError('Failed to delete account');
    }

    return { message: 'Account deactivated successfully' };
  }
}
