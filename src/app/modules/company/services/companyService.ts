import { Company, ICompany } from "../models/Company";

export const createCompany = async (data: ICompany) => {
  const normalizedName = String(data.name || "").trim();
  const normalizedEmail = data.email ? String(data.email).trim().toLowerCase() : "";

  if (!normalizedName || !normalizedEmail) {
    throw new Error("Company name and email are required");
  }

  const existing = await Company.findOne({
    $or: [
      { name: { $regex: `^${normalizedName}$`, $options: "i" } },
      { email: normalizedEmail }
    ]
  });
  if (existing) throw new Error("Company already exists with same name or email");

  const company = await Company.create({
    ...data,
    name: normalizedName,
    email: normalizedEmail
  });
  return company;
};

export const getAllCompanies = async () => {
  return await Company.find().lean().exec();
};

export const getPendingCompanies = async () => {
  return await Company.find({ isVerified: { $ne: true } }).sort({ createdAt: -1 }).lean().exec();
};

export const getCompanyById = async (id: string) => {
  const company = await Company.findById(id).lean().exec();
  if (!company) throw new Error("Company not found");
  return company;
};

export const updateCompany = async (id: string, data: Partial<ICompany>) => {
  const normalizedName = data.name ? String(data.name).trim() : undefined;
  const normalizedEmail = data.email ? String(data.email).trim().toLowerCase() : undefined;

  if (normalizedEmail) {
    const existingByEmail = await Company.findOne({ email: normalizedEmail, _id: { $ne: id } });
    if (existingByEmail) {
      throw new Error("Another company already uses this email");
    }
  }

  if (normalizedName) {
    const existingByName = await Company.findOne({
      name: { $regex: `^${normalizedName}$`, $options: "i" },
      _id: { $ne: id }
    });
    if (existingByName) {
      throw new Error("Another company already uses this name");
    }
  }

  const updated = await Company.findByIdAndUpdate(id, data, { new: true });
  if (!updated) throw new Error("Company not found");
  return updated;
};

export const deleteCompany = async (id: string) => {
  const deleted = await Company.findByIdAndDelete(id);
  if (!deleted) throw new Error("Company not found");
  return deleted;
};
