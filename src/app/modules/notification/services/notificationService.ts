import { Notification, INotification } from "../models/Notification";
import { sendEmail } from "../../../utils/mailer";
import { Types } from "mongoose";

type CreateNotificationInput = {
  userId: string | Types.ObjectId;
  type: INotification["type"];
  message: string;
  isRead?: boolean;
  relatedId?: string | Types.ObjectId;
};

export const createNotification = async (data: CreateNotificationInput, sendMail = false, email?: string) => {
  const notification = await Notification.create({
    userId: data.userId,
    type: data.type,
    message: data.message,
    isRead: data.isRead ?? false,
    relatedId: data.relatedId,
  });

  if (sendMail && email) {
    await sendEmail({
      to: email,
      subject: "New Notification",
      text: data.message
    });
  }

  return notification;
};

export const getUserNotifications = async (userId: string) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

export const markNotificationRead = async (id: string) => {
  return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
};
