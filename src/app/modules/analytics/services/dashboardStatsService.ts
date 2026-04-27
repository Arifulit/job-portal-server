import { Types } from "mongoose";
import { User } from "../../auth/models/User";
import { Job } from "../../job/models/Job";
import { Application } from "../../application/models/Application";
import { Notification } from "../../notification/models/Notification";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const getAdminDashboardStats = async () => {
  const [
    totalUsers,
    totalCandidates,
    totalRecruiters,
    totalAdmins,
    suspendedUsers,
    totalJobs,
    pendingJobs,
    approvedJobs,
    rejectedJobs,
    closedJobs,
    totalApplications,
    totalNotifications,
    unreadNotifications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "candidate" }),
    User.countDocuments({ role: "recruiter" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isSuspended: true }),
    Job.countDocuments(),
    Job.countDocuments({ status: "pending" }),
    Job.countDocuments({ status: "approved" }),
    Job.countDocuments({ status: "rejected" }),
    Job.countDocuments({ status: "closed" }),
    Application.countDocuments(),
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: false }),
  ]);

  const applicationCounts = await Application.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return {
    users: {
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalAdmins,
      suspendedUsers,
    },
    jobs: {
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      closedJobs,
    },
    applications: {
      totalApplications,
      byStatus: applicationCounts,
    },
    notifications: {
      totalNotifications,
      unreadNotifications,
    },
  };
};

export const getCandidateDashboardStats = async (userId: string) => {
  const candidateObjectId = toObjectId(userId);

  const [
    totalApplications,
    unreadNotifications,
    totalNotifications,
    availableJobs,
  ] = await Promise.all([
    Application.countDocuments({ candidate: candidateObjectId }),
    Notification.countDocuments({ userId: candidateObjectId, isRead: false }),
    Notification.countDocuments({ userId: candidateObjectId }),
    Job.countDocuments({ status: "approved", isApproved: true }),
  ]);

  const applicationCounts = await Application.aggregate([
    { $match: { candidate: candidateObjectId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return {
    applications: {
      totalApplications,
      byStatus: applicationCounts,
    },
    notifications: {
      totalNotifications,
      unreadNotifications,
    },
    jobs: {
      availableJobs,
    },
  };
};

export const getRecruiterDashboardStats = async (userId: string) => {
  const recruiterObjectId = toObjectId(userId);

  const [
    totalJobs,
    pendingJobs,
    approvedJobs,
    rejectedJobs,
    closedJobs,
  ] = await Promise.all([
    Job.countDocuments({ createdBy: recruiterObjectId }),
    Job.countDocuments({ createdBy: recruiterObjectId, status: "pending" }),
    Job.countDocuments({ createdBy: recruiterObjectId, status: "approved" }),
    Job.countDocuments({ createdBy: recruiterObjectId, status: "rejected" }),
    Job.countDocuments({ createdBy: recruiterObjectId, status: "closed" }),
  ]);

  const recruiterJobs = await Job.find({ createdBy: recruiterObjectId })
    .select("_id")
    .lean();
  const jobIds = recruiterJobs.map((j: any) => j._id);

  let totalApplications = 0;
  let applicationCounts: Array<{ _id: string; count: number }> = [];

  if (jobIds.length > 0) {
    totalApplications = await Application.countDocuments({ job: { $in: jobIds } });
    applicationCounts = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
  }

  return {
    jobs: {
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      closedJobs,
    },
    applications: {
      totalApplications,
      byStatus: applicationCounts,
    },
  };
};