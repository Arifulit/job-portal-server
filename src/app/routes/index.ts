
// src/routes/index.ts
import { Router } from "express";
import candidateRoutes from "../modules/profile/candidate/routes"; // direct candidate routes
// // Employer routes removed
import jobRoutes from "../modules/job/routes/jobRoutes";
import applicationRoutes from "../modules/application/routes/applicationRoutes";
import paymentRoutes from "../modules/payment/routes/paymentRoutes";
import auditRoutes from "../modules/audit/routes/auditRoutes";
import companyRoutes from "../modules/company/routes/companyRoutes";
import recruitmentAgencyRoutes from "../modules/agency/routes/recruitmentAgency.routes";
import authRoutes from "../modules/auth";
import recruiterRoutes from "../modules/profile/recruiter/routes";
import adminRoutes from "../modules/profile/admin/routes";
import messageRoutes from "../modules/message/routes/messageRoutes";
import notificationRoutes from "../modules/notification/routes/notificationRoutes";

const router = Router();

router.use("/auth", authRoutes);

// Mount candidate routes for backward compatibility
router.use("/candidate", candidateRoutes);
// /api/v1/profile/recruiter/...
router.use("/recruiter", recruiterRoutes);
router.use("/admin", adminRoutes);

router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/payments", paymentRoutes);
router.use("/audit", auditRoutes);
router.use("/company", companyRoutes);
router.use("/agency", recruitmentAgencyRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);

export default router;
