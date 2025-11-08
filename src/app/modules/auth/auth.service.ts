import mongoose from 'mongoose';
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
import UserModel from '../user/user.model';
import RefreshTokenModel from './refreshToken.model';

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

/**
 * ✅ Register New User
 */
const register = async (data: RegisterData) => {
  if (!data?.email || !data?.password || !data?.full_name) {
    throw new ValidationError('email, password and full_name are required');
  }

  const email = data.email.toLowerCase().trim();
  const role = (data.role as UserRole) || UserRole.JOB_SEEKER;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new ConflictError('User with this email already exists');

  const passwordHash = await PasswordService.hash(data.password);

  const newUser = await UserModel.create({
    email,
    password_hash: passwordHash,
    full_name: data.full_name,
    role,
    phone: data.phone,
    company_name: data.company_name,
    is_active: true,
    is_verified: false,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const tokenPayload: TokenPayload = {
    userId: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role,
  };

  const tokens = JWTService.generateTokenPair(tokenPayload);
  await saveRefreshToken(newUser._id.toString(), tokens.refreshToken);

  const userObj = newUser.toObject();
  delete userObj.password_hash;

  return {
    user: { id: newUser._id.toString(), ...userObj },
    tokens,
  };
};

/**
 * ✅ Login Existing User
 */
const login = async (data: LoginData) => {
  if (!data?.email || !data?.password) {
    throw new ValidationError('email and password are required');
  }

  const email = data.email.toLowerCase().trim();
  const user = await UserModel.findOne({ email });

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

  const userObj = user.toObject();
  delete userObj.password_hash;

  return {
    user: { id: user._id.toString(), ...userObj },
    tokens,
  };
};

/**
 * ✅ Refresh Access Token
 */
const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) throw new ValidationError('refreshToken is required');

  const rawPayload = JWTService.verifyRefreshToken(refreshToken);
  if (typeof rawPayload === 'string') throw new UnauthorizedError('Invalid refresh token');
  const payload = rawPayload as TokenPayload;

  const storedToken = await RefreshTokenModel.findOne({
    token: refreshToken,
    user_id: payload.userId,
  });

  if (!storedToken) throw new UnauthorizedError('Invalid refresh token');

  const isExpired = new Date(storedToken.expires_at) < new Date();
  if (isExpired) {
    await RefreshTokenModel.deleteOne({ _id: storedToken._id });
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = await UserModel.findById(payload.userId);
  if (!user || !user.is_active) throw new UnauthorizedError('User not found or inactive');

  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const newAccessToken = JWTService.generateAccessToken(tokenPayload);
  return { accessToken: newAccessToken };
};

/**
 * ✅ Logout
 */
const logout = async (userId: string, refreshToken: string) => {
  await RefreshTokenModel.deleteOne({ user_id: userId, token: refreshToken });
  return { message: 'Logged out successfully' };
};

/**
 * ✅ Change Password
 */
const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const isOldPasswordValid = await PasswordService.compare(oldPassword, user.password_hash);
  if (!isOldPasswordValid) throw new UnauthorizedError('Current password is incorrect');

  const newPasswordHash = await PasswordService.hash(newPassword);
  user.password_hash = newPasswordHash;
  user.updated_at = new Date();

  await user.save();

  return { message: 'Password changed successfully' };
};

/**
 * ✅ Save Refresh Token
 */
const saveRefreshToken = async (userId: string, token: string) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshTokenModel.create({
    user_id: new mongoose.Types.ObjectId(userId),
    token,
    expires_at: expiresAt,
    created_at: new Date(),
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
