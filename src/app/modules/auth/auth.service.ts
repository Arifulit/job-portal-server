import mongoose from 'mongoose';
import { getDatabase } from '@/app/config/database';
import { UserRole, TokenPayload } from '@/app/types';
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
  role?: UserRole | string;
  phone?: string;
  company_name?: string;
}

interface LoginData {
  email: string;
  password: string;
}

const register = async (data: RegisterData) => {
  if (!data || !data.email || !data.password || !data.full_name) {
    throw new ValidationError('email, password and full_name are required');
  }

  const db = getDatabase();
  const usersCol = db.collection('users');

  const email = String(data.email).toLowerCase().trim();
  const role = (data.role as UserRole) || UserRole.JOB_SEEKER || 'job_seeker';

  const existingUser = await usersCol.findOne({ email });
  if (existingUser) throw new ConflictError('User with this email already exists');

  const passwordHash = await PasswordService.hash(data.password);

  const doc: any = {
    email,
    password_hash: passwordHash,
    full_name: data.full_name,
    role,
    phone: data.phone,
    company_name: data.company_name,
    is_active: true,
    is_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let insertRes: any;
  let newUser: any;
  try {
    insertRes = await usersCol.insertOne(doc);
    newUser = await usersCol.findOne({ _id: insertRes.insertedId });
    if (!newUser) {
      logger.error('Failed to retrieve newly created user after insert');
      throw new ValidationError('Failed to create user account');
    }
  } catch (err: any) {
    logger.error('usersCol.insertOne failed', { message: err?.message, code: err?.code });
    if (err && (err.code === 11000 || /duplicate key/i.test(err.message || ''))) {
      throw new ConflictError('User with this email already exists');
    }
    if (process.env.NODE_ENV === 'development') throw err;
    throw new ValidationError('Failed to create user account');
  }

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    logger.error('Missing JWT secrets in environment');
    try {
      await usersCol.deleteOne({ _id: newUser._id });
    } catch (cleanupErr: any) {
      logger.warn('Failed to cleanup user after missing JWT secrets', { err: cleanupErr?.message });
    }
    throw new ValidationError('Server misconfiguration: JWT secrets missing');
  }

  const tokenPayload: TokenPayload = {
    userId: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role,
  };

  let tokens: any;
  try {
    tokens = JWTService.generateTokenPair(tokenPayload);
    if (!tokens || !tokens.refreshToken) {
      logger.error('JWTService.generateTokenPair returned invalid tokens');
      await usersCol.deleteOne({ _id: newUser._id }).catch(() => {});
      throw new ValidationError('Failed to generate authentication tokens');
    }
  } catch (err: any) {
    logger.error('Failed to generate tokens', { message: err?.message });
    await usersCol.deleteOne({ _id: newUser._id }).catch(() => {});
    if (process.env.NODE_ENV === 'development') throw err;
    throw new ValidationError('Failed to create user account');
  }

  try {
    await saveRefreshToken(newUser._id.toString(), tokens.refreshToken);
  } catch (err: any) {
    logger.error('Failed to save refresh token', { message: err?.message });
  }

  const { password_hash, ...safeUser } = newUser as any;

  return {
    user: {
      id: newUser._id.toString(),
      ...safeUser,
    },
    tokens,
  };
};

const login = async (data: LoginData) => {
  if (!data || !data.email || !data.password) {
    throw new ValidationError('email and password are required');
  }

  const db = getDatabase();
  const usersCol = db.collection('users');

  const email = String(data.email).toLowerCase().trim();
  const user = await usersCol.findOne({ email });
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.is_active) throw new UnauthorizedError('Account is deactivated');

  const isPasswordValid = await PasswordService.compare(data.password, user.password_hash);
  if (!isPasswordValid) throw new UnauthorizedError('Invalid email or password');

  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const tokens = JWTService.generateTokenPair(tokenPayload);
  await saveRefreshToken(user._id.toString(), tokens.refreshToken);

  const { password_hash, ...userWithoutPassword } = user as any;

  return {
    user: {
      id: user._id.toString(),
      ...userWithoutPassword,
    },
    tokens,
  };
};

const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) throw new ValidationError('refreshToken is required');

  const db = getDatabase();
  const tokensCol = db.collection('refresh_tokens');
  const usersCol = db.collection('users');

  const payload = JWTService.verifyRefreshToken(refreshToken);

  const storedToken = await tokensCol.findOne({ token: refreshToken, user_id: payload.userId });
  if (!storedToken) throw new UnauthorizedError('Invalid refresh token');

  const isExpired = new Date(storedToken.expires_at) < new Date();
  if (isExpired) {
    await tokensCol.deleteOne({ _id: storedToken._id }).catch(() => {});
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = await usersCol.findOne({ _id: new mongoose.Types.ObjectId(payload.userId) });
  if (!user || !user.is_active) throw new UnauthorizedError('User not found or inactive');

  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const newAccessToken = JWTService.generateAccessToken(tokenPayload);

  return { accessToken: newAccessToken };
};

const logout = async (userId: string, refreshToken: string) => {
  const db = getDatabase();
  const tokensCol = db.collection('refresh_tokens');

  await tokensCol.deleteOne({ token: refreshToken, user_id: userId }).catch(() => {});
  return { message: 'Logged out successfully' };
};

const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const db = getDatabase();
  const usersCol = db.collection('users');

  const user = await usersCol.findOne({ _id: new mongoose.Types.ObjectId(userId) });
  if (!user) throw new NotFoundError('User not found');

  const isOldPasswordValid = await PasswordService.compare(oldPassword, user.password_hash);
  if (!isOldPasswordValid) throw new UnauthorizedError('Current password is incorrect');

  const newPasswordHash = await PasswordService.hash(newPassword);

  const update = await usersCol.updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set: { password_hash: newPasswordHash, updated_at: new Date().toISOString() } }
  );

  if (!update.acknowledged) throw new ValidationError('Failed to update password');

  return { message: 'Password changed successfully' };
};

const saveRefreshToken = async (userId: string, token: string) => {
  const db = getDatabase();
  const tokensCol = db.collection('refresh_tokens');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await tokensCol.insertOne({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
  });
};

export const AuthService = {
  register,
  login,
  refreshAccessToken,
  logout,
  changePassword,
  saveRefreshToken,
};