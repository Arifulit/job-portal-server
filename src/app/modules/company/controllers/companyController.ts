import { Request, Response } from "express";
import * as companyService from "../services/companyService";

export const createCompany = async (req: Request, res: Response) => {
  try {
    const requesterRole = (req as any).user?.role;
    const payload: any = {
      ...req.body,
      isVerified: req.body?.isVerified ?? req.body?.verified ?? false
    };

    delete payload.verified;

    // Recruiters can create a company, but verification is always pending until admin approves.
    if (requesterRole === 'recruiter') {
      payload.isVerified = false;
      payload.verifiedAt = null;
      payload.verifiedBy = null;
    }

    const company = await companyService.createCompany(payload);
    res.status(201).json({ success: true, data: company });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await companyService.getAllCompanies();
    res.status(200).json({ success: true, data: companies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPendingCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await companyService.getPendingCompanies();
    return res.status(200).json({
      success: true,
      data: companies,
      total: companies.length
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getCompany = async (req: Request, res: Response) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    res.status(200).json({ success: true, data: company });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const payload: any = {
      ...req.body,
      ...(req.body?.verified !== undefined ? { isVerified: Boolean(req.body.verified) } : {})
    };
    delete payload.verified;

    const company = await companyService.updateCompany(req.params.id, payload);
    res.status(200).json({ success: true, data: company });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    await companyService.deleteCompany(req.params.id);
    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
};

export const setCompanyVerification = async (req: Request, res: Response) => {
  try {
    const { approved = true } = req.body || {};
    const adminId = (req.user as any)?._id?.toString() || (req.user as any)?.id?.toString();

    const company = await companyService.updateCompany(req.params.id, {
      isVerified: Boolean(approved),
      verifiedAt: approved ? new Date() : null,
      verifiedBy: approved && adminId ? (adminId as any) : null
    } as any);

    return res.status(200).json({
      success: true,
      message: approved ? 'Company verified successfully' : 'Company verification revoked successfully',
      data: company
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
};
