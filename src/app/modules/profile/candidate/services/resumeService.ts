import { Resume } from "../models/Resume";
import { Types } from "mongoose";
import { CandidateProfile } from "../models/CandidateProfile";

export const uploadResume = async (data: any) => {
  try {
    console.log("📝 Service: Uploading resume with data:", data);
    
    // Validate required fields before processing
    const missingFields: string[] = [];
    if (!data.fileUrl || (typeof data.fileUrl === "string" && data.fileUrl.trim() === "")) {
      missingFields.push("fileUrl");
    }
    if (!data.fileName || (typeof data.fileName === "string" && data.fileName.trim() === "")) {
      missingFields.push("fileName");
    }
    if (!data.candidate) {
      missingFields.push("candidate");
    }
    
    if (missingFields.length > 0) {
      const error: any = new Error(`Missing required fields: ${missingFields.join(", ")}`);
      error.missingFields = missingFields;
      throw error;
    }
    
    // Convert candidate to ObjectId if it's a string
    if (data.candidate && typeof data.candidate === "string" && Types.ObjectId.isValid(data.candidate)) {
      data.candidate = new Types.ObjectId(data.candidate);
    }
    
    console.log("📝 Service: Processed resume data:", data);
    const setPayload: any = {
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      candidate: data.candidate,
    };

    // Optional analysis fields
    if (typeof data.score !== 'undefined') setPayload.score = data.score;
    if (data.scoreBreakdown) setPayload.scoreBreakdown = data.scoreBreakdown;
    if (Array.isArray(data.extractedSkills)) setPayload.extractedSkills = data.extractedSkills;
    if (Array.isArray(data.missingSkills)) setPayload.missingSkills = data.missingSkills;
    if (Array.isArray(data.suggestions)) setPayload.suggestions = data.suggestions;
    if (Array.isArray(data.strengths)) setPayload.strengths = data.strengths;
    if (data.analyzedAt) setPayload.analyzedAt = data.analyzedAt;

    const resume = await Resume.findOneAndUpdate(
      { candidate: data.candidate },
      { $set: setPayload },
      { new: true, upsert: true, runValidators: true }
    );
    console.log("✅ Service: Resume uploaded successfully:", resume?._id);
    return resume;
  } catch (error: any) {
    console.error("❌ Service Error (upload resume):", error.message);
    throw error;
  }
};

export const getResumeByCandidate = async (candidateId: string) => {
  try {
    console.log("📝 Service: Getting resume for candidateId:", candidateId);
    let resume = await Resume.findOne({ candidate: candidateId });

    if (!resume && Types.ObjectId.isValid(candidateId)) {
      const profile = await CandidateProfile.findOne({ user: new Types.ObjectId(candidateId) })
        .select("_id")
        .lean();

      if (profile?._id) {
        resume = await Resume.findOne({ candidate: profile._id });
      }
    }
    
    if (!resume) {
      console.log("⚠️ Service: Resume not found for candidateId:", candidateId);
    } else {
      console.log("✅ Service: Resume found:", resume._id);
    }
    
    return resume;
  } catch (error: any) {
    console.error("❌ Service Error (get resume):", error.message);
    throw error;
  }
};

export const setResumeAnalysis = async (resumeId: string, analysis: any) => {
  try {
    if (!resumeId) throw new Error('resumeId required');
    const update: any = {};
    if (typeof analysis.score !== 'undefined') update.score = analysis.score;
    if (analysis.scoreBreakdown) update.scoreBreakdown = analysis.scoreBreakdown;
    if (Array.isArray(analysis.extractedSkills)) update.extractedSkills = analysis.extractedSkills;
    if (Array.isArray(analysis.missingSkills)) update.missingSkills = analysis.missingSkills;
    if (Array.isArray(analysis.suggestions)) update.suggestions = analysis.suggestions;
    if (Array.isArray(analysis.strengths)) update.strengths = analysis.strengths;
    update.analyzedAt = new Date();

    const resume = await Resume.findByIdAndUpdate(resumeId, { $set: update }, { new: true });
    return resume;
  } catch (error: any) {
    console.error('❌ Service Error (setResumeAnalysis):', error.message);
    throw error;
  }
};