import { getDatabase } from '@/app/config/database';
import { User, UserRole, TokenPayload } from '@/app/types';
import { PasswordService } from '@/app/utils/password';
import { JWTService } from '@/app/utils/jwt';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '@/app/utils/errors';
import { logger } from '@/app/utils/logger';

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  company_name?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async register(data: RegisterData) {
    const db = getDatabase();

    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await PasswordService.hash(data.password);

    const { data: newUser, error } = await db
      .from('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
        company_name: data.company_name,
        is_active: true,
        is_verified: false,
      })
      .select('id, email, full_name, role, phone, company_name, is_active, is_verified, created_at')
      .single();

    if (error) {
      logger.error('Failed to create user:', error);
      throw new ValidationError('Failed to create user account');
    }

    const tokenPayload: TokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    const tokens = JWTService.generateTokenPair(tokenPayload);

    await this.saveRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: newUser,
      tokens,
    };
  }

  static async login(data: LoginData) {
    const db = getDatabase();

    const { data: user, error } = await db
      .from('users')
      .select('*')
      .eq('email', data.email)
      .maybeSingle();

    if (error || !user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await PasswordService.compare(data.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = JWTService.generateTokenPair(tokenPayload);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  static async refreshAccessToken(refreshToken: string) {
    const db = getDatabase();

    const payload = JWTService.verifyRefreshToken(refreshToken);

    const { data: storedToken } = await db
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('user_id', payload.userId)
      .maybeSingle();

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const isExpired = new Date(storedToken.expires_at) < new Date();
    if (isExpired) {
      await db.from('refresh_tokens').delete().eq('id', storedToken.id);
      throw new UnauthorizedError('Refresh token expired');
    }

    const { data: user } = await db
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', payload.userId)
      .maybeSingle();

    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = JWTService.generateAccessToken(tokenPayload);

    return {
      accessToken: newAccessToken,
    };
  }

  static async logout(userId: string, refreshToken: string) {
    const db = getDatabase();

    await db.from('refresh_tokens').delete().eq('token', refreshToken).eq('user_id', userId);

    return { message: 'Logged out successfully' };
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const db = getDatabase();

    const { data: user } = await db
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isOldPasswordValid = await PasswordService.compare(oldPassword, user.password_hash);

    if (!isOldPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await PasswordService.hash(newPassword);

    const { error } = await db
      .from('users')
      .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new ValidationError('Failed to update password');
    }

    return { message: 'Password changed successfully' };
  }

  private static async saveRefreshToken(userId: string, token: string) {
    const db = getDatabase();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.from('refresh_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    });
  }
}
