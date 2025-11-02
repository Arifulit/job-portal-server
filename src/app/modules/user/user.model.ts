

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  phone?: string;
  company_name?: string;
  is_active: boolean;
  is_verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    role: { type: String, required: true },
    phone: { type: String },
    company_name: { type: String },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default UserModel;
// ...existing code...