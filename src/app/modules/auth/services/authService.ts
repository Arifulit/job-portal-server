// এই service register/login/token/refresh token business logic পরিচালনা করে।


import { User, IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../../../utils/mailer";

const JWT_ACCESS_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

export const registerUser = async (name: string, email: string, password: string, role: IUser["role"]) => {
  // চেক করুন ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে কিনা
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  // নতুন user তৈরি করুন। Password automatically hash হবে pre-save middleware এর মাধ্যমে
  const user = new User({ name, email, password, role, authProvider: "local" });
  await user.save();

  // Create a new object without the password field using destructuring
  const { password: _, ...userResponse } = user.toObject();
  
  return userResponse;
};

export const loginUser = async (email: string, password: string) => {
  // User খুঁজুন এবং স্পষ্টভাবে password field select করুন
  const user = await User.findOne({ email }).select("+password");
  
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password) {
    throw new Error("This account uses Google login. Please continue with Google.");
  }

  // Password verify করুন
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error("Password incorrect");
  }

  // Remove password field from response using destructuring
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: pwd, ...userResponse } = user.toObject();
  
  return { user: userResponse };
};

export const findOrCreateGoogleUser = async ({
  googleId,
  email,
  name,
  avatar,
}: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedAvatar = avatar?.trim() || "";
  const normalizedGoogleId = googleId.trim();

  let user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      name: normalizedName,
      avatar: normalizedAvatar,
      role: "candidate",
      authProvider: "google",
      googleId: normalizedGoogleId,
      isEmailVerified: true,
    });

    const { password: _createdPassword, ...createdUser } = user.toObject();
    return createdUser;
  }

  const updates: Partial<
    Pick<IUser, "name" | "avatar" | "isEmailVerified" | "authProvider" | "googleId">
  > = {};

  if (normalizedName && user.name !== normalizedName) {
    updates.name = normalizedName;
  }

  if (normalizedAvatar && user.avatar !== normalizedAvatar) {
    updates.avatar = normalizedAvatar;
  }

  if (!user.isEmailVerified) {
    updates.isEmailVerified = true;
  }

  if (user.authProvider !== "google") {
    updates.authProvider = "google";
  }

  if (!user.googleId || user.googleId !== normalizedGoogleId) {
    updates.googleId = normalizedGoogleId;
  }

  if (Object.keys(updates).length > 0) {
    user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true }).select("+password");
  }

  if (!user) {
    throw new Error("Failed to load Google user");
  }

  const { password: _password, ...userResponse } = user.toObject();
  return userResponse;
};

export const signToken = (
  payload: object, 
  expiresIn: string | number = "24h"
): string => {
  return jwt.sign(
    payload, 
    JWT_ACCESS_SECRET as jwt.Secret, 
    { 
      expiresIn: expiresIn as string,
      algorithm: 'HS256' // Explicitly set the algorithm
    } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET as jwt.Secret, {
      algorithms: ["HS256"],
    });
    return decoded;
  } catch (_error) {
    throw new Error("Invalid token");
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET as jwt.Secret, {
      algorithms: ["HS256"],
    });
    return decoded;
  } catch (_error) {
    throw new Error("Invalid refresh token");
  }
};

export const generateAccessToken = (userId: string, role: string, email: string): string => {
  const payload = { id: userId, role, email };
  return signToken(payload, "24h");
};

export const generateRefreshToken = (userId: string): string => {
  const payload = { id: userId };
  return jwt.sign(payload, JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: "30d",
    algorithm: "HS256",
  });
};

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  // Find user (do not reveal whether user exists)
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // Return silently to avoid account enumeration
    return;
  }

  // Create a secure token and store its hash
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.set("passwordResetToken", hashedToken);
  user.set("passwordResetExpires", new Date(Date.now() + 60 * 60 * 1000)); // 1 hour

  await user.save();

  // Send password reset email with the raw token
  await sendPasswordResetEmail(user.email, resetToken);
};

export const resetPassword = async (token: string, newPassword: string) => {
  if (!token) throw new Error("Invalid or missing token");
  if (!newPassword || String(newPassword).length < 6) throw new Error("Password must be at least 6 characters");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    throw new Error("Token is invalid or has expired");
  }

  user.password = newPassword;
  user.passwordResetToken = undefined as any;
  user.passwordResetExpires = undefined as any;

  await user.save();
};

// Optional: Refresh token database এ save করার function
export const saveRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(userId, { refreshToken });
  } catch (_error) {
    throw new Error("Failed to save refresh token");
  }
};

// Optional: Refresh token database থেকে মুছে ফেলার function
export const removeRefreshToken = async (userId: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  } catch (_error) {
    throw new Error("Failed to remove refresh token");
  }
};

// Optional: Refresh token validate করার function
export const validateRefreshToken = async (refreshToken: string): Promise<boolean> => {
  try {
    const decoded: any = verifyToken(refreshToken);
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken: refreshToken 
    });

    return !!user; // User পাওয়া গেলে true, না হলে false
  } catch (_error) {
    return false;
  }
};

// Optional: User এর refresh token verify করার function
export const isValidRefreshTokenForUser = async (userId: string, refreshToken: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ 
      _id: userId, 
      refreshToken: refreshToken 
    });
    return !!user;
  } catch (_error) {
    return false;
  }
};