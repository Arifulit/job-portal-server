// এই model user account schema এবং password verification rule define করে।


import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  avatar?: string;
  authProvider?: "local" | "google";
  googleId?: string;
  role: 'candidate' | 'recruiter' | 'admin';
  savedJobs?: mongoose.Types.ObjectId[];
  isRecruiterApproved?: boolean;
  recruiterApprovedAt?: Date;
  recruiterApprovedBy?: mongoose.Types.ObjectId;
  isEmailVerified: boolean;
  isSuspended?: boolean;
  refreshToken?: string;
  isPasswordCorrect(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      sparse: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
      default: 'candidate',
    },
    savedJobs: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
      default: [],
    },
    isRecruiterApproved: {
      type: Boolean,
    },
    recruiterApprovedAt: {
      type: Date,
    },
    recruiterApprovedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Password hash করার জন্য pre-save middleware
userSchema.pre('save', async function (next) {
  // Keep recruiter approval fields only on recruiter documents.
  if (this.role !== 'recruiter') {
    this.set('isRecruiterApproved', undefined);
    this.set('recruiterApprovedAt', undefined);
    this.set('recruiterApprovedBy', undefined);
  } else if (typeof this.isRecruiterApproved === 'undefined') {
    this.isRecruiterApproved = false;
  }

  // শুধুমাত্র যখন password পরিবর্তিত হয় তখনই hash করা হবে
  if (!this.password) {
    return next();
  }

  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Password verify করার method
userSchema.methods.isPasswordCorrect = async function (password: string) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);