import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires_at: Date;
  created_at: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
});

const RefreshTokenModel = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);

export default RefreshTokenModel;
