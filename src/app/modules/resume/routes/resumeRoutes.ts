
// routes/resume/resumeRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import { resumeUpload } from "../../../middleware/upload";
import asyncHandler from "../../../utils/asyncHandler";
import fs from "fs";
import { analyzeResumeWithGemini } from "../../../integrations/openai/resumeParser";
import resumeGenerateRoutes from "./resumeGenerateRoutes";

const router = Router();

const getQueryValue = (value: string | string[] | Record<string, unknown> | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0] as string;
  if (typeof value === 'string') return value;
  return undefined;
};

const getBodyValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0] as string;
  if (typeof value === "string") return value.trim();
  return undefined;
};

const runAnalysis = async (input: { filePath?: string; text?: string; fileBuffer?: Buffer; mimetype?: string }) => {
  console.log("🔍 runAnalysis input:", { filePath: !!input.filePath, text: !!input.text, fileBuffer: !!input.fileBuffer });
  
  try {
    if (input.filePath) {
      console.log("📂 Analyzing from file path:", input.filePath);
      return await analyzeResumeWithGemini(input.filePath, undefined, input.mimetype);
    }

    if (input.fileBuffer && input.fileBuffer.length > 0) {
      console.log("📦 Analyzing from buffer, size:", input.fileBuffer.length, "mimetype:", input.mimetype);
      return await analyzeResumeWithGemini(undefined, input.fileBuffer, input.mimetype || "application/pdf");
    }

    if (input.text) {
      console.log("📝 Analyzing from text, length:", input.text.length);
      return await analyzeResumeWithGemini(undefined, Buffer.from(input.text, "utf-8"), input.mimetype || "text/plain");
    }

    throw new Error("Provide either a file upload, filePath query, or text query.");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Analysis error:", msg);
    throw error;
  }
};

// GET /resume/analyze?text=... or ?filePath=...
router.get("/analyze", asyncHandler(async (req, res) => {
  const filePath = getQueryValue(req.query.filePath as string | string[] | undefined);
  const text = getQueryValue(req.query.text as string | string[] | undefined);
  const mimetype = getQueryValue(req.query.mimetype as string | string[] | undefined);

  if (!filePath && !text) {
    return res.status(400).json({
      success: false,
      message: "Use GET with ?text=... or ?filePath=..., or POST a resume file.",
    });
  }

  const aiResult = await runAnalysis({ filePath, text, mimetype });

  return res.status(200).json({
    success: true,
    data: aiResult,
  });
}));

// Custom middleware to handle both "resume" and "file" field names
const flexibleResumeUpload = (req: Request, res: Response, next: NextFunction) => {
  resumeUpload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Convert .files array to .file if needed
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length > 0) {
      req.file = files[0];
    }
    next();
  });
};

// POST /resume/analyze - Accept multipart form-data with resume file (field: "resume" or "file"), or JSON with text
router.post(
  "/analyze",
  flexibleResumeUpload,
  asyncHandler(async (req, res) => {
    // Try to get text from JSON body or form fields
    const bodyText = getBodyValue((req.body as Record<string, unknown>)?.text as string | string[] | undefined) || 
                     getBodyValue((req.body as Record<string, unknown>)?.resumeText as string | string[] | undefined);
    const file = (req.file as unknown as Express.Multer.File | undefined);

    if (!file && !bodyText) {
      return res.status(400).json({
        success: false,
        message: "Upload a PDF file (field: 'resume' or 'file') or provide 'text' field in request body.",
      });
    }

    let aiResult;
    try {
      if (file) {
        // File was uploaded via multer
        console.log("📄 Analyzing uploaded file:", file.originalname);
        aiResult = await runAnalysis({ filePath: file.path, mimetype: file.mimetype });
        // Clean up temp file
        fs.unlink(file.path, (err) => {
          if (err) console.warn("⚠️ Could not delete temp file:", file.path);
        });
      } else if (bodyText) {
        // Text provided in request body
        console.log("📝 Analyzing plain text resume");
        aiResult = await runAnalysis({ text: bodyText, mimetype: "text/plain" });
      } else {
        return res.status(400).json({
          success: false,
          message: "No resume file or text provided.",
        });
      }

      return res.status(200).json({
        success: true,
        data: aiResult,
      });
    } catch (analysisError: unknown) {
      const errMsg = analysisError instanceof Error ? analysisError.message : String(analysisError);
      console.error("❌ Analysis error:", errMsg);
      if (file) {
        fs.unlink(file.path, () => {});
      }
      throw analysisError;
    }
  })
);

// Mount resume generate route
router.use(resumeGenerateRoutes);

export default router;