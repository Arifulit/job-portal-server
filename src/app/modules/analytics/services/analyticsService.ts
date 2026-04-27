import { Job } from "../../job/models/Job";
import { Application } from "../../application/models/Application";
import { Notification } from "../../notification/models/Notification";

// Job Stats
export const getJobStats = async () => {
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: "Active" });
  const closedJobs = await Job.countDocuments({ status: "Closed" });
  return { totalJobs, activeJobs, closedJobs };
};

// Application Stats
export const getApplicationStats = async () => {
  const totalApplications = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({ status: "Pending" });
  const acceptedApplications = await Application.countDocuments({ status: "Accepted" });
  const rejectedApplications = await Application.countDocuments({ status: "Rejected" });

  return { totalApplications, pendingApplications, acceptedApplications, rejectedApplications };
};

// Candidate Engagement: Notification Stats
export const getCandidateEngagement = async () => {
  const totalNotifications = await Notification.countDocuments();
  const unreadNotifications = await Notification.countDocuments({ isRead: false });

  return { totalNotifications, unreadNotifications };
};

// Overall Dashboard Data
export const getDashboardStats = async () => {
  const jobs = await getJobStats();
  const applications = await getApplicationStats();
  const engagement = await getCandidateEngagement();

  return { jobs, applications, engagement };
};
