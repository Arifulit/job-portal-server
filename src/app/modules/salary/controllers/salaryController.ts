import { Request, Response } from "express";
import salaryService from "../services/salaryService";

export const predictSalary = async (req: Request, res: Response) => {
  try {
    const payload = {
      skills: req.body?.skills || req.query?.skills && String(req.query.skills).split(","),
      experience: req.body?.experience ?? req.query?.experience ?? 0,
      location: req.body?.location ?? req.query?.location ?? "",
      currency: req.body?.currency ?? req.query?.currency ?? "BDT",
    };

    const result = await salaryService.predictSalaryRange(payload as any);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export default { predictSalary };
