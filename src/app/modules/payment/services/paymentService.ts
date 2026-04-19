// এই service payment create/update/history business logic পরিচালনা করে।
import { Payment, IPayment } from "../models/Payment";

// Create a new payment record
export const createPayment = async (data: IPayment) => {
  return await Payment.create(data);
};

// Update payment status after gateway response
export const updatePaymentStatus = async (transactionId: string, status: "Completed" | "Failed") => {
  return await Payment.findOneAndUpdate({ transactionId }, { status }, { new: true });
};

// Get user payment history
export const getUserPayments = async (userId: string) => {
  return await Payment.find({ user: userId }).sort({ createdAt: -1 });
};
