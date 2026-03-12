import { Router } from "express";
import {
  createCompany,
  getCompanies,
  getPendingCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  setCompanyVerification
} from "../controllers/companyController";
import { authMiddleware } from "../../../middleware/auth";

const router = Router();

// CRUD
// router.post("/", createCompany);
// added: accept /create path too so client calling /api/v1/company/create works
router.post("/create", authMiddleware(["recruiter", "admin"]), createCompany);

router.get("/", getCompanies);
router.get("/pending", authMiddleware(["admin"]), getPendingCompanies);
router.get("/:id", getCompany);
router.put("/:id", authMiddleware(["recruiter", "admin"]), updateCompany);
router.put("/:id/verify", authMiddleware(["admin"]), setCompanyVerification);
router.delete("/:id", authMiddleware(["admin"]), deleteCompany);

export default router;