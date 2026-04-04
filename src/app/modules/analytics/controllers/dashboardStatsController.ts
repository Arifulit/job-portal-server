import { Request, Response } from "express";
import * as dashboardStatsService from "../services/dashboardStatsService";

const getCurrentUserId = (req: Request): string => {
  const userId = (req.user as any)?.id || (req.user as any)?._id;
  if (!userId) {
    throw new Error("Authentication required");
  }

  return String(userId);
};

export const getAdminDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardStatsService.getAdminDashboardStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load admin dashboard stats",
    });
  }
};

export const getCandidateDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const stats = await dashboardStatsService.getCandidateDashboardStats(userId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    const statusCode = error.message?.includes("Authentication") ? 401 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to load candidate dashboard stats",
    });
  }
};

export const getRecruiterDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const stats = await dashboardStatsService.getRecruiterDashboardStats(userId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    const statusCode = error.message?.includes("Authentication") ? 401 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to load recruiter dashboard stats",
    });
  }
};

export const getRoleBasedDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const role = String((req.user as any)?.role || "").toLowerCase().trim();
    const userId = getCurrentUserId(req);

    if (role === "admin" || role === "super_admin") {
      const stats = await dashboardStatsService.getAdminDashboardStats();
      return res.status(200).json({ success: true, data: stats, role: "admin" });
    }

    if (role === "recruiter" || role === "recruiters" || role === "employer") {
      const stats = await dashboardStatsService.getRecruiterDashboardStats(userId);
      return res.status(200).json({ success: true, data: stats, role: "recruiter" });
    }

    const stats = await dashboardStatsService.getCandidateDashboardStats(userId);
    return res.status(200).json({ success: true, data: stats, role: "candidate" });
  } catch (error: any) {
    const statusCode = error.message?.includes("Authentication") ? 401 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to load dashboard stats",
    });
  }
};