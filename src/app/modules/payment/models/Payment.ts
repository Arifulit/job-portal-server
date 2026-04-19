// এই model payment transaction schema এবং status tracking define করে।
import { Schema, model, Types } from "mongoose";

export interface IPayment {
  user: Types.ObjectId;
  plan: "Basic" | "Standard" | "Premium";
  amount: number;
  status: "Pending" | "Completed" | "Failed";
  transactionId?: string;
  paymentMethod?: string;
}

const paymentSchema = new Schema<IPayment>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["Basic", "Standard", "Premium"], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  transactionId: { type: String },
  paymentMethod: { type: String }
}, { timestamps: true });

export const Payment = model<IPayment>("Payment", paymentSchema);
